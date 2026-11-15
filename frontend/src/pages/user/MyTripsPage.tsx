import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock } from "lucide-react"
import { useAsync } from "@/hooks/useAsync"
import { itineraryService } from "@/services/itinerary.service"
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/DataState"

export default function MyTripsPage() {
  const { data, loading, error, reload } = useAsync(() => itineraryService.list(), [])
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-serif font-bold">My Trips</h1><Button asChild><Link to="/itinerary">New AI itinerary</Link></Button></div>
      {loading && !data ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={reload} /> : !data?.length ? <EmptyBlock title="No saved trips yet" hint="Generate an itinerary and it will appear here." /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {data.map((t) => (
            <Link key={t._id} to={`/dashboard/trips/${t._id}`}><Card className="hover:shadow-lg transition-shadow h-full"><CardContent className="p-5 space-y-2">
              <h3 className="font-semibold text-lg">{t.title}</h3>
              <div className="flex items-center text-sm text-muted-foreground"><MapPin className="w-4 h-4 mr-1" />{t.destination}<Clock className="w-4 h-4 ml-3 mr-1" />{t.duration} days</div>
              <div className="flex gap-2">{t.travelStyle && <Badge variant="secondary">{t.travelStyle}</Badge>}{t.isShared && <Badge>Shared</Badge>}</div>
              <p className="text-xs text-muted-foreground">Created {new Date(t.createdAt).toLocaleDateString()}</p>
            </CardContent></Card></Link>))}
        </div>)}
    </div>
  )
}
