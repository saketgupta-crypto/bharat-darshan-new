import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useAsync } from "@/hooks/useAsync"
import { reviewService } from "@/services/misc.service"
import { errMsg } from "@/services/api"
import { toast } from "@/hooks/use-toast"
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/DataState"

export const Stars = ({ value }: { value: number }) => (
  <span className="inline-flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`w-4 h-4 ${i <= Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} />)}</span>
)

export default function ReviewsSection({ targetType, targetId, onChanged }: { targetType: "Destination" | "Hotel" | "Guide"; targetId: string; onChanged?: () => void }) {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useAsync(() => reviewService.list(targetType, targetId, page), [targetType, targetId, page])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await reviewService.create({ targetType, target: targetId, rating, comment })
      setComment(""); toast({ title: "Thanks for your review!" }); reload(); onChanged?.()
    } catch (err) { toast({ title: "Could not submit review", description: errMsg(err), variant: "destructive" }) }
    finally { setBusy(false) }
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-serif">Reviews</h2>
      {user ? (
        <form onSubmit={submit} className="space-y-3 rounded-xl border p-4 bg-card">
          <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((i) => (
            <button type="button" key={i} onClick={() => setRating(i)} aria-label={`${i} stars`}><Star className={`w-6 h-6 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} /></button>))}</div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." minLength={3} maxLength={2000} required rows={3} />
          <Button type="submit" disabled={busy || comment.trim().length < 3}>{busy ? "Submitting..." : "Submit review"}</Button>
        </form>
      ) : <p className="text-sm text-muted-foreground"><Link to="/auth/login" className="text-primary underline">Log in</Link> to write a review.</p>}
      {loading && !data ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={reload} /> : !data?.items.length ? <EmptyBlock title="No reviews yet" hint="Be the first to share your experience." /> : (
        <div className="space-y-3">
          {data.items.map((r) => (
            <Card key={r._id}><CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between"><span className="font-medium">{typeof r.user === "string" ? "Traveller" : r.user.name}</span><Stars value={r.rating} /></div>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
              <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
            </CardContent></Card>))}
          {data.meta.totalPages > 1 && <div className="flex justify-center gap-3"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button></div>}
        </div>
      )}
    </section>
  )
}
