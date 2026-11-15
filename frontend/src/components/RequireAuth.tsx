import { Navigate, Outlet, useLocation } from "react-router-dom"
import { homeFor, useAuth } from "@/context/AuthContext"
import type { Role } from "@/types"

export function FullPageSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

/** Route guard. UI-level only: every API endpoint is independently protected on the server. */
export default function RequireAuth({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />
  return <Outlet />
}
