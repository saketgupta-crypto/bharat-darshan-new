import { NavLink, Outlet } from "react-router-dom"
import Header from "@/components/Header"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/AuthContext"

export interface PanelLink { to: string; label: string; end?: boolean }

/** Shared shell for the four role dashboards: fixed site header + left nav (top tabs on mobile). */
export default function PanelLayout({ title, links }: { title: string; links: PanelLink[] }) {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12 flex flex-col md:flex-row gap-6">
        <aside className="md:w-56 shrink-0">
          <div className="mb-3">
            <h2 className="text-xl font-serif font-bold text-foreground">{title}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="truncate">{user?.name}</span><Badge variant="secondary">{user?.role}</Badge>
            </div>
          </div>
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0"><Outlet /></main>
      </div>
    </div>
  )
}
