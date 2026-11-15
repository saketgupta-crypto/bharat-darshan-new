import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import ItineraryCard from "@/components/ItineraryCard"
import { itineraryService } from "@/services/itinerary.service"
import { errMsg } from "@/services/api"
import { toast } from "@/hooks/use-toast"
import type { Itinerary, DailyPlan } from "@/types"
import { Download, Share2, RefreshCw, Trash2, Wand2, Link2 } from "lucide-react"

const inr = (n?: number) => `₹${Math.round(n ?? 0).toLocaleString("en-IN")}`

function toCardDay(d: DailyPlan) {
  const fmt = (label: string, list?: DailyPlan["morning"]) =>
    (list ?? []).map((a) => `${label}${a.time ? ` ${a.time}` : ""}: ${a.title ?? ""}${a.estimatedCost ? ` (est. ${inr(a.estimatedCost)})` : ""}${a.estimatedTravelTime ? ` · ~${a.estimatedTravelTime} travel` : ""}`)
  const extra = [
    ...(d.food?.length ? [`Food: ${d.food.join(", ")}`] : []),
    ...(d.transport ? [`Transport: ${d.transport}`] : []),
    ...(d.estimatedDailyCost ? [`Estimated day cost: ${inr(d.estimatedDailyCost)}`] : []),
  ]
  return {
    day: d.day,
    title: d.title || `Day ${d.day}`,
    description: d.places?.length ? `Places: ${d.places.join(", ")}` : "",
    activities: [...fmt("Morning", d.morning), ...fmt("Afternoon", d.afternoon), ...fmt("Evening", d.evening), ...extra],
  }
}

interface Props {
  itinerary: Itinerary
  /** Owner controls (regenerate / modify / share / PDF / delete). Omit for the public shared view. */
  editable?: boolean
  onChange?: (it: Itinerary) => void
  onDeleted?: () => void
}

export default function ItineraryView({ itinerary: it, editable, onChange, onDeleted }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [instruction, setInstruction] = useState("")

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    try { await fn() } catch (e) { toast({ title: "Error", description: errMsg(e), variant: "destructive" }) } finally { setBusy(null) }
  }
  const shareUrl = it.shareToken ? `${window.location.origin}/shared/${it.shareToken}` : ""

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-serif text-foreground">{it.title}</h2>
        <p className="text-muted-foreground">{it.destination} · {it.duration} day{it.duration > 1 ? "s" : ""}{it.travellers ? ` · ${it.travellers.adults + it.travellers.children} traveller(s)` : ""}</p>
        <Badge variant="secondary">AI-generated · prices and times are estimates</Badge>
      </div>

      {editable && (
        <Card><CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm" disabled={!!busy} onClick={() => run("pdf", () => itineraryService.downloadPdf(it._id, it.title))}><Download className="w-4 h-4 mr-2" />{busy === "pdf" ? "Preparing..." : "Download PDF"}</Button>
            <Button variant="outline" size="sm" disabled={!!busy} onClick={() => run("share", async () => {
              const r = await itineraryService.share(it._id, !it.isShared)
              onChange?.({ ...it, isShared: r.isShared, shareToken: r.shareToken })
              toast({ title: r.isShared ? "Sharing enabled" : "Sharing disabled" })
            })}><Share2 className="w-4 h-4 mr-2" />{it.isShared ? "Stop sharing" : "Share link"}</Button>
            <Button variant="outline" size="sm" disabled={!!busy} onClick={() => run("regen", async () => { onChange?.(await itineraryService.regenerate(it._id)); toast({ title: "Itinerary regenerated" }) })}><RefreshCw className="w-4 h-4 mr-2" />{busy === "regen" ? "Regenerating..." : "Regenerate all"}</Button>
            <Button variant="outline" size="sm" disabled={!!busy} className="text-destructive" onClick={() => { if (confirm("Delete this itinerary permanently?")) run("del", async () => { await itineraryService.remove(it._id); onDeleted?.() }) }}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
          </div>
          {it.isShared && shareUrl && (
            <div className="flex gap-2 items-center">
              <Input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} />
              <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(shareUrl).then(() => toast({ title: "Link copied" }))}><Link2 className="w-4 h-4" /></Button>
            </div>
          )}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (instruction.trim().length < 3) return; run("modify", async () => { onChange?.(await itineraryService.modify(it._id, instruction.trim())); setInstruction(""); toast({ title: "Itinerary updated" }) }) }}>
            <Input value={instruction} onChange={(e) => setInstruction(e.target.value)} maxLength={500} placeholder='Ask AI to change it, e.g. "make day 2 more relaxed" or "add a cooking class"' />
            <Button type="submit" disabled={!!busy || instruction.trim().length < 3}><Wand2 className="w-4 h-4 mr-2" />{busy === "modify" ? "Updating..." : "Modify"}</Button>
          </form>
        </CardContent></Card>
      )}

      {(it.overview || it.destinationSummary) && (
        <Card><CardContent className="p-6 space-y-3">
          {it.overview && <p className="leading-relaxed">{it.overview}</p>}
          {it.destinationSummary && <p className="text-muted-foreground leading-relaxed">{it.destinationSummary}</p>}
        </CardContent></Card>
      )}

      <div className="space-y-6">
        {it.dailyPlans.map((d) => (
          <div key={d.day} className="space-y-2">
            <ItineraryCard day={toCardDay(d)} />
            {editable && (
              <div className="text-right">
                <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run(`day${d.day}`, async () => { onChange?.(await itineraryService.regenerate(it._id, d.day)); toast({ title: `Day ${d.day} regenerated` }) })}>
                  <RefreshCw className="w-3 h-3 mr-2" />{busy === `day${d.day}` ? "Regenerating..." : `Regenerate day ${d.day}`}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {!!it.estimatedTotalBudget && <Card><CardHeader><CardTitle>Estimated total budget</CardTitle></CardHeader><CardContent><p className="text-3xl font-serif text-primary">{inr(it.estimatedTotalBudget)}</p><p className="text-xs text-muted-foreground mt-1">AI estimate for planning only. Verify prices before booking.</p></CardContent></Card>}
        {!!it.accommodationSuggestions?.length && <Card><CardHeader><CardTitle>Where to stay</CardTitle></CardHeader><CardContent><ul className="list-disc pl-5 space-y-1 text-sm">{it.accommodationSuggestions.map((a, i) => <li key={i}>{a}</li>)}</ul></CardContent></Card>}
        {!!it.tips?.length && <Card><CardHeader><CardTitle>Travel tips</CardTitle></CardHeader><CardContent><ul className="list-disc pl-5 space-y-1 text-sm">{it.tips.map((a, i) => <li key={i}>{a}</li>)}</ul></CardContent></Card>}
        {!!it.safety?.length && <Card><CardHeader><CardTitle>Safety</CardTitle></CardHeader><CardContent><ul className="list-disc pl-5 space-y-1 text-sm">{it.safety.map((a, i) => <li key={i}>{a}</li>)}</ul></CardContent></Card>}
      </div>
      <p className="text-xs text-center text-muted-foreground">{it.disclaimer ?? "Prices and travel times are AI-generated estimates. Verify before booking."}</p>
    </div>
  )
}
