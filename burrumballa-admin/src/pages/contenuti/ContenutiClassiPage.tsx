import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CoursesSection } from "@/components/CoursesSection"

export default function ContenutiClassiPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">Contenuti — Classi</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Discipline</CardTitle>
          <CardDescription>
            Le 4 discipline (nome, colore, descrizione, immagine, orari) mostrate su Home e Corsi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoursesSection />
        </CardContent>
      </Card>
    </div>
  )
}
