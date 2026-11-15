import { useEffect } from "react"
import { Routes, Route, useLocation, Link, Navigate } from "react-router-dom"
import HomePage from "./pages/HomePage"
import DestinationsPage from "./pages/DestinationsPage"
import HotelsPage from "./pages/HotelsPage"
import GuidesPage from "./pages/GuidesPage"
import ItineraryPage from "./pages/ItineraryPage"
import ContactPage from "./pages/ContactPage"
import DashboardPage from "./pages/DashboardPage"
import ProfilePage from "./pages/ProfilePage"
import LoginPage from "./pages/auth/LoginPage"
import SignupPage from "./pages/auth/SignupPage"
import VerifyEmailPage from "./pages/auth/VerifyEmailPage"
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "./pages/auth/ResetPasswordPage"
import DestinationDetailPage from "./pages/DestinationDetailPage"
import HotelDetailPage from "./pages/HotelDetailPage"
import SharedItineraryPage from "./pages/SharedItineraryPage"
import { AboutPage, PrivacyPage, TermsPage, SitemapPage } from "./pages/StaticPages"
import RequireAuth from "./components/RequireAuth"
import PanelLayout from "./components/PanelLayout"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "./context/AuthContext"
import MyTripsPage from "./pages/user/MyTripsPage"
import TripDetailPage from "./pages/user/TripDetailPage"
import FavoritesPage from "./pages/user/FavoritesPage"
import MyReviewsPage from "./pages/user/MyReviewsPage"
import { GuideDashboard, GuideProfilePage, GuideInquiries, GuideReviews } from "./pages/guide/GuidePages"
import { AdminDashboard, AdminUsers, AdminDestinations, AdminHotels, AdminGuides, AdminReviews, AdminContacts, AdminAnalytics } from "./pages/admin/AdminPages"
import { ManageAdmins, ActivityLogs, AiUsage, SecurityMonitor, SystemSettings } from "./pages/superadmin/SuperAdminPages"
import type { PanelLink } from "./components/PanelLayout"

// Next.js scrolls to the top on every route change; React Router does not.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">This page could not be found.</p>
      <Link to="/" className="text-primary underline">Go home</Link>
    </div>
  )
}

const userLinks: PanelLink[] = [
  { to: "/dashboard", label: "Overview", end: true }, { to: "/itinerary", label: "AI Planner" }, { to: "/dashboard/trips", label: "My Trips" },
  { to: "/dashboard/favorites", label: "Saved Destinations" }, { to: "/dashboard/reviews", label: "My Reviews" }, { to: "/dashboard/profile", label: "Profile & Preferences" },
]
const guideLinks: PanelLink[] = [
  { to: "/guide", label: "Dashboard", end: true }, { to: "/guide/profile", label: "Profile & Pricing" }, { to: "/guide/inquiries", label: "Inquiries" }, { to: "/guide/reviews", label: "Reviews & Ratings" },
]

function AdminShell({ title }: { title: string }) {
  const { hasPermission } = useAuth()
  const links: PanelLink[] = [{ to: "/admin", label: "Dashboard", end: true }]
  if (hasPermission("users:manage")) links.push({ to: "/admin/users", label: "Users" })
  if (hasPermission("destinations:write")) links.push({ to: "/admin/destinations", label: "Destinations" })
  if (hasPermission("hotels:write")) links.push({ to: "/admin/hotels", label: "Hotels" })
  if (hasPermission("guides:manage")) links.push({ to: "/admin/guides", label: "Guides" })
  if (hasPermission("reviews:moderate")) links.push({ to: "/admin/reviews", label: "Reviews" })
  if (hasPermission("contacts:manage")) links.push({ to: "/admin/contacts", label: "Inquiries" })
  if (hasPermission("analytics:view")) links.push({ to: "/admin/analytics", label: "Reports" })
  return <PanelLayout title={title} links={links} />
}
const superLinks: PanelLink[] = [
  { to: "/super-admin", label: "Overview", end: true }, { to: "/super-admin/admins", label: "Admins & Permissions" }, { to: "/super-admin/activity", label: "Activity Logs" },
  { to: "/super-admin/ai-usage", label: "AI Usage" }, { to: "/super-admin/security", label: "Security" }, { to: "/super-admin/settings", label: "System Settings" },
  { to: "/super-admin/users", label: "Users" }, { to: "/super-admin/destinations", label: "Destinations" }, { to: "/super-admin/hotels", label: "Hotels" },
  { to: "/super-admin/guides", label: "Guides" }, { to: "/super-admin/reviews", label: "Reviews" }, { to: "/super-admin/contacts", label: "Inquiries" }, { to: "/super-admin/analytics", label: "Reports" },
]

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/destinations/:slug" element={<DestinationDetailPage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/hotels/:id" element={<HotelDetailPage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/itinerary" element={<ItineraryPage />} />
        <Route path="/shared/:token" element={<SharedItineraryPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/sitemap" element={<SitemapPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

        {/* USER panel */}
        <Route element={<RequireAuth roles={["USER"]} />}>
          <Route element={<PanelLayout title="My Travel" links={userLinks} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/trips" element={<MyTripsPage />} />
            <Route path="/dashboard/trips/:id" element={<TripDetailPage />} />
            <Route path="/dashboard/favorites" element={<FavoritesPage />} />
            <Route path="/dashboard/reviews" element={<MyReviewsPage />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />

        {/* GUIDE panel */}
        <Route element={<RequireAuth roles={["GUIDE"]} />}>
          <Route element={<PanelLayout title="Guide Panel" links={guideLinks} />}>
            <Route path="/guide" element={<GuideDashboard />} />
            <Route path="/guide/profile" element={<GuideProfilePage />} />
            <Route path="/guide/inquiries" element={<GuideInquiries />} />
            <Route path="/guide/reviews" element={<GuideReviews />} />
          </Route>
        </Route>

        {/* ADMIN panel (granular permissions are enforced by the API; links are hidden here for convenience) */}
        <Route element={<RequireAuth roles={["ADMIN"]} />}>
          <Route element={<AdminShell title="Admin Panel" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/destinations" element={<AdminDestinations />} />
            <Route path="/admin/hotels" element={<AdminHotels />} />
            <Route path="/admin/guides" element={<AdminGuides />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/contacts" element={<AdminContacts />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
          </Route>
        </Route>

        {/* SUPER ADMIN panel */}
        <Route element={<RequireAuth roles={["SUPER_ADMIN"]} />}>
          <Route element={<PanelLayout title="Super Admin" links={superLinks} />}>
            <Route path="/super-admin" element={<AdminDashboard />} />
            <Route path="/super-admin/admins" element={<ManageAdmins />} />
            <Route path="/super-admin/activity" element={<ActivityLogs />} />
            <Route path="/super-admin/ai-usage" element={<AiUsage />} />
            <Route path="/super-admin/security" element={<SecurityMonitor />} />
            <Route path="/super-admin/settings" element={<SystemSettings />} />
            <Route path="/super-admin/users" element={<AdminUsers />} />
            <Route path="/super-admin/destinations" element={<AdminDestinations />} />
            <Route path="/super-admin/hotels" element={<AdminHotels />} />
            <Route path="/super-admin/guides" element={<AdminGuides />} />
            <Route path="/super-admin/reviews" element={<AdminReviews />} />
            <Route path="/super-admin/contacts" element={<AdminContacts />} />
            <Route path="/super-admin/analytics" element={<AdminAnalytics />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  )
}
