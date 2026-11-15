import { api, unwrap, unwrapPaged } from "./api"
import type { Destination } from "@/types"

export interface DestinationQuery { q?: string; state?: string; category?: string; minBudget?: number; maxBudget?: number; sort?: string; page?: number; limit?: number; featured?: boolean }
const clean = (o: object) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== "" && v !== "All"))

export const destinationService = {
  list: (q: DestinationQuery = {}) => unwrapPaged<Destination>(api.get("/destinations", { params: clean(q) })),
  featured: () => unwrap<Destination[]>(api.get("/destinations/featured")),
  popular: () => unwrap<Destination[]>(api.get("/destinations/popular")),
  states: () => unwrap<string[]>(api.get("/destinations/states")),
  get: (slug: string) => unwrap<Destination>(api.get(`/destinations/${slug}`)),
  related: (slug: string) => unwrap<Destination[]>(api.get(`/destinations/${slug}/related`)),
  create: (d: Partial<Destination>) => unwrap<Destination>(api.post("/destinations", d)),
  update: (id: string, d: Partial<Destination>) => unwrap<Destination>(api.patch(`/destinations/${id}`, d)),
  setStatus: (id: string, status: "ACTIVE" | "INACTIVE") => unwrap<Destination>(api.patch(`/destinations/${id}/status`, { status })),
  remove: (id: string) => unwrap<{ message: string }>(api.delete(`/destinations/${id}`)),
  uploadImages: (id: string, files: File[]) => {
    const fd = new FormData(); files.forEach((f) => fd.append("images", f))
    return unwrap<Destination>(api.post(`/destinations/${id}/images`, fd))
  },
}
