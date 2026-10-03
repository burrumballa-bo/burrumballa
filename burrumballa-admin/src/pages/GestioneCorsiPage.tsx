import { useNavigate } from "react-router-dom"
import { ArrowLeft, BookOpen, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const SECTIONS = [
  {
    path: "/admin/corsi/corsi",
    icon: BookOpen,
    title: "Corsi",
    description: "Aggiungi corsi, classi (giorno e orario) e maestri.",
  },
  {
    path: "/admin/corsi/iscritti",
    icon: Users,
    title: "Iscritti",
    description: "Iscritti alla scuola, classi frequentate e abbonamenti.",
  },
]

export default function GestioneCorsiPage() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">Gestione corsi</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.path}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="text-muted-foreground size-4" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
              <Button className="mt-3 w-fit" onClick={() => navigate(section.path)}>
                Apri
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
