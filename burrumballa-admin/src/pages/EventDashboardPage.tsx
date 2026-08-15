import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ListChecks, PencilLine } from "lucide-react"

import { useEventInfo } from "@/hooks/useEventInfo"
import { useEventOptionsStato } from "@/hooks/useEventOptionsStato"
import { useRegistrations } from "@/hooks/useRegistrations"
import { formatDateOnly } from "@/lib/datetime"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SummaryCards } from "@/components/SummaryCards"
import { EventOptionCards } from "@/components/EventOptionCards"

// Chiavi "placeholder" a catalogo (vedi supabase/migrations): non sono
// attività reali, quindi non vanno mostrate come card di riepilogo.
const NO_WORKSHOP_KEY = "no_workshop"
const NO_BATTLE_KEY = "no_battle"

export default function EventDashboardPage() {
  const navigate = useNavigate()
  const eventInfoQuery = useEventInfo()
  const registrationsQuery = useRegistrations()
  const optionsQuery = useEventOptionsStato()

  const registrations = useMemo(
    () => registrationsQuery.data ?? [],
    [registrationsQuery.data]
  )

  const options = optionsQuery.data ?? []
  const workshopOptions = options.filter(
    (o) => o.tipo === "workshop" && o.chiave !== NO_WORKSHOP_KEY
  )
  const battleOptions = options.filter(
    (o) => o.tipo === "battle" && o.chiave !== NO_BATTLE_KEY
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {eventInfoQuery.data?.titolo ?? "Evento"}
          </h1>
          {eventInfoQuery.data?.data_evento && (
            <p className="text-muted-foreground text-sm">
              {formatDateOnly(eventInfoQuery.data.data_evento)}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate("/admin/evento/pagina")}>
          <PencilLine />
          Modifica pagina evento
        </Button>
        <Button variant="outline" onClick={() => navigate("/admin/evento/iscritti")}>
          <ListChecks />
          Iscritti
        </Button>
      </div>

      {registrationsQuery.isError && (
        <p className="text-destructive text-sm">
          Errore nel caricamento degli iscritti:{" "}
          {(registrationsQuery.error as Error).message}
        </p>
      )}

      {registrationsQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento statistiche...</p>
      ) : (
        <SummaryCards registrations={registrations} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Workshop</CardTitle>
        </CardHeader>
        <CardContent>
          {optionsQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Caricamento opzioni...</p>
          ) : optionsQuery.isError ? (
            <p className="text-destructive text-sm">
              Errore nel caricamento delle opzioni:{" "}
              {(optionsQuery.error as Error).message}
            </p>
          ) : (
            <EventOptionCards options={workshopOptions} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Battle</CardTitle>
        </CardHeader>
        <CardContent>
          {optionsQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Caricamento opzioni...</p>
          ) : optionsQuery.isError ? null : (
            <EventOptionCards options={battleOptions} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
