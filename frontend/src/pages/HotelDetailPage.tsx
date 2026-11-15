import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ReviewsSection, { Stars } from "@/components/ReviewsSection"
import { ErrorBlock, LoadingBlock } from "@/components/DataState"
import { useAsync } from "@/hooks/useAsync"
import { hotelService } from "@/services/hotel.service"
import { MapPin } from "lucide-react"

export default function HotelDetailPage() {
  const { id = "" } = useParams()
  const { data: h, loading, error, reload } = useAsync(() => hotelService.get(id), [id])
  const [active, setActive] = useState(0)
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 pt-28 pb-12 space-y-10">
        {loading && !h ? <LoadingBlock /> : error || !h ? <ErrorBlock message={error ?? "Hotel not found"} onRetry={reload} /> : (<>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-3">
              <img src={h.images[active] || "/placeholder.jpg"} alt={h.name} className="w-full h-96 object-cover rounded-2xl" />
              {h.images.length > 1 && <div className="flex gap-2 overflow-x-auto">{h.images.map((src, i) => <button key={src} onClick={() => setActive(i)} className={`shrink-0 rounded-lg overflow-hidden border-2 ${i === active ? "border-primary" : "border-transparent"}`}><img src={src} alt="" className="h-20 w-28 object-cover" /></button>)}</div>}
            </div>
            <Card className="h-fit"><CardContent className="p-6 space-y-4">
              <h1 className="text-3xl font-serif font-bold">{h.name}</h1>
              <p className="flex items-center text-muted-foreground"><MapPin className="w-4 h-4 mr-1" />{h.location}</p>
              <div className="flex items-center gap-2">{h.reviewCount > 0 ? <><Stars value={h.rating} /><span>{h.rating.toFixed(1)} ({h.reviewCount})</span></> : <span className="text-sm text-muted-foreground">No reviews yet</span>}</div>
              <p className="text-3xl font-bold text-primary">₹{h.pricePerNight.toLocaleString("en-IN")}<span className="text-sm font-normal text-muted-foreground"> / night (indicative)</span></p>
              <p className="text-xs text-muted-foreground">Bharat Darshan does not take bookings or show live availability. Contact the property to book.</p>
              {h.contactDetails?.phone && <p className="text-sm">Phone: {h.contactDetails.phone}</p>}
              {h.contactDetails?.email && <p className="text-sm">Email: {h.contactDetails.email}</p>}
              {h.contactDetails?.website && <a className="text-sm text-primary underline" href={h.contactDetails.website} target="_blank" rel="noopener noreferrer">Official website</a>}
              <Button asChild className="w-full"><Link to={`/contact?subject=${encodeURIComponent("Enquiry: " + h.name)}`}>Enquire with us</Link></Button>
            </CardContent></Card>
          </div>
          {h.description && <p className="text-lg leading-relaxed max-w-3xl">{h.description}</p>}
          {!!h.amenities.length && <div><h2 className="text-2xl font-serif mb-3">Amenities</h2><div className="flex flex-wrap gap-2">{h.amenities.map((a) => <Badge key={a} variant="secondary" className="px-3 py-1">{a}</Badge>)}</div></div>}
          <ReviewsSection targetType="Hotel" targetId={h._id} onChanged={reload} />
        </>)}
      </div>
      <Footer />
    </div>
  )
}
