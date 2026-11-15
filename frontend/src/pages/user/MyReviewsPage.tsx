import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Stars } from "@/components/ReviewsSection"
import { useAsync } from "@/hooks/useAsync"
import { reviewService } from "@/services/misc.service"
import { errMsg } from "@/services/api"
import { toast } from "@/hooks/use-toast"
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/DataState"

export default function MyReviewsPage() {
  const { data, loading, error, reload } = useAsync(() => reviewService.mine(), [])
  const [editing, setEditing] = useState<string | null>(null)
  const [text, setText] = useState("")
  const act = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); toast({ title: ok }); setEditing(null); reload() } catch (e) { toast({ title: "Error", description: errMsg(e), variant: "destructive" }) } }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold">My Reviews</h1>
      {loading && !data ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={reload} /> : !data?.length ? <EmptyBlock title="You have not written any reviews" hint="Open a destination, hotel or guide to leave one." /> : (
        <div className="space-y-3">{data.map((r) => (
          <Card key={r._id}><CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between"><div><span className="font-medium">{typeof r.target === "string" ? r.targetType : r.target?.name}</span> <Badge variant="outline">{r.targetType}</Badge> {r.status !== "APPROVED" && <Badge variant="secondary">{r.status}</Badge>}</div><Stars value={r.rating} /></div>
            {editing === r._id ? (<><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} /><div className="flex gap-2"><Button size="sm" onClick={() => act(() => reviewService.update(r._id, { comment: text }), "Review updated")}>Save</Button><Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div></>) : (<>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditing(r._id); setText(r.comment) }}>Edit</Button><Button size="sm" variant="outline" className="text-destructive" onClick={() => confirm("Delete this review?") && act(() => reviewService.remove(r._id), "Review deleted")}>Delete</Button></div></>)}
          </CardContent></Card>))}</div>)}
    </div>
  )
}
