import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Search, Swords, UserPlus } from "lucide-react"

import { cn } from "@/lib/utils"
import { accoppia2vs2 } from "@/lib/coppie2vs2"
import { PAYMENT_STATUS_OPTIONS } from "@/lib/paymentStatus"
import { useRegistrations } from "@/hooks/useRegistrations"
import { usePaymentStatusChange } from "@/hooks/usePaymentStatusChange"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RegistrationsTable } from "@/components/RegistrationsTable"
import { RegistrationDetailDialog } from "@/components/RegistrationDetailDialog"
import { RegistrationCreateModal } from "@/components/RegistrationCreateModal"
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
  const [creating, setCreating] = useState(false)

  const registrationsQuery = useRegistrations()
  const { changeStatus, mutation: updateStatus } = usePaymentStatusChange()

  const registrations = useMemo(
    () => registrationsQuery.data ?? [],
    [registrationsQuery.data]
  )

  const senzaCoppiaIds = useMemo(
    () => new Set(accoppia2vs2(registrations).singoli.map((r) => r.id)),
    [registrations]
  )

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
        <Button variant="outline" className="ml-auto" onClick={() => setCreating(true)}>
          <UserPlus />
          Nuovo iscritto
        </Button>
        <Button onClick={() => navigate("/admin/evento/si-balla")}>
          <Swords />
          Si balla
        </Button>
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
          senzaCoppiaIds={senzaCoppiaIds}
          confirmingId={updateStatus.isPending ? (updateStatus.variables?.id ?? null) : null}
          onConfirmPayment={(registration, status) =>
            changeStatus(registration.id, status, "Stato pagamento aggiornato.")
          }
        />
      )}

      {selected && (
        <RegistrationDetailDialog registration={selected} onClose={() => setSelectedId(null)} />
      )}

      {creating && <RegistrationCreateModal onClose={() => setCreating(false)} />}
    </div>
  )
}
