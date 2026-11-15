import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { userService } from "@/services/user.service";
import { ErrorBlock, LoadingBlock } from "@/components/DataState";
import type { Itinerary } from "@/types";

const TripRow = ({ t }: { t: Itinerary }) => (
  <Link to={`/dashboard/trips/${t._id}`} className="block border rounded-lg p-4 hover:shadow-md transition-shadow">
    <h3 className="font-semibold">{t.title}</h3>
    <div className="mt-2 flex items-center text-sm text-muted-foreground">
      <MapPin className="w-4 h-4 mr-1" /><span>{t.destination}</span>
      <Clock className="w-4 h-4 ml-3 mr-1" /><span>{t.duration} days</span>
      {t.travelDates?.start && <Badge variant="secondary" className="ml-3">{new Date(t.travelDates.start).toLocaleDateString()}</Badge>}
    </div>
  </Link>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data, loading, error, reload } = useAsync(() => userService.dashboard(), []);

  if (loading && !data) return <LoadingBlock label="Loading your dashboard..." />;
  if (error || !data) return <ErrorBlock message={error ?? "Could not load dashboard"} onRetry={reload} />;
  const { user } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Welcome back, {user.name}</h1>
        <p className="mt-2 text-lg text-muted-foreground">Plan and manage your trips</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>User Profile</CardTitle><CardDescription>Your account information</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div><h3 className="font-medium">Name</h3><p className="text-muted-foreground">{user.name}</p></div>
            <div><h3 className="font-medium">Email</h3><p className="text-muted-foreground">{user.email}</p></div>
            <div><h3 className="font-medium">Member since</h3><p className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</p></div>
            <div><h3 className="font-medium">Saved trips</h3><p className="text-muted-foreground">{data.totalTrips}</p></div>
            <Button variant="outline" className="w-full" asChild><Link to="/dashboard/profile">Edit profile & preferences</Link></Button>
            <Button variant="outline" className="w-full" onClick={async () => { await logout(); navigate("/auth/login"); }}>Logout</Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader><CardTitle>Upcoming Trips</CardTitle><CardDescription>Trips with a start date in the future</CardDescription></CardHeader>
            <CardContent>
              {data.upcomingTrips.length ? <div className="space-y-4">{data.upcomingTrips.map((t) => <TripRow key={t._id} t={t} />)}</div> : (
                <div className="text-center py-8"><p className="text-muted-foreground">No upcoming trips yet.</p><Button className="mt-4" asChild><Link to="/itinerary">Plan a trip with AI</Link></Button></div>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent Itineraries</CardTitle><CardDescription>Your latest AI-generated plans</CardDescription></CardHeader>
            <CardContent>
              {data.recentItineraries.length ? <div className="space-y-4">{data.recentItineraries.map((t) => <TripRow key={t._id} t={t} />)}</div> : <p className="text-muted-foreground text-center py-4">Nothing here yet.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recently Viewed</CardTitle><CardDescription>Destinations you looked at lately</CardDescription></CardHeader>
            <CardContent>
              {data.recentlyViewed.length ? <div className="flex flex-wrap gap-2">{data.recentlyViewed.map((d) => <Link key={d._id} to={`/destinations/${d.slug}`}><Badge variant="secondary" className="px-3 py-1">{d.name}</Badge></Link>)}</div> : <p className="text-muted-foreground text-center py-4">No destinations viewed yet.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
