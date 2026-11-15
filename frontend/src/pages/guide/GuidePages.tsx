import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Stars } from "@/components/ReviewsSection"
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/DataState"
import { useAsync } from "@/hooks/useAsync"
import { guideService } from "@/services/guide.service"
import { errMsg } from "@/services/api"
import { toast } from "@/hooks/use-toast"
import type { Guide, Inquiry } from "@/types"

export function GuideDashboard() {
  const { data, loading, error, reload } = useAsync(() => guideService.stats(), [])
  if (loading && !data) return <LoadingBlock />
  if (error || !data) return <ErrorBlock message={error ?? "Failed"} onRetry={reload} />
  const stat = (label: string, v: string | number) => <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-serif font-bold">{v}</p></CardContent></Card>
  return (
    <div className="space-y-6"><h1 className="text-2xl font-serif font-bold">Guide Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stat("Rating", data.reviewCount ? data.rating.toFixed(1) : "-")}{stat("Reviews", data.reviewCount)}{stat("New inquiries", data.newInquiries)}{stat("Total inquiries", data.totalInquiries)}
      </div>
      <Card><CardContent className="p-5 flex items-center gap-3">Availability: <Badge>{data.availability}</Badge> Profile status: <Badge variant="secondary">{data.status}</Badge></CardContent></Card>
    </div>
  )
}

export function GuideProfilePage() {
  const { data, loading, error, reload } = useAsync(() => guideService.mine(), [])
  const [f, setF] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (data) setF({ name: data.name, bio: data.bio ?? "", location: data.location, languages: data.languages.join(", "), experienceYears: String(data.experienceYears), specialization: data.specialization.join(", "), pricePerDay: String(data.pricePerDay), availability: data.availability, unavailableDates: (data.unavailableDates ?? []).map((d) => d.slice(0, 10)).join(", ") })
  }, [data])
  const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean)
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true)
    try {
      await guideService.updateMine({ name: f.name, bio: f.bio, location: f.location, languages: list(f.languages), experienceYears: Number(f.experienceYears), specialization: list(f.specialization), pricePerDay: Number(f.pricePerDay), availability: f.availability as Guide["availability"], unavailableDates: list(f.unavailableDates) })
      toast({ title: "Profile saved" }); reload()
    } catch (err) { toast({ title: "Error", description: errMsg(err), variant: "destructive" }) } finally { setBusy(false) }
  }
  const photo = async (file?: File) => { if (!file) return; try { await guideService.uploadPhoto(file); toast({ title: "Photo updated" }); reload() } catch (err) { toast({ title: "Upload failed", description: errMsg(err), variant: "destructive" }) } }
  if (loading && !data) return <LoadingBlock />
  if (error || !data) return <ErrorBlock message={error ?? "Failed"} onRetry={reload} />
  const inp = (k: string, label: string, type = "text") => <div className="space-y-1"><Label htmlFor={k}>{label}</Label><Input id={k} type={type} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  return (
    <Card className="max-w-3xl"><CardHeader><CardTitle>My guide profile</CardTitle><CardDescription>Profile, experience, languages, pricing and availability</CardDescription></CardHeader>
      <CardContent><form onSubmit={save} className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2 flex items-center gap-4"><img src={data.profileImage || "/placeholder-user.jpg"} alt="" className="h-20 w-20 rounded-full object-cover" /><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => photo(e.target.files?.[0])} className="max-w-xs" /></div>
        {inp("name", "Name")}{inp("location", "Base location")}{inp("languages", "Languages (comma separated)")}{inp("specialization", "Specializations (comma separated)")}{inp("experienceYears", "Experience (years)", "number")}{inp("pricePerDay", "Price per day (INR)", "number")}
        <div className="space-y-1"><Label htmlFor="availability">Availability</Label><select id="availability" value={f.availability ?? ""} onChange={(e) => setF({ ...f, availability: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{["AVAILABLE", "BUSY", "UNAVAILABLE"].map((o) => <option key={o}>{o}</option>)}</select></div>
        {inp("unavailableDates", "Unavailable dates (YYYY-MM-DD, comma separated)")}
        <div className="md:col-span-2 space-y-1"><Label htmlFor="bio">About me</Label><Textarea id="bio" rows={4} value={f.bio ?? ""} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
        <div className="md:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save profile"}</Button></div>
      </form></CardContent></Card>
  )
}

export function GuideInquiries() {
  const { data, loading, error, reload } = useAsync(() => guideService.inquiries(), [])
  const set = async (i: Inquiry, s: Inquiry["status"]) => { try { await guideService.setInquiryStatus(i._id, s); reload() } catch (e) { toast({ title: "Error", description: errMsg(e), variant: "destructive" }) } }
  return (
    <div className="space-y-4"><h1 className="text-2xl font-serif font-bold">Inquiries</h1>
      {loading && !data ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={reload} /> : !data?.length ? <EmptyBlock title="No inquiries yet" /> : data.map((i) => (
        <Card key={i._id}><CardContent className="p-4 space-y-2">
          <div className="flex justify-between"><div><p className="font-medium">{i.name} · <a className="text-primary underline" href={`mailto:${i.email}`}>{i.email}</a>{i.phone && ` · ${i.phone}`}</p><p className="text-xs text-muted-foreground">{new Date(i.createdAt).toLocaleString()}</p></div><Badge variant={i.status === "NEW" ? "default" : "secondary"}>{i.status}</Badge></div>
          {i.subject && <p className="font-medium text-sm">{i.subject}</p>}<p className="text-sm text-muted-foreground whitespace-pre-wrap">{i.message}</p>
          <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => set(i, "IN_PROGRESS")}>In progress</Button><Button size="sm" variant="outline" onClick={() => set(i, "RESOLVED")}>Resolved</Button></div>
        </CardContent></Card>))}
    </div>
  )
}

export function GuideReviews() {
  const { data, loading, error, reload } = useAsync(() => guideService.reviews(), [])
  return (
    <div className="space-y-4"><h1 className="text-2xl font-serif font-bold">Reviews & ratings</h1>
      {loading && !data ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={reload} /> : !data?.length ? <EmptyBlock title="No reviews yet" /> : data.map((r) => (
        <Card key={r._id}><CardContent className="p-4 space-y-1"><div className="flex justify-between"><span className="font-medium">{typeof r.user === "string" ? "Traveller" : r.user.name}</span><Stars value={r.rating} /></div><p className="text-sm text-muted-foreground">{r.comment}</p></CardContent></Card>))}
    </div>
  )
}
