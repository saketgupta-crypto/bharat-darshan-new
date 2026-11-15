import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Pager from "@/components/Pager"
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/DataState"
import { useAsync } from "@/hooks/useAsync"
import { adminService } from "@/services/admin.service"
import { errMsg } from "@/services/api"
import { toast } from "@/hooks/use-toast"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import type { ApiUser, Permission } from "@/types"

export const ALL_PERMS: Permission[] = ["users:manage", "destinations:write", "hotels:write", "guides:manage", "reviews:moderate", "contacts:manage", "analytics:view"]
const stat = (label: string, v: number | string) => <Card key={label}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-serif font-bold">{v}</p></CardContent></Card>

function PermEditor({ perms, onChange }: { perms: string[]; onChange: (p: string[]) => void }) {
  return <div className="flex flex-wrap gap-2">{ALL_PERMS.map((p) => <Button key={p} type="button" size="sm" className="rounded-full" variant={perms.includes(p) ? "default" : "outline"} onClick={() => onChange(perms.includes(p) ? perms.filter((x) => x !== p) : [...perms, p])}>{p}</Button>)}</div>
}

export function ManageAdmins() {
  const { data, loading, error, reload } = useAsync(() => adminService.admins(), [])
  const [f, setF] = useState({ name: "", email: "", password: "" })
  const [perms, setPerms] = useState<string[]>([])
  const [edit, setEdit] = useState<Record<string, string[]>>({})
  const [busy, setBusy] = useState(false)
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true)
    try { await adminService.createAdmin({ ...f, permissions: perms }); toast({ title: "Admin created" }); setF({ name: "", email: "", password: "" }); setPerms([]); reload() }
    catch (err) { toast({ title: "Error", description: errMsg(err), variant: "destructive" }) } finally { setBusy(false) }
  }
  const act = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); toast({ title: ok }); reload() } catch (e) { toast({ title: "Error", description: errMsg(e), variant: "destructive" }) } }
  return (
    <div className="space-y-6"><h1 className="text-2xl font-serif font-bold">Admins & permissions</h1>
      <Card><CardHeader><CardTitle>Create admin</CardTitle><CardDescription>New admins are email-verified immediately. Grant only the permissions they need.</CardDescription></CardHeader><CardContent>
        <form onSubmit={create} className="space-y-4"><div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-1"><Label htmlFor="an">Name</Label><Input id="an" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div>
          <div className="space-y-1"><Label htmlFor="ae">Email</Label><Input id="ae" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div>
          <div className="space-y-1"><Label htmlFor="ap">Temporary password</Label><Input id="ap" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required minLength={8} autoComplete="new-password" /></div></div>
          <PermEditor perms={perms} onChange={setPerms} /><Button type="submit" disabled={busy}>{busy ? "Creating..." : "Create admin"}</Button></form></CardContent></Card>
      {loading && !data ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={reload} /> : !data?.length ? <EmptyBlock title="No admins" /> : data.map((a: ApiUser) => {
        const cur = edit[a._id] ?? a.permissions
        return (<Card key={a._id}><CardContent className="p-4 space-y-3">
          <div className="flex justify-between flex-wrap gap-2"><div><p className="font-medium">{a.name} <span className="text-muted-foreground">({a.email})</span></p></div><div className="flex gap-2"><Badge>{a.role}</Badge><Badge variant={a.accountStatus === "ACTIVE" ? "secondary" : "destructive"}>{a.accountStatus}</Badge></div></div>
          {a.role === "ADMIN" ? (<>
            <PermEditor perms={cur} onChange={(p) => setEdit({ ...edit, [a._id]: p })} />
            <div className="flex gap-2 flex-wrap"><Button size="sm" onClick={() => act(() => adminService.setAccess(a._id, { permissions: cur }), "Permissions saved")}>Save permissions</Button>
              {a.accountStatus === "ACTIVE" ? <Button size="sm" variant="outline" className="text-destructive" onClick={() => confirm("Disable this admin?") && act(() => adminService.setUserStatus(a._id, "DISABLED"), "Admin disabled")}>Disable</Button> : <Button size="sm" variant="outline" onClick={() => act(() => adminService.setUserStatus(a._id, "ACTIVE"), "Admin enabled")}>Enable</Button>}
              <Button size="sm" variant="outline" onClick={() => confirm("Demote to a normal user?") && act(() => adminService.setAccess(a._id, { role: "USER" }), "Demoted")}>Demote to user</Button></div></>) : <p className="text-sm text-muted-foreground">Super admins have all permissions and can only be managed from the seed script.</p>}
        </CardContent></Card>)})}
    </div>
  )
}

