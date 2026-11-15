import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useAsync } from "@/hooks/useAsync"
import { errMsg } from "@/services/api"
import { toast } from "@/hooks/use-toast"
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/DataState"

type Opt = string | { value: string; label: string }
export interface Field { name: string; label: string; type: "text" | "textarea" | "number" | "select" | "tags" | "checkbox"; options?: Opt[]; required?: boolean; placeholder?: string }
interface Props<T extends { _id: string }> {
  title: string
  fields: Field[]
  columns: { label: string; render: (r: T) => ReactNode }[]
  load: () => Promise<T[]>
  create?: (d: Record<string, unknown>) => Promise<unknown>
  update: (id: string, d: Record<string, unknown>) => Promise<unknown>
  remove?: (id: string) => Promise<unknown>
  upload?: (id: string, files: File[]) => Promise<unknown>
  extraActions?: (r: T, reload: () => void) => ReactNode
  defaults?: Record<string, unknown>
}

const get = (o: Record<string, unknown>, path: string): unknown => path.split(".").reduce<unknown>((a, k) => (a as Record<string, unknown> | undefined)?.[k], o)

function toForm<T extends object>(fields: Field[], rec?: T, defaults: Record<string, unknown> = {}) {
  const out: Record<string, string | boolean> = {}
  for (const f of fields) {
    const v = rec ? get(rec as Record<string, unknown>, f.name) : defaults[f.name]
    out[f.name] = f.type === "checkbox" ? Boolean(v) : f.type === "tags" ? (Array.isArray(v) ? v.join(", ") : "") : v === undefined || v === null ? "" : String(v)
  }
  return out
}
function fromForm(fields: Field[], form: Record<string, string | boolean>) {
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    const raw = form[f.name]
    let val: unknown
    if (f.type === "checkbox") val = Boolean(raw)
    else if (f.type === "number") { if (raw === "") continue; val = Number(raw) }
    else if (f.type === "tags") val = String(raw).split(",").map((s) => s.trim()).filter(Boolean)
    else { if (raw === "" && !f.required) continue; val = raw }
    const [a, b] = f.name.split(".")
    if (b) out[a] = { ...(out[a] as object), [b]: val }
    else out[a] = val
  }
  return out
}

export default function CrudManager<T extends { _id: string }>({ title, fields, columns, load, create, update, remove, upload, extraActions, defaults }: Props<T>) {
  const { data, loading, error, reload } = useAsync(load, [])
  const [editing, setEditing] = useState<T | "new" | null>(null)
  const [form, setForm] = useState<Record<string, string | boolean>>({})
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)

  const open = (r: T | "new") => { setEditing(r); setFiles([]); setForm(toForm(fields, r === "new" ? undefined : r, defaults)) }
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const body = fromForm(fields, form)
      let id = editing !== "new" && editing ? editing._id : ""
      if (editing === "new") { const created = (await create!(body)) as { _id: string }; id = created._id } else await update(id, body)
      if (files.length && upload && id) await upload(id, files)
      toast({ title: editing === "new" ? "Created" : "Saved" }); setEditing(null); reload()
    } catch (err) { toast({ title: "Could not save", description: errMsg(err), variant: "destructive" }) }
    finally { setBusy(false) }
  }
  const del = async (r: T) => {
    if (!remove || !confirm("Delete permanently?")) return
    try { await remove(r._id); toast({ title: "Deleted" }); reload() } catch (err) { toast({ title: "Error", description: errMsg(err), variant: "destructive" }) }
  }
  const optVal = (o: Opt) => (typeof o === "string" ? o : o.value)
  const optLabel = (o: Opt) => (typeof o === "string" ? o : o.label)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-serif font-bold">{title}</h1>{create && <Button onClick={() => open("new")}>Add new</Button>}</div>

      {editing && (
        <Card><CardContent className="p-5">
          <form onSubmit={save} className="grid md:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.name} className={`space-y-1 ${f.type === "textarea" ? "md:col-span-2" : ""}`}>
                {f.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form[f.name])} onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })} />{f.label}</label>
                ) : (<>
                  <Label htmlFor={f.name}>{f.label}{f.type === "tags" && " (comma separated)"}</Label>
                  {f.type === "textarea" ? <Textarea id={f.name} rows={4} required={f.required} value={String(form[f.name] ?? "")} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                    : f.type === "select" ? (
                      <select id={f.name} required={f.required} value={String(form[f.name] ?? "")} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        {!f.required && <option value="">-</option>}{f.options?.map((o) => <option key={optVal(o)} value={optVal(o)}>{optLabel(o)}</option>)}
                      </select>
                    ) : <Input id={f.name} type={f.type === "number" ? "number" : "text"} step={f.type === "number" ? "any" : undefined} required={f.required} placeholder={f.placeholder} value={String(form[f.name] ?? "")} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />}
                </>)}
              </div>))}
            {upload && <div className="md:col-span-2 space-y-1"><Label htmlFor="imgs">Add images (JPEG/PNG/WebP, max 5MB each)</Label><Input id="imgs" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /></div>}
            <div className="md:col-span-2 flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save"}</Button><Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div>
          </form>
        </CardContent></Card>)}

      {loading && !data ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={reload} /> : !data?.length ? <EmptyBlock title="Nothing here yet" /> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr>{columns.map((c) => <th key={c.label} className="px-4 py-3 font-medium">{c.label}</th>)}<th className="px-4 py-3 font-medium">Actions</th></tr></thead>
            <tbody>{data.map((r) => (
              <tr key={r._id} className="border-t">
                {columns.map((c) => <td key={c.label} className="px-4 py-3 align-top">{c.render(r)}</td>)}
                <td className="px-4 py-3"><div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => open(r)}>Edit</Button>
                  {extraActions?.(r, reload)}
                  {remove && <Button size="sm" variant="outline" className="text-destructive" onClick={() => del(r)}>Delete</Button>}
                </div></td>
              </tr>))}</tbody>
          </table>
        </div>)}
    </div>
  )
}
