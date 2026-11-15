import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Stars } from "@/components/ReviewsSection"
import CrudManager from "@/components/CrudManager"
import Pager from "@/components/Pager"
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/DataState"
import { useAsync, useDebounced } from "@/hooks/useAsync"
import { useAuth } from "@/context/AuthContext"
import { adminService } from "@/services/admin.service"
import { destinationService } from "@/services/destination.service"
import { hotelService } from "@/services/hotel.service"
import { errMsg } from "@/services/api"
import { toast } from "@/hooks/use-toast"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts"
import type { Destination, Guide, Hotel, Inquiry, Review } from "@/types"

const stat = (label: string, v: number | string) => <Card key={label}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-serif font-bold">{v}</p></CardContent></Card>
const guard = async (fn: () => Promise<unknown>, ok: string, after?: () => void) => { try { await fn(); toast({ title: ok }); after?.() } catch (e) { toast({ title: "Error", description: errMsg(e), variant: "destructive" }) } }

export function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(() => adminService.dashboard(), [])
  if (loading && !data) return <LoadingBlock />
  if (error || !data) return <ErrorBlock message={error ?? "Failed"} onRetry={reload} />
  const c = data.counts
  return (
    <div className="space-y-6"><h1 className="text-2xl font-serif font-bold">Admin Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[["Users", c.users], ["Destinations", c.destinations], ["Hotels", c.hotels], ["Guides", c.guides], ["Itineraries", c.itineraries], ["Pending guides", c.pendingGuides], ["New inquiries", c.newContacts], ["Pending reviews", c.pendingReviews]].map(([l, v]) => stat(l as string, v as number))}</div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Recent registrations</CardTitle></CardHeader><CardContent className="space-y-2">{data.recentUsers.map((u) => <div key={u._id} className="flex justify-between text-sm"><span>{u.name} <span className="text-muted-foreground">({u.email})</span></span><Badge variant="secondary">{u.role}</Badge></div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Recent activity</CardTitle></CardHeader><CardContent className="space-y-2">{data.recentActivity.length ? data.recentActivity.map((a) => <div key={a._id} className="flex justify-between text-sm"><span>{a.action}{a.actor && <span className="text-muted-foreground"> · {a.actor.name}</span>}</span><span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span></div>) : <p className="text-sm text-muted-foreground">No activity yet.</p>}</CardContent></Card>
      </div>
    </div>
  )
}

export function AdminUsers() {
  const { user: me } = useAuth()
  const [q, setQ] = useState(""); const [role, setRole] = useState(""); const [page, setPage] = useState(1)
  const dq = useDebounced(q)
  const { data, loading, error, reload } = useAsync(() => adminService.users({ q: dq || undefined, role: role || undefined, page, limit: 15 }), [dq, role, page])
  return (
    <div className="space-y-4"><h1 className="text-2xl font-serif font-bold">Users</h1>
      <div className="flex gap-3 flex-wrap"><Input className="max-w-xs" placeholder="Search name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">All roles</option>{["USER", "GUIDE", "ADMIN", "SUPER_ADMIN"].map((r) => <option key={r}>{r}</option>)}</select></div>
      {loading && !data ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={reload} /> : !data?.items.length ? <EmptyBlock title="No users found" /> : (
        <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full text-sm"><thead className="bg-muted/50 text-left"><tr>{["Name", "Email", "Role", "Status", "Joined", "Actions"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{data.items.map((u) => (
            <tr key={u._id} className="border-t"><td className="px-4 py-3">{u.name}</td><td className="px-4 py-3">{u.email}</td><td className="px-4 py-3"><Badge variant="secondary">{u.role}</Badge></td><td className="px-4 py-3"><Badge variant={u.accountStatus === "ACTIVE" ? "default" : "destructive"}>{u.accountStatus}</Badge></td><td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">{u._id !== me?._id && u.role !== "SUPER_ADMIN" && (me?.role === "SUPER_ADMIN" || u.role === "USER" || u.role === "GUIDE") && (
                u.accountStatus === "DISABLED" ? <Button size="sm" variant="outline" onClick={() => guard(() => adminService.setUserStatus(u._id, "ACTIVE"), "Account enabled", reload)}>Enable</Button>
                  : <Button size="sm" variant="outline" className="text-destructive" onClick={() => confirm(`Disable ${u.name}?`) && guard(() => adminService.setUserStatus(u._id, "DISABLED"), "Account disabled", reload)}>Disable</Button>)}</td></tr>))}</tbody></table></div>)}
      <Pager meta={data?.meta} onPage={setPage} />
    </div>
  )
}