export function ActivityLogs() {
  const [page, setPage] = useState(1); const [action, setAction] = useState("")
  const { data, loading, error, reload } = useAsync(() => adminService.activityLogs(page, action || undefined), [page, action])
  return (
    <div className="space-y-4"><div className="flex items-center justify-between"><h1 className="text-2xl font-serif font-bold">Activity logs</h1><Input className="max-w-xs" placeholder="Filter by action prefix, e.g. user." value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} /></div>
      {loading && !data ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={reload} /> : !data?.items.length ? <EmptyBlock title="No activity" /> : (
        <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full text-sm"><thead className="bg-muted/50 text-left"><tr>{["When", "Actor", "Action", "Entity", "IP"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{data.items.map((l) => <tr key={l._id} className="border-t"><td className="px-4 py-2">{new Date(l.createdAt).toLocaleString()}</td><td className="px-4 py-2">{l.actor ? `${l.actor.name} (${l.actor.role})` : "-"}</td><td className="px-4 py-2"><Badge variant="secondary">{l.action}</Badge></td><td className="px-4 py-2">{l.entity ?? "-"}</td><td className="px-4 py-2">{l.ip ?? "-"}</td></tr>)}</tbody></table></div>)}
      <Pager meta={data?.meta} onPage={setPage} />
    </div>
  )
}

export function AiUsage() {
  const { data, loading, error, reload } = useAsync(() => adminService.aiUsage(), [])
  if (loading && !data) return <LoadingBlock />
  if (error || !data) return <ErrorBlock message={error ?? "Failed"} onRetry={reload} />
  return (
    <div className="space-y-6"><h1 className="text-2xl font-serif font-bold">AI usage analytics</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{stat("Total requests", data.total)}{stat("Successful", data.success)}{stat("Failed", data.failed)}{stat("Avg. duration", `${(data.avgDurationMs / 1000).toFixed(1)}s`)}</div>
      <div className="grid lg:grid-cols-2 gap-6"><Card><CardHeader><CardTitle>Requests per day (30 days)</CardTitle></CardHeader><CardContent className="h-64">{data.perDay.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={data.perDay}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Line dataKey="count" stroke="#c2410c" strokeWidth={2} /></LineChart></ResponsiveContainer> : <p className="text-sm text-muted-foreground">No data yet.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>By type</CardTitle></CardHeader><CardContent className="space-y-2">{data.byKind.map((k) => <div key={k.kind} className="flex justify-between text-sm"><span className="capitalize">{k.kind}</span><span>{k.count}</span></div>)}</CardContent></Card></div>
    </div>
  )
}

export function SecurityMonitor() {
  const { data, loading, error, reload } = useAsync(() => adminService.security(), [])
  if (loading && !data) return <LoadingBlock />
  if (error || !data) return <ErrorBlock message={error ?? "Failed"} onRetry={reload} />
  return (
    <div className="space-y-6"><h1 className="text-2xl font-serif font-bold">Security monitoring</h1>
      <div className="grid sm:grid-cols-3 gap-4">{stat("Failed logins (24h)", data.failedLogins24h)}{stat("Disabled accounts", data.disabledAccounts)}{stat("Sessions revoked (24h)", data.revokedTokens24h)}</div>
      <Card><CardHeader><CardTitle>Recent failed logins</CardTitle></CardHeader><CardContent className="space-y-2">{data.recentFailures.length ? data.recentFailures.map((l) => <div key={l._id} className="flex justify-between text-sm"><span>{l.meta?.email ?? "unknown"} <span className="text-muted-foreground">· {l.meta?.reason ?? "-"} · {l.ip ?? "-"}</span></span><span className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</span></div>) : <p className="text-sm text-muted-foreground">None.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Recent privileged changes</CardTitle></CardHeader><CardContent className="space-y-2">{data.adminActions.length ? data.adminActions.map((l) => <div key={l._id} className="flex justify-between text-sm"><span>{l.action} <span className="text-muted-foreground">by {l.actor?.name ?? "-"}</span></span><span className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</span></div>) : <p className="text-sm text-muted-foreground">None.</p>}</CardContent></Card>
    </div>
  )
}

export function SystemSettings() {
  const { data, loading, error, reload, setData } = useAsync(() => adminService.settings(), [])
  const [msg, setMsg] = useState<string | null>(null)
  if (loading && !data) return <LoadingBlock />
  if (error || !data) return <ErrorBlock message={error ?? "Failed"} onRetry={reload} />
  const toggle = async (k: "aiEnabled" | "registrationOpen" | "guideRegistrationOpen") => { try { setData(await adminService.updateSettings({ [k]: !data[k] })) } catch (e) { toast({ title: "Error", description: errMsg(e), variant: "destructive" }) } }
  const row = (k: "aiEnabled" | "registrationOpen" | "guideRegistrationOpen", label: string, hint: string) => <div key={k} className="flex items-center justify-between py-3 border-b last:border-0"><div><p className="font-medium">{label}</p><p className="text-sm text-muted-foreground">{hint}</p></div><Button variant={data[k] ? "default" : "outline"} onClick={() => toggle(k)}>{data[k] ? "On" : "Off"}</Button></div>
  return (
    <div className="space-y-6 max-w-2xl"><h1 className="text-2xl font-serif font-bold">System configuration</h1>
      <Card><CardContent className="p-5">{row("aiEnabled", "AI itinerary planner", "Turn off to stop all AI generation")}{row("registrationOpen", "User registration", "Allow new sign-ups")}{row("guideRegistrationOpen", "Guide registration", "Allow new guide applications")}</CardContent></Card>
      <Card><CardHeader><CardTitle>Maintenance message</CardTitle><CardDescription>Stored for display; not shown automatically.</CardDescription></CardHeader><CardContent className="flex gap-2"><Input value={msg ?? data.maintenanceMessage} onChange={(e) => setMsg(e.target.value)} maxLength={300} /><Button onClick={async () => { try { setData(await adminService.updateSettings({ maintenanceMessage: msg ?? "" })); toast({ title: "Saved" }) } catch (e) { toast({ title: "Error", description: errMsg(e), variant: "destructive" }) } }}>Save</Button></CardContent></Card>
    </div>
  )
}
