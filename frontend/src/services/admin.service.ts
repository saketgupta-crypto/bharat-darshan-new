import { api, unwrap, unwrapPaged } from "./api"
import type { ApiUser, Guide, Inquiry, Review } from "@/types"

export const adminService = {
  dashboard: () => unwrap<{ counts: Record<string, number>; recentUsers: ApiUser[]; recentActivity: { _id: string; action: string; createdAt: string; actor?: { name: string; email: string } }[] }>(api.get("/admin/dashboard")),
  analytics: () => unwrap<{ registrations: { date: string; count: number }[]; itinerariesPerDay: { date: string; count: number }[]; topDestinations: { _id: string; name: string; viewCount: number; avgRating: number }[]; byStyle: { style: string; count: number }[]; byRole: { role: string; count: number }[] }>(api.get("/admin/analytics")),
  users: (params: Record<string, string | number | undefined>) => unwrapPaged<ApiUser>(api.get("/admin/users", { params })),
  setUserStatus: (id: string, accountStatus: "ACTIVE" | "DISABLED") => unwrap<ApiUser>(api.patch(`/admin/users/${id}/status`, { accountStatus })),
  guides: (status?: string) => unwrap<Guide[]>(api.get("/admin/guides", { params: status ? { status } : {} })),
  createGuide: (d: Partial<Guide>) => unwrap<Guide>(api.post("/admin/guides", d)),
  updateGuide: (id: string, d: Partial<Guide>) => unwrap<Guide>(api.patch(`/admin/guides/${id}`, d)),
  deleteGuide: (id: string) => unwrap<{ message: string }>(api.delete(`/admin/guides/${id}`)),
  reviews: (status?: string) => unwrapPaged<Review>(api.get("/admin/reviews", { params: status ? { status, limit: 50 } : { limit: 50 } })),
  moderateReview: (id: string, status: Review["status"]) => unwrap<Review>(api.patch(`/admin/reviews/${id}`, { status })),
  deleteReview: (id: string) => unwrap<{ message: string }>(api.delete(`/admin/reviews/${id}`)),
  contacts: (status?: string) => unwrapPaged<Inquiry>(api.get("/admin/contacts", { params: status ? { status, limit: 50 } : { limit: 50 } })),
  updateContact: (id: string, d: { status?: Inquiry["status"]; adminNote?: string }) => unwrap<Inquiry>(api.patch(`/admin/contacts/${id}`, d)),
  deleteContact: (id: string) => unwrap<{ message: string }>(api.delete(`/admin/contacts/${id}`)),
  // super admin
  admins: () => unwrap<ApiUser[]>(api.get("/super-admin/admins")),
  createAdmin: (d: { name: string; email: string; password: string; permissions: string[] }) => unwrap<ApiUser>(api.post("/super-admin/admins", d)),
  setAccess: (id: string, d: { role?: string; permissions?: string[] }) => unwrap<ApiUser>(api.patch(`/super-admin/users/${id}/access`, d)),
  activityLogs: (page = 1, action?: string) => unwrapPaged<{ _id: string; action: string; entity?: string; entityId?: string; ip?: string; createdAt: string; actor?: { name: string; email: string; role: string } }>(api.get("/super-admin/activity-logs", { params: { page, limit: 30, ...(action ? { action } : {}) } })),
  aiUsage: () => unwrap<{ total: number; success: number; failed: number; avgDurationMs: number; byKind: { kind: string; count: number }[]; perDay: { date: string; count: number }[] }>(api.get("/super-admin/ai-usage")),
  security: () => unwrap<{ failedLogins24h: number; disabledAccounts: number; revokedTokens24h: number; recentFailures: { _id: string; createdAt: string; ip?: string; meta?: { email?: string; reason?: string } }[]; adminActions: { _id: string; action: string; createdAt: string; actor?: { name: string } }[] }>(api.get("/super-admin/security")),
  settings: () => unwrap<{ aiEnabled: boolean; registrationOpen: boolean; guideRegistrationOpen: boolean; maintenanceMessage: string }>(api.get("/super-admin/settings")),
  updateSettings: (d: Partial<{ aiEnabled: boolean; registrationOpen: boolean; guideRegistrationOpen: boolean; maintenanceMessage: string }>) => unwrap<{ aiEnabled: boolean; registrationOpen: boolean; guideRegistrationOpen: boolean; maintenanceMessage: string }>(api.put("/super-admin/settings", d)),
}
