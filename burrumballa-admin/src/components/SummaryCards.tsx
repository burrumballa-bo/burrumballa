import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import type { Registration } from "@/types/registration"

interface SummaryCardsProps {
  registrations: Registration[]
}

export function SummaryCards({ registrations }: SummaryCardsProps) {
  const totale = registrations.length
  const incassato = registrations
    .filter((r) => r.payment_status !== "da_pagare")
    .reduce((sum, r) => sum + r.amount_total, 0)
  const daIncassare = registrations
    .filter((r) => r.payment_status === "da_pagare")
    .reduce((sum, r) => sum + r.amount_total, 0)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="py-4">
        <CardContent className="space-y-1">
          <CardDescription>Totale iscritti</CardDescription>
          <CardTitle className="text-2xl">{totale}</CardTitle>
        </CardContent>
      </Card>
      <Card className="py-4">
        <CardContent className="space-y-1">
          <CardDescription>Incassato</CardDescription>
          <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">
            {formatCurrency(incassato)}
          </CardTitle>
        </CardContent>
      </Card>
      <Card className="py-4">
        <CardContent className="space-y-1">
          <CardDescription>Da incassare</CardDescription>
          <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">
            {formatCurrency(daIncassare)}
          </CardTitle>
        </CardContent>
      </Card>
    </div>
  )
}
