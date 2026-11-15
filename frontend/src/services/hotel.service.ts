import { api, unwrap, unwrapPaged } from "./api"
import type { Hotel } from "@/types"

export interface HotelQuery { q?: string; destination?: string; location?: string; minPrice?: number; maxPrice?: number; minRating?: number; amenities?: string; sort?: string; page?: number; limit?: number }
const clean = (o: object) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ""))

export const hotelService = {
  list: (q: HotelQuery = {}) => unwrapPaged<Hotel>(api.get("/hotels", { params: clean(q) })),
  get: (id: string) => unwrap<Hotel>(api.get(`/hotels/${id}`)),
  create: (d: Partial<Hotel>) => unwrap<Hotel>(api.post("/hotels", d)),
  update: (id: string, d: Partial<Hotel>) => unwrap<Hotel>(api.patch(`/hotels/${id}`, d)),
  remove: (id: string) => unwrap<{ message: string }>(api.delete(`/hotels/${id}`)),
  uploadImages: (id: string, files: File[]) => {
    const fd = new FormData(); files.forEach((f) => fd.append("images", f))
    return unwrap<Hotel>(api.post(`/hotels/${id}/images`, fd))
  },
}
