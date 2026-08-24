import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  FileText,
  Home,
  Info,
  LayoutTemplate,
  Layers,
  LogOut,
  Moon,
  Plus,
  Settings,
  SunMoon,
  PartyPopper,
} from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import { useEventInfo } from "@/hooks/useEventInfo"
import { formatDateOnly } from "@/lib/datetime"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const CONTENUTI_SECTIONS = [
  {
    path: "/admin/contenuti/home",
    icon: Home,
    title: "Home",
    description: "Hero, calendario, preview corsi/eventi, teaser chi siamo, cta finale.",
  },
  {
    path: "/admin/contenuti/corsi",
    icon: LayoutTemplate,
    title: "Corsi",
    description: "Testi della pagina Corsi.",
  },
  {
    path: "/admin/contenuti/classi",
    icon: Layers,
    title: "Classi",
    description: "Le 4 discipline (nome, colore, descrizione, immagine, orari) mostrate su Home e Corsi.",
  },
  {
    path: "/admin/contenuti/eventi",
    icon: PartyPopper,
    title: "Eventi",
    description: "Testi della pagina Eventi e l'elenco degli eventi mostrati sul sito.",
  },
  {
    path: "/admin/contenuti/chi-siamo",
    icon: Info,
    title: "Chi siamo",
    description: "Storia, valori, crew, corsi kids, sede.",
  },
  {
    path: "/admin/contenuti/footer",
    icon: FileText,
    title: "Footer",
    description: "Testo, indirizzo e contatti mostrati in fondo a ogni pagina.",
  },
  {
    path: "/admin/contenuti/tema",
    icon: Moon,
    title: "Tema",
    description: "Personalizza i colori del tema scuro del sito.",
  },
  {
    path: "/admin/contenuti/impostazioni-generali",
    icon: SunMoon,
    title: "Impostazioni generali",
    description: "Scegli se il sito deve avere il tema chiaro o il tema scuro.",
  },
]

export default function AdminHomePage() {
  const navigate = useNavigate()
  const eventInfoQuery = useEventInfo()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/admin/login", { replace: true })
  }

  const handleNewEvent = () => {
    toast("Presto disponibile", {
      description: "La creazione di nuovi eventi non è ancora attiva.",
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/impostazioni")}>
            <Settings />
            Impostazioni
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut />
            Esci
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Contenuti sito</h2>
          <p className="text-muted-foreground text-sm">
            Testi, immagini, corsi ed eventi del sito pubblico burrumballa.it.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENUTI_SECTIONS.map((section) => (
            <Card
              key={section.path}
              role="button"
              tabIndex={0}
              onClick={() => navigate(section.path)}
              onKeyDown={(event) => {
                if (event.key === "Enter") navigate(section.path)
              }}
              className="hover:border-primary/50 cursor-pointer transition-colors"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="text-muted-foreground size-4" />
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Eventi</h2>
          <Button onClick={handleNewEvent}>
            <Plus />
            Nuovo evento
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            role="button"
            tabIndex={0}
            onClick={() => navigate("/admin/evento")}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate("/admin/evento")
            }}
            className="hover:border-primary/50 cursor-pointer transition-colors"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="text-muted-foreground size-4" />
                {eventInfoQuery.data?.titolo ?? "Evento"}
              </CardTitle>
              {eventInfoQuery.data?.data_evento && (
                <CardDescription>
                  {formatDateOnly(eventInfoQuery.data.data_evento)}
                </CardDescription>
              )}
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
