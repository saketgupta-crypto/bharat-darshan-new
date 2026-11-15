import { api, unwrap, unwrapPaged } from "./api"
import type { Review } from "@/types"

export const reviewService = {
  list: (targetType: string, target: string, page = 1) => unwrapPaged<Review>(api.get("/reviews", { params: { targetType, target, page } })),
  mine: () => unwrap<Review[]>(api.get("/reviews/mine")),
  create: (d: { targetType: string; target: string; rating: number; comment: string }) => unwrap<Review>(api.post("/reviews", d)),
  update: (id: string, d: { rating?: number; comment?: string }) => unwrap<Review>(api.patch(`/reviews/${id}`, d)),
  remove: (id: string) => unwrap<{ message: string }>(api.delete(`/reviews/${id}`)),
}
export const contactService = {
  submit: (d: { name: string; email: string; phone?: string; subject?: string; message: string; guide?: string; website?: string }) =>
    unwrap<{ message: string }>(api.post("/contacts", d)),
}
