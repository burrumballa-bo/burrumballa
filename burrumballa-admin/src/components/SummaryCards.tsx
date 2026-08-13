import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import type { Registration } from "@/types/registration"

interface SummaryCardsProps {
  registrations: Registration[]
}

export function SummaryCards({ registrations }: SummaryCardsProps) {
  const totale = registrations.length
  const confermati = registrations.filter((r) => r.payment_status !== "da_pagare").length
  const daConfermare = totale - confermati
  const incassato = registrations
    .filter((r) => r.payment_status !== "da_pagare")
    .reduce((sum, r) => sum + r.amount_total, 0)
  const daIncassare = registrations
    .filter((r) => r.payment_status === "da_pagare")
    .reduce((sum, r) => sum + r.amount_total, 0)
  const paganoSulPosto = registrations.filter((r) => r.payment_method === "sul_posto").length
  const paganoBonifico = registrations.filter((r) => r.payment_method === "bonifico").length

  const tiles: { label: string; value: string; className?: string }[] = [
    { label: "Totale iscritti", value: String(totale) },
    { label: "Confermati", value: String(confermati), className: "text-emerald-600 dark:text-emerald-400" },
    { label: "Da confermare", value: String(daConfermare), className: "text-amber-600 dark:text-amber-400" },
    { label: "Incassato", value: formatCurrency(incassato), className: "text-emerald-600 dark:text-emerald-400" },
    { label: "Da incassare", value: formatCurrency(daIncassare), className: "text-amber-600 dark:text-amber-400" },
    { label: "Paganti sul posto", value: String(paganoSulPosto) },
    { label: "Paganti con bonifico", value: String(paganoBonifico) },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label} className="py-4">
          <CardContent className="space-y-1">
            <CardDescription>{tile.label}</CardDescription>
            <CardTitle className={`text-2xl ${tile.className ?? ""}`}>{tile.value}</CardTitle>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
