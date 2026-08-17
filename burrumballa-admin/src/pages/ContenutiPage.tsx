import { useNavigate } from "react-router-dom"
import { ArrowLeft, FileText, Home, Info, LayoutTemplate, PartyPopper } from "lucide-react"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const SECTIONS = [
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
    description: "Testi della pagina Corsi e le 4 discipline con i relativi orari.",
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
]

export default function ContenutiPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Contenuti sito</h1>
          <p className="text-muted-foreground text-sm">
            Testi, immagini, corsi ed eventi del sito pubblico burrumballa.it.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
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
  )
}