const CATS = ["Heritage", "Adventure", "Cultural", "Nature", "Spiritual", "Beach", "Wildlife"]
export function AdminDestinations() {
  return <CrudManager<Destination> title="Destinations"
    load={async () => (await destinationService.list({ limit: 50 })).items}
    create={(d) => destinationService.create(d as never)} update={(id, d) => destinationService.update(id, d as never)} remove={destinationService.remove} upload={destinationService.uploadImages}
    defaults={{ category: "Heritage", status: "ACTIVE" }}
    fields={[
      { name: "name", label: "Name", type: "text", required: true }, { name: "state", label: "State", type: "text", required: true },
      { name: "category", label: "Category", type: "select", options: CATS, required: true }, { name: "region", label: "Region", type: "text" },
      { name: "averageBudget", label: "Average budget (INR)", type: "number" }, { name: "recommendedDuration", label: "Recommended duration", type: "text", placeholder: "2-3 days" },
      { name: "bestTimeToVisit", label: "Best time to visit", type: "text" }, { name: "attractions", label: "Attractions", type: "tags" },
      { name: "coordinates.lat", label: "Latitude", type: "number" }, { name: "coordinates.lng", label: "Longitude", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["ACTIVE", "INACTIVE"], required: true }, { name: "featured", label: "Featured on home page", type: "checkbox" },
      { name: "description", label: "Description", type: "textarea", required: true },
    ]}
    columns={[{ label: "Name", render: (r) => <div className="flex items-center gap-3">{r.images[0] && <img src={r.images[0]} alt="" className="h-10 w-14 rounded object-cover" />}<div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.state}</p></div></div> }, { label: "Category", render: (r) => r.category }, { label: "Status", render: (r) => <Badge variant={r.status === "ACTIVE" ? "default" : "secondary"}>{r.status}{r.featured ? " · Featured" : ""}</Badge> }, { label: "Views", render: (r) => r.viewCount }]}
    extraActions={(r, reload) => <Button size="sm" variant="outline" onClick={() => guard(() => destinationService.setStatus(r._id, r.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"), "Status updated", reload)}>{r.status === "ACTIVE" ? "Deactivate" : "Activate"}</Button>} />
}

export function AdminHotels() {
  const { data: dests } = useAsync(() => destinationService.list({ limit: 50 }), [])
  return <CrudManager<Hotel> title="Hotels"
    load={async () => (await hotelService.list({ limit: 50 })).items}
    create={(d) => hotelService.create(d as never)} update={(id, d) => hotelService.update(id, d as never)} remove={hotelService.remove} upload={hotelService.uploadImages}
    defaults={{ status: "ACTIVE" }}
    fields={[
      { name: "name", label: "Name", type: "text", required: true }, { name: "location", label: "Location", type: "text", required: true },
      { name: "destination", label: "Destination", type: "select", options: (dests?.items ?? []).map((d) => ({ value: d._id, label: d.name })) },
      { name: "pricePerNight", label: "Price per night (INR)", type: "number", required: true }, { name: "amenities", label: "Amenities", type: "tags" },
      { name: "contactDetails.phone", label: "Phone", type: "text" }, { name: "contactDetails.email", label: "Email", type: "text" }, { name: "contactDetails.website", label: "Website (https://...)", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["ACTIVE", "INACTIVE"], required: true }, { name: "description", label: "Description", type: "textarea" },
    ]}
    columns={[{ label: "Name", render: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.location}</p></div> }, { label: "Price/night", render: (r) => `₹${r.pricePerNight.toLocaleString("en-IN")}` }, { label: "Rating", render: (r) => (r.reviewCount ? r.rating.toFixed(1) : "-") }, { label: "Status", render: (r) => <Badge variant={r.status === "ACTIVE" ? "default" : "secondary"}>{r.status}</Badge> }]} />
}

export function AdminGuides() {
  return <CrudManager<Guide> title="Guides"
    load={() => adminService.guides()}
    create={(d) => adminService.createGuide(d as never)} update={(id, d) => adminService.updateGuide(id, d as never)} remove={adminService.deleteGuide}
    defaults={{ status: "ACTIVE", availability: "AVAILABLE" }}
    fields={[
      { name: "name", label: "Name", type: "text", required: true }, { name: "location", label: "Location", type: "text", required: true },
      { name: "languages", label: "Languages", type: "tags" }, { name: "specialization", label: "Specializations", type: "tags" },
      { name: "experienceYears", label: "Experience (years)", type: "number" }, { name: "pricePerDay", label: "Price per day (INR)", type: "number" },
      { name: "availability", label: "Availability", type: "select", options: ["AVAILABLE", "BUSY", "UNAVAILABLE"], required: true }, { name: "status", label: "Status", type: "select", options: ["ACTIVE", "PENDING", "INACTIVE"], required: true },
      { name: "bio", label: "Bio", type: "textarea" },
    ]}
    columns={[{ label: "Guide", render: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.location}</p></div> }, { label: "Languages", render: (r) => r.languages.join(", ") }, { label: "Price/day", render: (r) => `₹${r.pricePerDay.toLocaleString("en-IN")}` }, { label: "Status", render: (r) => <Badge variant={r.status === "ACTIVE" ? "default" : r.status === "PENDING" ? "outline" : "secondary"}>{r.status}</Badge> }]}
    extraActions={(r, reload) => r.status === "PENDING" ? <Button size="sm" onClick={() => guard(() => adminService.updateGuide(r._id, { status: "ACTIVE" }), "Guide approved", reload)}>Approve</Button> : r.status === "ACTIVE" ? <Button size="sm" variant="outline" onClick={() => guard(() => adminService.updateGuide(r._id, { status: "INACTIVE" }), "Guide deactivated", reload)}>Deactivate</Button> : <Button size="sm" variant="outline" onClick={() => guard(() => adminService.updateGuide(r._id, { status: "ACTIVE" }), "Guide activated", reload)}>Activate</Button>} />
}

export function AdminReviews() {
  const [status, setStatus] = useState("")
  const { data, loading, error, reload } = useAsync(() => adminService.reviews(status || undefined), [status])
  return (
    <div className="space-y-4"><div className="flex items-center justify-between"><h1 className="text-2xl font-serif font-bold">Review moderation</h1>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">All</option>{["PENDING", "APPROVED", "REJECTED"].map((s) => <option key={s}>{s}</option>)}</select></div>
      {loading && !data ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={reload} /> : !data?.items.length ? <EmptyBlock title="No reviews" /> : data.items.map((r: Review) => (
        <Card key={r._id}><CardContent className="p-4 space-y-2">
          <div className="flex justify-between"><div><span className="font-medium">{typeof r.user === "string" ? "User" : `${r.user.name}`}</span> on <span className="font-medium">{typeof r.target === "string" ? r.targetType : r.target?.name ?? r.targetType}</span> <Badge variant="outline">{r.targetType}</Badge></div><Stars value={r.rating} /></div>
          <p className="text-sm text-muted-foreground">{r.comment}</p>
          <div className="flex items-center gap-2"><Badge variant="secondary">{r.status}</Badge>
            {r.status !== "APPROVED" && <Button size="sm" onClick={() => guard(() => adminService.moderateReview(r._id, "APPROVED"), "Approved", reload)}>Approve</Button>}
            {r.status !== "REJECTED" && <Button size="sm" variant="outline" onClick={() => guard(() => adminService.moderateReview(r._id, "REJECTED"), "Rejected", reload)}>Reject</Button>}
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => confirm("Delete review?") && guard(() => adminService.deleteReview(r._id), "Deleted", reload)}>Delete</Button></div>
        </CardContent></Card>))}
    </div>
  )
}

