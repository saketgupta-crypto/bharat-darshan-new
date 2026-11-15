import { api, setAccessToken, unwrap } from "./api"
import type { ApiUser } from "@/types"

export interface RegisterPayload {
  name: string; email: string; password: string; phone?: string
  asGuide?: boolean
  guide?: { location: string; languages: string[]; experienceYears: number; pricePerDay: number }
}
export const authService = {
  register: (p: RegisterPayload) => unwrap<{ email: string; message: string }>(api.post("/auth/register", p)),
  verifyEmail: (email: string, otp: string) => unwrap<{ message: string }>(api.post("/auth/verify-email", { email, otp })),
  resendOtp: (email: string) => unwrap<{ message: string }>(api.post("/auth/resend-otp", { email })),
  async login(email: string, password: string) {
    const d = await unwrap<{ user: ApiUser; accessToken: string }>(api.post("/auth/login", { email, password }))
    setAccessToken(d.accessToken)
    return d.user
  },
  async logout() {
    try { await api.post("/auth/logout") } finally { setAccessToken(null) }
  },
  forgotPassword: (email: string) => unwrap<{ message: string }>(api.post("/auth/forgot-password", { email })),
  resetPassword: (email: string, token: string, password: string) => unwrap<{ message: string }>(api.post("/auth/reset-password", { email, token, password })),
  me: async () => (await unwrap<{ user: ApiUser }>(api.get("/auth/me"))).user,
}
