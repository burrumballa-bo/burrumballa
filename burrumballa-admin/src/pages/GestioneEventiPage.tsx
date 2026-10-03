import { useNavigate } from "react-router-dom"
import { ArrowLeft, CalendarDays, Plus } from "lucide-react"
import { toast } from "sonner"

import { useEventInfo } from "@/hooks/useEventInfo"
import { formatDateOnly } from "@/lib/datetime"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function GestioneEventiPage() {
  const navigate = useNavigate()
  const eventInfoQuery = useEventInfo()

  const handleNewEvent = () => {
    toast("Presto disponibile", {
      description: "La creazione di nuovi eventi non è ancora attiva.",
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-semibold">Gestione eventi</h1>
        </div>
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
              <CardDescription>{formatDateOnly(eventInfoQuery.data.data_evento)}</CardDescription>
            )}
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
