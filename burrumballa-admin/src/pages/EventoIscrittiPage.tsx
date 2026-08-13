import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Search } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { PAYMENT_STATUS_OPTIONS } from "@/lib/paymentStatus"
import { useRegistrations } from "@/hooks/useRegistrations"
import { useEventOptionsStato } from "@/hooks/useEventOptionsStato"
import {
  useDeleteRegistration,
  useUpdateNoteAdmin,
  useUpdatePaymentStatus,
  useUpdateRegistration,
} from "@/hooks/useRegistrationMutations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RegistrationsTable } from "@/components/RegistrationsTable"
import { RegistrationDetailModal } from "@/components/RegistrationDetailModal"
import type { PaymentStatus } from "@/types/registration"

type StatusFilter = "tutti" | PaymentStatus

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "tutti", label: "Tutti" },
  ...PAYMENT_STATUS_OPTIONS,
]

export default function EventoIscrittiPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("tutti")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const registrationsQuery = useRegistrations()
  const optionsQuery = useEventOptionsStato()
  const updateStatus = useUpdatePaymentStatus()
  const updateNote = useUpdateNoteAdmin()
  const updateRegistration = useUpdateRegistration()
  const deleteRegistration = useDeleteRegistration()

  const registrations = useMemo(
    () => registrationsQuery.data ?? [],
    [registrationsQuery.data]
  )

  const options = optionsQuery.data ?? []
  const workshopOptions = useMemo(() => options.filter((o) => o.tipo === "workshop"), [options])
  const battleOptions = useMemo(() => options.filter((o) => o.tipo === "battle"), [options])

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

  const selected = selectedId
    ? (registrations.find((r) => r.id === selectedId) ?? null)
    : null

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin/evento")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">Iscritti</h1>
      </div>

      {registrationsQuery.isError && (
        <p className="text-destructive text-sm">
          Errore nel caricamento degli iscritti:{" "}
          {(registrationsQuery.error as Error).message}
        </p>
      )}

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

      {registrationsQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento iscritti...</p>
      ) : (
        <RegistrationsTable
          data={filtered}
          onRowClick={(registration) => setSelectedId(registration.id)}
        />
      )}

      {selected && (
        <RegistrationDetailModal
          registration={selected}
          workshopOptions={workshopOptions}
          battleOptions={battleOptions}
          onClose={() => setSelectedId(null)}
          isSaving={updateRegistration.isPending}
          isStatusSaving={updateStatus.isPending}
          isDeleting={deleteRegistration.isPending}
          onSave={(input) =>
            updateRegistration.mutate(input, {
              onSuccess: () => {
                toast.success("Iscritto aggiornato.")
                setSelectedId(null)
              },
              onError: (error) =>
                toast.error("Salvataggio non riuscito.", {
                  description: (error as Error).message,
                }),
            })
          }
          onStatusChange={(status) =>
            updateStatus.mutate(
              { id: selected.id, paymentStatus: status },
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
                onError: (error) =>
                  toast.error("Aggiornamento stato non riuscito.", {
                    description: (error as Error).message,
                  }),
              }
            )
          }
          onNoteChange={(note) => updateNote.mutate({ id: selected.id, noteAdmin: note })}
          onDelete={() =>
            deleteRegistration.mutate(selected.id, {
              onSuccess: () => {
                toast.success("Iscritto eliminato.")
                setSelectedId(null)
              },
              onError: (error) =>
                toast.error("Eliminazione non riuscita.", {
                  description: (error as Error).message,
                }),
            })
          }
        />
      )}
    </div>
  )
}
