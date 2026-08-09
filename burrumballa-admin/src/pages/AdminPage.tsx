import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarDays, FileDown, LogOut, Search, Settings } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { PAYMENT_STATUS_OPTIONS } from "@/lib/paymentStatus"
import { exportRegistrationsPdf } from "@/lib/pdfExport"
import { useRegistrations } from "@/hooks/useRegistrations"
import { useEventOptions } from "@/hooks/useEventOptions"
import { useEventInfo } from "@/hooks/useEventInfo"
import {
  useUpdateNoteAdmin,
  useUpdatePaymentStatus,
} from "@/hooks/useRegistrationMutations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SummaryCards } from "@/components/SummaryCards"
import { RegistrationsTable } from "@/components/RegistrationsTable"
import type { PaymentStatus, Registration } from "@/types/registration"

type StatusFilter = "tutti" | PaymentStatus

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "tutti", label: "Tutti" },
  ...PAYMENT_STATUS_OPTIONS,
]

export default function AdminPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("tutti")

  const registrationsQuery = useRegistrations()
  const eventOptionsQuery = useEventOptions()
  const eventInfoQuery = useEventInfo()
  const updateStatus = useUpdatePaymentStatus()
  const updateNote = useUpdateNoteAdmin()

  const registrations = useMemo(
    () => registrationsQuery.data ?? [],
    [registrationsQuery.data]
  )

  const { workshopLabels, battleLabels } = useMemo(() => {
    const workshop: Record<string, string> = {}
    const battle: Record<string, string> = {}
    for (const option of eventOptionsQuery.data ?? []) {
      if (option.tipo === "workshop") workshop[option.chiave] = option.label
      else battle[option.chiave] = option.label
    }
    return { workshopLabels: workshop, battleLabels: battle }
  }, [eventOptionsQuery.data])

  const searchFiltered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return registrations
    return registrations.filter((r) =>
      [r.nome, r.cognome, r.aka ?? "", r.email].some((field) =>
        field.toLowerCase().includes(term)
      )
    )
  }, [registrations, search])

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      tutti: searchFiltered.length,
      da_pagare: 0,
      pagato_bonifico: 0,
      pagato_in_loco: 0,
    }
    for (const r of searchFiltered) counts[r.payment_status] += 1
    return counts
  }, [searchFiltered])

  const filtered = useMemo(() => {
    if (statusFilter === "tutti") return searchFiltered
    return searchFiltered.filter((r) => r.payment_status === statusFilter)
  }, [searchFiltered, statusFilter])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/admin/login", { replace: true })
  }

  const exportPdf = (list: Registration[], statusLabel: string) => {
    exportRegistrationsPdf({
      registrations: list,
      workshopLabels,
      battleLabels,
      eventTitle: eventInfoQuery.data?.titolo,
      eventDate: eventInfoQuery.data?.data_evento,
      statusLabel,
      searchTerm: search,
    })
  }

  const handleExportVisible = () => {
    const statusLabel = FILTERS.find((f) => f.value === statusFilter)?.label ?? "Tutti"
    exportPdf(filtered, statusLabel)
  }

  const handleExportByStatus = (status: PaymentStatus) => {
    const list = searchFiltered.filter((r) => r.payment_status === status)
    setStatusFilter(status)
    const statusLabel = PAYMENT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
    exportPdf(list, statusLabel)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Iscritti</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportVisible}>
            <FileDown />
            Esporta PDF
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/evento")}>
            <CalendarDays />
            Evento
          </Button>
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

      {registrationsQuery.isError && (
        <p className="text-destructive text-sm">
          Errore nel caricamento degli iscritti:{" "}
          {(registrationsQuery.error as Error).message}
        </p>
      )}
      {updateNote.isError && (
        <p className="text-destructive text-sm">
          Salvataggio non riuscito. Riprova.
        </p>
      )}

      <SummaryCards registrations={registrations} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per nome, cognome, aka o email..."
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === filter.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {filter.label} ({statusCounts[filter.value]})
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs">Esporta PDF:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportByStatus("pagato_bonifico")}
        >
          Solo pagati bonifico
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExportByStatus("da_pagare")}>
          Solo da pagare
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportByStatus("pagato_in_loco")}
        >
          Solo pagati in loco
        </Button>
      </div>

      {registrationsQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento iscritti...</p>
      ) : (
        <RegistrationsTable
          data={filtered}
          workshopLabels={workshopLabels}
          battleLabels={battleLabels}
          onStatusChange={(id, status) =>
            updateStatus.mutate(
              { id, paymentStatus: status },
              {
                onSuccess: (result) => {
                  if (result.emailStatus === "sent") {
                    toast.success("Ricevuta di pagamento inviata via email.")
                  } else if (result.emailStatus === "failed") {
                    toast.error(
                      "Stato aggiornato, ma l'invio della ricevuta non è riuscito.",
                      { description: result.emailError }
                    )
                  }
                },
                onError: (error) => {
                  toast.error("Aggiornamento stato non riuscito.", {
                    description: (error as Error).message,
                  })
                },
              }
            )
          }
          onNoteChange={(id, note) => updateNote.mutate({ id, noteAdmin: note })}
        />
      )}
    </div>
  )
}
