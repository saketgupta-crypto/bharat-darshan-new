import { api, unwrap } from "./api"
import type { ApiUser, Destination, Itinerary } from "@/types"

export interface UserDashboard {
  user: ApiUser; totalTrips: number
  recentItineraries: Itinerary[]; upcomingTrips: Itinerary[]
  favoriteDestinations: Destination[]; recentlyViewed: Destination[]
}
export const userService = {
  dashboard: () => unwrap<UserDashboard>(api.get("/users/dashboard")),
  profile: async () => (await unwrap<{ user: ApiUser }>(api.get("/users/profile"))).user,
  updateProfile: async (d: Partial<Pick<ApiUser, "name" | "phone" | "profileImage" | "preferences">>) => (await unwrap<{ user: ApiUser }>(api.patch("/users/profile", d))).user,
  changePassword: (currentPassword: string, newPassword: string) => unwrap<{ message: string }>(api.patch("/users/change-password", { currentPassword, newPassword })),
  toggleFavorite: (destinationId: string) => unwrap<{ favorited: boolean }>(api.post(`/users/favorites/${destinationId}`)),
}
