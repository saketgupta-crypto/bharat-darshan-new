import { Button } from "@/components/ui/button"

export function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return <div className="text-center py-16 text-muted-foreground"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />{label}</div>
}
export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-16">
      <p className="text-destructive mb-4">{message}</p>
      {onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
    </div>
  )
}
export function EmptyBlock({ title, hint }: { title: string; hint?: string }) {
  return <div className="text-center py-12"><h3 className="text-lg font-semibold">{title}</h3>{hint && <p className="text-sm text-muted-foreground mt-1">{hint}</p>}</div>
}
