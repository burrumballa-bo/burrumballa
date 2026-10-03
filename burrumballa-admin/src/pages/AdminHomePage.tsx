import { useNavigate } from "react-router-dom"
import { CalendarDays, GraduationCap, Globe, LogOut, Settings } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const SECTIONS = [
  {
    path: "/admin/corsi",
    icon: GraduationCap,
    title: "Gestione corsi",
    description: "Corsi, classi, maestri, iscritti e abbonamenti della scuola.",
    button: "Apri gestione corsi",
  },
  {
    path: "/admin/sito",
    icon: Globe,
    title: "Gestione sito",
    description: "Testi, immagini, corsi ed eventi del sito pubblico burrumballa.it.",
    button: "Apri gestione sito",
  },
  {
    path: "/admin/eventi",
    icon: CalendarDays,
    title: "Gestione eventi",
    description: "Eventi, iscritti e pagina dedicata.",
    button: "Apri gestione eventi",
  },
]

export default function AdminHomePage() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/admin/login", { replace: true })
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Card key={section.path}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="text-muted-foreground size-4" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
              <Button className="mt-3 w-fit" onClick={() => navigate(section.path)}>
                {section.button}
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
