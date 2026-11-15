import { Link, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import ItineraryView from "@/components/ItineraryView"
import { useAsync } from "@/hooks/useAsync"
import { itineraryService } from "@/services/itinerary.service"
import { ErrorBlock, LoadingBlock } from "@/components/DataState"

export default function TripDetailPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, reload, setData } = useAsync(() => itineraryService.get(id), [id])
  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild><Link to="/dashboard/trips">← Back to My Trips</Link></Button>
      {loading && !data ? <LoadingBlock /> : error || !data ? <ErrorBlock message={error ?? "Trip not found"} onRetry={reload} /> : (
        <ItineraryView itinerary={data} editable onChange={setData} onDeleted={() => navigate("/dashboard/trips")} />)}
    </div>
  )
}
