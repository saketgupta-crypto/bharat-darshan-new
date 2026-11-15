import axios, { AxiosError, AxiosRequestConfig } from "axios"

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1"

// Access token lives in memory only (never localStorage). The refresh token is an httpOnly cookie.
let accessToken: string | null = null
export const setAccessToken = (t: string | null) => { accessToken = t }
export const getAccessToken = () => accessToken

export const api = axios.create({ baseURL: API_BASE, withCredentials: true, timeout: 120_000 })

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`
  return cfg
})

let refreshing: Promise<string | null> | null = null
export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= axios
    .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
    .then((r) => { accessToken = r.data.data.accessToken as string; return accessToken })
    .catch(() => { accessToken = null; return null })
    .finally(() => { refreshing = null })
  return refreshing
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined
    const isAuthCall = original?.url?.startsWith("/auth/")
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      const token = await refreshAccessToken()
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` }
        return api(original)
      }
      window.dispatchEvent(new Event("bd:session-expired"))
    }
    return Promise.reject(error)
  }
)

export const errMsg = (e: unknown, fallback = "Something went wrong") => {
  const err = e as AxiosError<{ error?: { message?: string; details?: Record<string, string[]> } }>
  const d = err.response?.data?.error
  if (d?.details) {
    const first = Object.values(d.details).flat()[0]
    if (first) return `${d.message}: ${first}`
  }
  return d?.message || (err.code === "ECONNABORTED" ? "Request timed out" : err.message) || fallback
}

export const unwrap = async <T>(p: Promise<{ data: { data: T } }>): Promise<T> => (await p).data.data
export async function unwrapPaged<T>(p: Promise<{ data: { data: T[]; meta: import("@/types").PageMeta } }>) {
  const r = (await p).data
  return { items: r.data, meta: r.meta }
}
