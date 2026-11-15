import { api, unwrap, unwrapPaged } from "./api"
import type { Guide, Inquiry, Review } from "@/types"

export interface GuideQuery { q?: string; location?: string; language?: string; minExperience?: number; maxPrice?: number; available?: string; sort?: string; page?: number; limit?: number }
const clean = (o: object) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== "" && v !== "All"))

export const guideService = {
  list: (q: GuideQuery = {}) => unwrapPaged<Guide>(api.get("/guides", { params: clean(q) })),
  get: (id: string) => unwrap<Guide>(api.get(`/guides/${id}`)),
  // guide panel
  mine: () => unwrap<Guide>(api.get("/guides/me/profile")),
  updateMine: (d: Partial<Guide>) => unwrap<Guide>(api.patch("/guides/me/profile", d)),
  uploadPhoto: (file: File) => { const fd = new FormData(); fd.append("image", file); return unwrap<Guide>(api.post("/guides/me/photo", fd)) },
  stats: () => unwrap<{ rating: number; reviewCount: number; newInquiries: number; totalInquiries: number; availability: string; status: string }>(api.get("/guides/me/stats")),
  inquiries: () => unwrap<Inquiry[]>(api.get("/guides/me/inquiries")),
  setInquiryStatus: (id: string, status: Inquiry["status"]) => unwrap<Inquiry>(api.patch(`/guides/me/inquiries/${id}`, { status })),
  reviews: () => unwrap<Review[]>(api.get("/guides/me/reviews")),
}
