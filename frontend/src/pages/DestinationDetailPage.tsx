import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import DestinationCard from "@/components/DestinationCard"
import HotelCard from "@/components/HotelCard"
import GuideCard from "@/components/GuideCard"
import ReviewsSection, { Stars } from "@/components/ReviewsSection"
import { ErrorBlock, LoadingBlock } from "@/components/DataState"
import { useAsync } from "@/hooks/useAsync"
import { destinationService } from "@/services/destination.service"
import { hotelService } from "@/services/hotel.service"
import { guideService } from "@/services/guide.service"
import { MapPin, Calendar, Clock, Wallet } from "lucide-react"

export default function DestinationDetailPage() {
  const { slug = "" } = useParams()
  const { data: d, loading, error, reload } = useAsync(() => destinationService.get(slug), [slug])
  const { data: related } = useAsync(() => destinationService.related(slug).catch(() => []), [slug])
  const { data: hotels } = useAsync(() => (d ? hotelService.list({ destination: d._id, limit: 3 }) : Promise.resolve(null)), [d?._id])
  const { data: guides } = useAsync(() => (d ? guideService.list({ location: d.state, limit: 3 }) : Promise.resolve(null)), [d?._id])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {loading && !d ? <div className="pt-32"><LoadingBlock /></div> : error || !d ? <div className="pt-32"><ErrorBlock message={error ?? "Destination not found"} onRetry={reload} /></div> : (<>
        <section className="relative h-96 mt-16 flex items-end overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${d.images?.[0] || "/placeholder.jpg"}')` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
          <div className="relative z-10 max-w-7xl mx-auto w-full px-4 pb-8 text-white">
            <Badge className="mb-3">{d.category}</Badge>
            <h1 className="text-4xl md:text-6xl font-serif gold-accent">{d.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-white/90"><span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{d.state}</span>{d.reviewCount > 0 && <span className="flex items-center gap-2"><Stars value={d.avgRating} />{d.avgRating.toFixed(1)} ({d.reviewCount})</span>}</div>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-14">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <p className="text-lg leading-relaxed">{d.description}</p>
              {!!d.attractions.length && <div><h2 className="text-2xl font-serif mb-3">Top attractions</h2><div className="flex flex-wrap gap-2">{d.attractions.map((a) => <Badge key={a} variant="secondary" className="px-3 py-1">{a}</Badge>)}</div></div>}
              {d.images.length > 1 && <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{d.images.slice(1).map((src) => <img key={src} src={src} alt={d.name} className="rounded-lg h-40 w-full object-cover" />)}</div>}
            </div>
            <Card className="h-fit"><CardContent className="p-6 space-y-4">
              <div className="flex gap-3"><Calendar className="w-5 h-5 text-primary" /><div><p className="text-sm text-muted-foreground">Best time to visit</p><p className="font-medium">{d.bestTimeToVisit || "Year-round"}</p></div></div>
              <div className="flex gap-3"><Clock className="w-5 h-5 text-primary" /><div><p className="text-sm text-muted-foreground">Recommended duration</p><p className="font-medium">{d.recommendedDuration || "Flexible"}</p></div></div>
              <div className="flex gap-3"><Wallet className="w-5 h-5 text-primary" /><div><p className="text-sm text-muted-foreground">Average budget (estimate)</p><p className="font-medium">{d.averageBudget ? `₹${d.averageBudget.toLocaleString("en-IN")}` : "Varies"}</p></div></div>
              <Button asChild className="w-full"><Link to="/itinerary">Plan this trip with AI</Link></Button>
            </CardContent></Card>
          </div>
          {!!hotels?.items.length && <section><h2 className="text-2xl font-serif mb-6">Stay here</h2><div className="grid md:grid-cols-3 gap-6">{hotels.items.map((h) => <HotelCard key={h._id} hotel={h} />)}</div></section>}
          {!!guides?.items.length && <section><h2 className="text-2xl font-serif mb-6">Local guides</h2><div className="grid md:grid-cols-3 gap-6">{guides.items.map((g) => <GuideCard key={g._id} guide={g} />)}</div></section>}
          <ReviewsSection targetType="Destination" targetId={d._id} onChanged={reload} />
          {!!related?.length && <section><h2 className="text-2xl font-serif mb-6">You might also like</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{related.map((r) => <DestinationCard key={r._id} destination={r} />)}</div></section>}
        </div>
      </>)}
      <Footer />
    </div>
  )
}