export function AdminContacts() {
  const [status, setStatus] = useState("")
  const { data, loading, error, reload } = useAsync(() => adminService.contacts(status || undefined), [status])
  const [notes, setNotes] = useState<Record<string, string>>({})
  return (
    <div className="space-y-4"><div className="flex items-center justify-between"><h1 className="text-2xl font-serif font-bold">Contact inquiries</h1>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">All</option>{["NEW", "IN_PROGRESS", "RESOLVED"].map((s) => <option key={s}>{s}</option>)}</select></div>
      {loading && !data ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={reload} /> : !data?.items.length ? <EmptyBlock title="No inquiries" /> : data.items.map((i: Inquiry) => (
        <Card key={i._id}><CardContent className="p-4 space-y-2">
          <div className="flex justify-between"><div><p className="font-medium">{i.name} · <a className="text-primary underline" href={`mailto:${i.email}`}>{i.email}</a>{i.phone && ` · ${i.phone}`}</p><p className="text-xs text-muted-foreground">{new Date(i.createdAt).toLocaleString()}{typeof i.guide === "object" && i.guide ? ` · for guide ${i.guide.name}` : ""}</p></div><Badge>{i.status}</Badge></div>
          {i.subject && <p className="font-medium text-sm">{i.subject}</p>}<p className="text-sm text-muted-foreground whitespace-pre-wrap">{i.message}</p>
          <div className="flex gap-2 flex-wrap items-center"><Input className="max-w-xs h-9" placeholder="Internal note" value={notes[i._id] ?? i.adminNote ?? ""} onChange={(e) => setNotes({ ...notes, [i._id]: e.target.value })} />
            <Button size="sm" variant="outline" onClick={() => guard(() => adminService.updateContact(i._id, { adminNote: notes[i._id] ?? i.adminNote ?? "" }), "Note saved", reload)}>Save note</Button>
            <Button size="sm" variant="outline" onClick={() => guard(() => adminService.updateContact(i._id, { status: "IN_PROGRESS" }), "Updated", reload)}>In progress</Button>
            <Button size="sm" onClick={() => guard(() => adminService.updateContact(i._id, { status: "RESOLVED" }), "Resolved", reload)}>Resolve</Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => confirm("Delete inquiry?") && guard(() => adminService.deleteContact(i._id), "Deleted", reload)}>Delete</Button></div>
        </CardContent></Card>))}
    </div>
  )
}

