import { useEffect, useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  House,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NavItem {
  to: string
  label: string
  icon?: LucideIcon
  /** Attivo solo sul path esatto (es. Home, che e' prefisso di tutto). */
  end?: boolean
}

interface NavGroup {
  /** Gruppi con etichetta = sezioni a fisarmonica. */
  label?: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    items: [
      { to: "/admin", label: "Home", icon: House, end: true },
      { to: "/admin/impostazioni", label: "Impostazioni", icon: Settings },
    ],
  },
  {
    label: "Scuola",
    items: [
      { to: "/admin/corsi/iscritti", label: "Iscritti", icon: Users },
      { to: "/admin/corsi/incassi", label: "Incassi", icon: Wallet },
      { to: "/admin/corsi/corsi", label: "Corsi e classi", icon: BookOpen },
    ],
  },
  {
    label: "Eventi",
    items: [{ to: "/admin/eventi", label: "Eventi", icon: CalendarDays }],
  },
  {
    label: "Sito pubblico",
    items: [
      { to: "/admin/contenuti/home", label: "Home" },
      { to: "/admin/contenuti/corsi", label: "Corsi" },
      { to: "/admin/contenuti/classi", label: "Classi" },
      { to: "/admin/contenuti/eventi", label: "Eventi" },
      { to: "/admin/contenuti/chi-siamo", label: "Chi siamo" },
      { to: "/admin/contenuti/footer", label: "Footer" },
      { to: "/admin/contenuti/tema", label: "Tema" },
      { to: "/admin/contenuti/impostazioni-generali", label: "Impostazioni sito" },
    ],
  },
  {
    items: [
      { to: "/admin/ricevute", label: "Ricevute", icon: ReceiptText },
    ],
  },
]

const OPEN_GROUPS_KEY = "admin-sidebar-open-groups-v2"
const DEFAULT_OPEN_GROUPS = ["Scuola"]

// Sezioni aperte: ricordate nel browser (se disponibile); la prima volta
// solo Scuola.
function loadOpenGroups(): Set<string> {
  try {
    const raw = localStorage.getItem(OPEN_GROUPS_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    // storage non disponibile: si parte dal default
  }
  return new Set(DEFAULT_OPEN_GROUPS)
}

function saveOpenGroups(groups: Set<string>) {
  try {
    localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify([...groups]))
  } catch {
    // non salvato: vale solo per questa visita
  }
}

function isItemActive(item: NavItem, pathname: string) {
  return item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { session } = useAuth()
  const [openGroups, setOpenGroups] = useState(loadOpenGroups)

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      saveOpenGroups(next)
      return next
    })

  // Arrivando su una pagina si apre la sua sezione (poi si puo' richiudere).
  useEffect(() => {
    const active = NAV.find((g) => g.label && g.items.some((item) => isItemActive(item, pathname)))
    if (!active?.label) return
    const label = active.label
    setOpenGroups((prev) => {
      if (prev.has(label)) return prev
      const next = new Set(prev).add(label)
      saveOpenGroups(next)
      return next
    })
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/admin/login", { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <p className="text-lg font-semibold">Burrumballa</p>
        <p className="text-muted-foreground text-xs">Amministrazione</p>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-2 pb-4" aria-label="Menu principale">
        {NAV.map((group, gi) => {
          const open = !group.label || openGroups.has(group.label)
          const panelId = `nav-group-${gi}`
          return (
            <div key={group.label ?? gi} className="space-y-0.5">
              {group.label && (
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => toggleGroup(group.label!)}
                  className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between rounded-md px-3 py-1 text-xs font-medium tracking-wide uppercase transition-colors"
                >
                  {group.label}
                  <ChevronDown
                    className={cn("size-3.5 transition-transform", !open && "-rotate-90")}
                    aria-hidden
                  />
                </button>
              )}
              {open && (
                <div id={panelId} className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                          !item.icon && "pl-9",
                          isActive
                            ? "bg-accent text-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )
                      }
                    >
                      {item.icon && <item.icon className="size-4 shrink-0" />}
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <div className="border-t p-3">
        {session?.user.email && (
          <p className="text-muted-foreground truncate px-1 pb-2 text-xs" title={session.user.email}>
            {session.user.email}
          </p>
        )}
        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
          <LogOut />
          Esci
        </Button>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  // Cambio pagina: si chiude il menu su mobile e si riparte dall'alto.
  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="bg-background min-h-screen md:flex">
      <aside className="bg-muted/40 sticky top-0 hidden h-screen w-60 shrink-0 border-r md:block">
        <SidebarContent />
      </aside>

      <header className="bg-background sticky top-0 z-30 flex items-center gap-2 border-b px-4 py-2 md:hidden">
        <Button variant="ghost" size="icon" aria-label="Apri menu" onClick={() => setMobileOpen(true)}>
          <Menu />
        </Button>
        <span className="font-semibold">Burrumballa</span>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" aria-hidden onClick={() => setMobileOpen(false)} />
          <aside className="bg-background absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r shadow-lg">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3"
              aria-label="Chiudi menu"
              onClick={() => setMobileOpen(false)}
            >
              <X />
            </Button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
