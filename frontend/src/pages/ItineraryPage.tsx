import { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ItineraryView from "@/components/ItineraryView"
import { useAuth } from "@/context/AuthContext"
import { useAsync } from "@/hooks/useAsync"
import { destinationService } from "@/services/destination.service"
import { itineraryService } from "@/services/itinerary.service"
import { errMsg } from "@/services/api"
import { toast } from "@/hooks/use-toast"
import type { Itinerary } from "@/types"
import { MapPin, Calendar, Users, Sparkles, Wallet } from "lucide-react"

const STYLES = ["Adventure", "Spiritual", "Historical", "Nature", "Luxury", "Budget", "Family", "Romantic", "Cultural"]
const TRANSPORT = ["Any", "Flight", "Train", "Road trip / car", "Bus", "Mixed"]
const STAY = ["Any", "Budget stay", "Mid-range hotel", "Luxury hotel", "Homestay", "Resort"]
const INTERESTS = ["Food", "Photography", "Temples", "Wildlife", "Shopping", "Trekking", "Local culture", "Nightlife", "Museums", "Beaches"]
const label = "text-sm font-semibold text-card-foreground flex items-center gap-2"

export default function ItineraryPage() {
  const { user } = useAuth()
  const { data: dests } = useAsync(() => destinationService.list({ limit: 50 }), [])
  const [f, setF] = useState({ startingLocation: "", destination: "", startDate: "", endDate: "", duration: "", adults: "1", children: "0", budget: "", travelStyle: "", transportation: "Any", accommodation: "Any", dietary: "", specialRequirements: "" })
  const [interests, setInterests] = useState<string[]>([])
  const [result, setResult] = useState<Itinerary | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }))
  const valid = f.startingLocation && f.destination && f.travelStyle && (f.duration || (f.startDate && f.endDate))

  const handleGenerateItinerary = async () => {
    if (!valid) return
    setIsGenerating(true)
    try {
      const it = await itineraryService.generate({
        startingLocation: f.startingLocation.trim(), destination: f.destination.trim(),
        startDate: f.startDate || undefined, endDate: f.endDate || undefined, duration: f.duration ? Number(f.duration) : undefined,
        adults: Number(f.adults) || 1, children: Number(f.children) || 0, budget: Number(f.budget) || 0,
        travelStyle: f.travelStyle, transportation: f.transportation, accommodation: f.accommodation,
        interests, dietary: f.dietary, specialRequirements: f.specialRequirements,
      })
      setResult(it)
      toast({ title: "Itinerary ready", description: "It has been saved to My Trips." })
      setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch (e) {
      toast({ title: "Could not generate itinerary", description: errMsg(e), variant: "destructive" })
    } finally { setIsGenerating(false) }
  }
  const resetForm = () => { setResult(null); window.scrollTo({ top: 0, behavior: "smooth" }) }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden mt-16">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/itinerary.jpg')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />

        <motion.div
          className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl font-serif mb-4 gold-accent">AI Itinerary Planner</h1>
          <p className="text-lg md:text-xl text-white/90 leading-relaxed">
            Let our intelligent system create the perfect travel plan tailored just for you
          </p>
        </motion.div>
      </section>

      {/* Itinerary Generator Form */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Card className="shadow-xl border-0 bg-card indian-pattern">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-serif text-card-foreground flex items-center justify-center gap-3">
                  <Sparkles className="w-8 h-8 text-primary" />
                  Create Your Perfect Journey
                </CardTitle>
                <p className="text-muted-foreground mt-2">Answer a few questions and let our AI craft a personalized itinerary for your Indian adventure</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><label className={label}><MapPin className="w-4 h-4 text-primary" />Starting location</label><Input className="h-12" value={f.startingLocation} onChange={set("startingLocation")} placeholder="e.g. Lucknow" maxLength={100} /></div>
                  <div className="space-y-2"><label className={label}><MapPin className="w-4 h-4 text-primary" />Destination</label>
                    <Input className="h-12" list="dest-list" value={f.destination} onChange={set("destination")} placeholder="Choose or type a destination" maxLength={100} />
                    <datalist id="dest-list">{(dests?.items ?? []).map((d) => <option key={d._id} value={d.name} />)}</datalist></div>
                  <div className="space-y-2"><label className={label}><Calendar className="w-4 h-4 text-primary" />Start date (optional)</label><Input className="h-12" type="date" value={f.startDate} onChange={set("startDate")} /></div>
                  <div className="space-y-2"><label className={label}><Calendar className="w-4 h-4 text-primary" />End date or duration</label>
                    <div className="grid grid-cols-2 gap-2"><Input className="h-12" type="date" min={f.startDate} value={f.endDate} onChange={set("endDate")} /><Input className="h-12" type="number" min={1} max={30} placeholder="or days" value={f.duration} onChange={set("duration")} /></div></div>
                  <div className="space-y-2"><label className={label}><Users className="w-4 h-4 text-primary" />Adults</label><Input className="h-12" type="number" min={1} max={20} value={f.adults} onChange={set("adults")} /></div>
                  <div className="space-y-2"><label className={label}><Users className="w-4 h-4 text-primary" />Children</label><Input className="h-12" type="number" min={0} max={20} value={f.children} onChange={set("children")} /></div>
                  <div className="space-y-2"><label className={label}><Wallet className="w-4 h-4 text-primary" />Total budget (INR)</label><Input className="h-12" type="number" min={0} value={f.budget} onChange={set("budget")} placeholder="e.g. 40000" /></div>
                  <div className="space-y-2"><label className={label}>Travel style</label>
                    <Select value={f.travelStyle} onValueChange={(v) => setF((p) => ({ ...p, travelStyle: v }))}><SelectTrigger className="h-12"><SelectValue placeholder="Choose style" /></SelectTrigger><SelectContent>{STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><label className={label}>Transportation</label>
                    <Select value={f.transportation} onValueChange={(v) => setF((p) => ({ ...p, transportation: v }))}><SelectTrigger className="h-12"><SelectValue /></SelectTrigger><SelectContent>{TRANSPORT.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><label className={label}>Accommodation</label>
                    <Select value={f.accommodation} onValueChange={(v) => setF((p) => ({ ...p, accommodation: v }))}><SelectTrigger className="h-12"><SelectValue /></SelectTrigger><SelectContent>{STAY.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="space-y-2"><label className={label}>Interests</label>
                  <div className="flex flex-wrap gap-2">{INTERESTS.map((i) => (
                    <Button key={i} type="button" size="sm" variant={interests.includes(i) ? "default" : "outline"} className="rounded-full" onClick={() => setInterests((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i])}>{i}</Button>))}</div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><label className={label}>Dietary preferences</label><Input className="h-12" value={f.dietary} onChange={set("dietary")} placeholder="Vegetarian, Jain, no spice..." maxLength={80} /></div>
                  <div className="space-y-2"><label className={label}>Special requirements</label><Textarea value={f.specialRequirements} onChange={set("specialRequirements")} placeholder="Wheelchair access, elderly travellers, ..." maxLength={500} rows={2} /></div>
                </div>
                {user ? (
                  <Button onClick={handleGenerateItinerary} disabled={!valid || isGenerating} size="lg" className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg">
                    {isGenerating ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>Creating your itinerary (can take up to a minute)...</>) : (<><Sparkles className="w-5 h-5 mr-2" />Generate My Itinerary</>)}
                  </Button>
                ) : (
                  <Button asChild size="lg" className="w-full h-14 text-lg rounded-xl"><Link to="/auth/login" state={{ from: "/itinerary" }}>Log in to generate your itinerary</Link></Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {result && (
            <div id="result" className="mt-16 space-y-8">
              <ItineraryView itinerary={result} editable onChange={setResult} onDeleted={resetForm} />
              <div className="text-center"><Button variant="outline" onClick={resetForm}>Plan another trip</Button> <Button asChild variant="ghost"><Link to="/dashboard/trips">View all my trips</Link></Button></div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
