import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CoursesSection } from "@/components/CoursesSection"

export default function CorsiGestionePage() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin/corsi")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">Gestione corsi — Corsi</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Corsi, classi e maestri</CardTitle>
          <CardDescription>
            Apri un corso per aggiungere le classi (livello, giorno, orario) e i maestri. I dati sono
            gli stessi mostrati sul sito.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoursesSection />
        </CardContent>
      </Card>
    </div>
  )
}
