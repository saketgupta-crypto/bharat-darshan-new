import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { authService } from "@/services/auth.service"
import { refreshAccessToken, setAccessToken } from "@/services/api"
import type { ApiUser, Permission, Role } from "@/types"

interface AuthCtx {
  user: ApiUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<ApiUser>
  logout: () => Promise<void>
  setUser: (u: ApiUser | null) => void
  hasPermission: (p: Permission) => boolean
}
const Ctx = createContext<AuthCtx | null>(null)

export const homeFor = (role?: Role) =>
  role === "SUPER_ADMIN" ? "/super-admin" : role === "ADMIN" ? "/admin" : role === "GUIDE" ? "/guide" : "/dashboard"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Persistent auth: restore the session from the httpOnly refresh cookie on every page load.
  useEffect(() => {
    let alive = true
    ;(async () => {
      const token = await refreshAccessToken()
      if (token) {
        try { const me = await authService.me(); if (alive) setUser(me) } catch { setAccessToken(null) }
      }
      if (alive) setLoading(false)
    })()
    const expired = () => { setAccessToken(null); setUser(null) }
    window.addEventListener("bd:session-expired", expired)
    return () => { alive = false; window.removeEventListener("bd:session-expired", expired) }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password)
    setUser(u)
    return u
  }, [])
  const logout = useCallback(async () => { await authService.logout().catch(() => undefined); setUser(null) }, [])
  const hasPermission = useCallback((p: Permission) => user?.role === "SUPER_ADMIN" || (user?.role === "ADMIN" && user.permissions.includes(p)), [user])

  const value = useMemo(() => ({ user, loading, login, logout, setUser, hasPermission }), [user, loading, login, logout, hasPermission])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useAuth must be used inside AuthProvider")
  return c
}
