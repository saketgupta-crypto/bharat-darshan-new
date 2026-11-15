import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import DestinationCard from "@/components/DestinationCard"
import { useAsync } from "@/hooks/useAsync"
import { userService } from "@/services/user.service"
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/DataState"

export default function FavoritesPage() {
  const { data, loading, error, reload } = useAsync(() => userService.dashboard(), [])
  const favs = data?.favoriteDestinations ?? []
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold">Saved Destinations</h1>
      {loading && !data ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={reload} /> : !favs.length ? (
        <div><EmptyBlock title="No favourites yet" hint="Tap the heart on any destination to save it here." /><div className="text-center"><Button asChild><Link to="/destinations">Browse destinations</Link></Button></div></div>
      ) : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">{favs.map((d) => <DestinationCard key={d._id} destination={d} />)}</div>}
    </div>
  )
}
