import { Button } from "@/components/ui/button"
import type { PageMeta } from "@/types"

export default function Pager({ meta, onPage }: { meta?: PageMeta; onPage: (p: number) => void }) {
  if (!meta || meta.totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-4 mt-10">
      <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</Button>
      <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
      <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next</Button>
    </div>
  )
}
