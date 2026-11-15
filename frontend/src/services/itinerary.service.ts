import { api, unwrap } from "./api"
import type { Itinerary } from "@/types"

export interface PlanInput {
  startingLocation: string; destination: string
  startDate?: string; endDate?: string; duration?: number
  adults: number; children: number; budget: number
  travelStyle: string; transportation: string; accommodation: string
  interests: string[]; dietary: string; specialRequirements: string
}
export const itineraryService = {
  generate: (p: PlanInput) => unwrap<Itinerary>(api.post("/ai/generate-itinerary", p)),
  regenerate: (itineraryId: string, day?: number) => unwrap<Itinerary>(api.post("/ai/regenerate-itinerary", { itineraryId, day })),
  modify: (itineraryId: string, instruction: string) => unwrap<Itinerary>(api.post("/ai/modify-itinerary", { itineraryId, instruction })),
  list: () => unwrap<Itinerary[]>(api.get("/itineraries")),
  get: (id: string) => unwrap<Itinerary>(api.get(`/itineraries/${id}`)),
  update: (id: string, d: Partial<Itinerary>) => unwrap<Itinerary>(api.patch(`/itineraries/${id}`, d)),
  remove: (id: string) => unwrap<{ message: string }>(api.delete(`/itineraries/${id}`)),
  share: (id: string, enable: boolean) => unwrap<{ isShared: boolean; shareToken: string | null }>(api.post(`/itineraries/${id}/share`, { enable })),
  getShared: (token: string) => unwrap<Itinerary>(api.get(`/itineraries/shared/${token}`)),
  async downloadPdf(id: string, title: string) {
    const r = await api.get(`/itineraries/${id}/pdf`, { responseType: "blob" })
    const url = URL.createObjectURL(r.data as Blob)
    const a = document.createElement("a"); a.href = url; a.download = `${title.replace(/[^a-z0-9-_]+/gi, "_")}.pdf`; a.click()
    URL.revokeObjectURL(url)
  },
}
