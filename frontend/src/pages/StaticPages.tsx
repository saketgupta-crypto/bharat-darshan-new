import { Link } from "react-router-dom"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 pt-28 pb-16 space-y-6 leading-relaxed">
        <h1 className="text-4xl font-serif gold-accent">{title}</h1>
        {children}
      </main>
      <Footer />
    </div>
  )
}

export const AboutPage = () => (
  <Shell title="About Bharat Darshan">
    <p>Bharat Darshan helps travellers discover India: destinations, hotels and local guides in one place, with an AI planner that drafts personalised itineraries.</p>
    <p>Itineraries are AI-generated suggestions. Prices, travel times and opening hours shown are estimates and must be verified with the provider. We do not process bookings or show live availability.</p>
    <p><Link to="/contact" className="text-primary underline">Get in touch</Link> if you have questions.</p>
  </Shell>
)
export const PrivacyPage = () => (
  <Shell title="Privacy Policy">
    <p>We store the details you give us (name, email, preferences, saved itineraries and enquiries) to run your account and the AI planner. Passwords are stored only as salted hashes.</p>
    <p>Trip details you submit to the planner are sent to our AI provider to generate your itinerary. Emails are sent through a transactional email provider. We do not sell your data.</p>
    <p>You can change your details in your profile at any time. To delete your account or data, contact us through the contact page.</p>
    <p className="text-sm text-muted-foreground">This is a template summary; have it reviewed by a qualified professional before launch.</p>
  </Shell>
)
export const TermsPage = () => (
  <Shell title="Terms of Service">
    <p>Content on Bharat Darshan, including AI-generated itineraries, is provided for planning purposes only and may contain errors. Always verify prices, timings, safety and entry requirements before you travel.</p>
    <p>You are responsible for keeping your login details safe and for the content you submit, including reviews. We may remove content or suspend accounts that break the rules.</p>
    <p className="text-sm text-muted-foreground">This is a template summary; have it reviewed by a qualified professional before launch.</p>
  </Shell>
)
export const SitemapPage = () => (
  <Shell title="Sitemap">
    <ul className="list-disc pl-6 space-y-1">
      {[["/", "Home"], ["/destinations", "Destinations"], ["/hotels", "Hotels"], ["/guides", "Guides"], ["/itinerary", "AI Itinerary Planner"], ["/contact", "Contact"], ["/about", "About"], ["/privacy", "Privacy"], ["/terms", "Terms"], ["/auth/login", "Login"], ["/auth/signup", "Sign up"]].map(([to, l]) => <li key={to}><Link className="text-primary underline" to={to}>{l}</Link></li>)}
    </ul>
  </Shell>
)
