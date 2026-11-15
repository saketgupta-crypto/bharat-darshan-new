import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ItineraryView from "@/components/ItineraryView"
import { ErrorBlock, LoadingBlock } from "@/components/DataState"
import { useAsync } from "@/hooks/useAsync"
import { itineraryService } from "@/services/itinerary.service"

export default function SharedItineraryPage() {
  const { token = "" } = useParams()
  const { data, loading, error, reload } = useAsync(() => itineraryService.getShared(token), [token])
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-12 space-y-8">
        {loading && !data ? <LoadingBlock /> : error || !data ? <ErrorBlock message="This shared itinerary is unavailable or sharing was turned off." onRetry={reload} /> : (<>
          <ItineraryView itinerary={data} />
          <div className="text-center"><Button asChild><Link to="/itinerary">Plan your own trip</Link></Button></div>
        </>)}
      </div>
      <Footer />
    </div>
  )
}