export function AdminAnalytics() {
  const { data, loading, error, reload } = useAsync(() => adminService.analytics(), [])
  if (loading && !data) return <LoadingBlock />
  if (error || !data) return <ErrorBlock message={error ?? "Failed"} onRetry={reload} />
  const chart = (title: string, rows: { date: string; count: number }[]) => <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="h-64">{rows.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Line type="monotone" dataKey="count" stroke="#c2410c" strokeWidth={2} /></LineChart></ResponsiveContainer> : <p className="text-sm text-muted-foreground">No data in the last 30 days.</p>}</CardContent></Card>
  return (
    <div className="space-y-6"><h1 className="text-2xl font-serif font-bold">Reports & analytics</h1>
      <div className="grid lg:grid-cols-2 gap-6">{chart("New registrations (30 days)", data.registrations)}{chart("Itineraries created (30 days)", data.itinerariesPerDay)}
        <Card><CardHeader><CardTitle>Itineraries by travel style</CardTitle></CardHeader><CardContent className="h-64">{data.byStyle.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.byStyle}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="style" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="count" fill="#c2410c" /></BarChart></ResponsiveContainer> : <p className="text-sm text-muted-foreground">No data yet.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Top destinations by views</CardTitle></CardHeader><CardContent className="space-y-2">{data.topDestinations.map((d) => <div key={d._id} className="flex justify-between text-sm"><span>{d.name}</span><span className="text-muted-foreground">{d.viewCount} views</span></div>)}</CardContent></Card>
      </div>
    </div>
  )
}
