export type Role = "SUPER_ADMIN" | "ADMIN" | "USER" | "GUIDE"
export type Permission =
  | "users:manage" | "destinations:write" | "hotels:write" | "guides:manage"
  | "reviews:moderate" | "contacts:manage" | "analytics:view"

export interface ApiUser {
  id?: string
  _id: string
  name: string
  email: string
  profileImage?: string
  phone?: string
  role: Role
  permissions: Permission[]
  isEmailVerified: boolean
  accountStatus: "ACTIVE" | "PENDING_APPROVAL" | "DISABLED"
  preferences?: { travelStyles?: string[]; budgetRange?: string; dietary?: string }
  favoriteDestinations?: Destination[] | string[]
  recentlyViewed?: Destination[] | string[]
  createdAt: string
}

export interface Destination {
  _id: string
  name: string
  slug: string
  description: string
  state: string
  region?: string
  category: "Heritage" | "Adventure" | "Cultural" | "Nature" | "Spiritual" | "Beach" | "Wildlife"
  images: string[]
  attractions: string[]
  bestTimeToVisit?: string
  averageBudget: number
  recommendedDuration?: string
  coordinates?: { lat: number; lng: number }
  featured: boolean
  viewCount: number
  avgRating: number
  reviewCount: number
  status: "ACTIVE" | "INACTIVE"
}

export interface Hotel {
  _id: string
  name: string
  description?: string
  location: string
  destination?: string | { _id: string; name: string; slug: string }
  images: string[]
  pricePerNight: number
  amenities: string[]
  rating: number
  reviewCount: number
  contactDetails?: { phone?: string; email?: string; website?: string }
  status: "ACTIVE" | "INACTIVE"
}

export interface Guide {
  _id: string
  name: string
  profileImage?: string
  bio?: string
  location: string
  languages: string[]
  experienceYears: number
  specialization: string[]
  pricePerDay: number
  rating: number
  reviewCount: number
  availability: "AVAILABLE" | "BUSY" | "UNAVAILABLE"
  unavailableDates?: string[]
  status: "ACTIVE" | "PENDING" | "INACTIVE"
}

export interface Activity { time?: string; title?: string; description?: string; estimatedCost?: number; estimatedTravelTime?: string }
export interface DailyPlan {
  day: number; title?: string
  morning?: Activity[]; afternoon?: Activity[]; evening?: Activity[]
  places?: string[]; food?: string[]; transport?: string; estimatedDailyCost?: number
}
export interface Itinerary {
  _id: string
  title: string
  destination: string
  startingLocation?: string
  duration: number
  travelDates?: { start?: string; end?: string }
  travellers?: { adults: number; children: number }
  budget?: number
  travelStyle?: string
  overview?: string
  destinationSummary?: string
  dailyPlans: DailyPlan[]
  accommodationSuggestions?: string[]
  estimatedTotalBudget?: number
  tips?: string[]
  safety?: string[]
  disclaimer?: string
  isShared?: boolean
  shareToken?: string | null
  status: "DRAFT" | "SAVED" | "COMPLETED"
  createdAt: string
}

export interface Review {
  _id: string
  user: { _id: string; name: string; profileImage?: string } | string
  targetType: "Destination" | "Hotel" | "Guide"
  target: string | { _id: string; name: string }
  rating: number
  comment: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
}

export interface Inquiry {
  _id: string; name: string; email: string; phone?: string; subject?: string; message: string
  guide?: string | { _id: string; name: string }
  status: "NEW" | "IN_PROGRESS" | "RESOLVED"; adminNote?: string; createdAt: string
}

export interface PageMeta { page: number; limit: number; total: number; totalPages: number }
export interface Paged<T> { items: T[]; meta: PageMeta }
