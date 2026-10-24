import { Check, Loader2, Minus, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { PaymentMethodSelect } from "@/components/PaymentMethodSelect"
import { formatDateOnly } from "@/lib/datetime"
import { formatCurrency } from "@/lib/format"
import { INCASSO_METHOD_LABELS, type IncassoMethod } from "@/lib/paymentMethods"
import { isSubscriptionValid, type SubscriptionDraft } from "@/lib/subscriptionDrafts"
import {
  MAX_SUBSCRIPTION_ENTRIES,
  SUBSCRIPTION_BOX_CLASSES,
  SUBSCRIPTION_KIND_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  subscriptionStatus,
  subscriptionValueLabel,
  suggestedEndDate,
  todayIso,
} from "@/lib/subscriptions"
import { cn } from "@/lib/utils"
import type { SubscriptionKind } from "@/types/school"

interface StudentSubscriptionCardProps {
  sub: SubscriptionDraft
  /** Ingressi gia' fatti secondo il database (0 per i nuovi). */
  entriesUsed: number
  /** Date degli ingressi registrati. */
  entryDates: string[]
  onChange: (patch: Partial<SubscriptionDraft>) => void
  onEdit: () => void
  onDone: () => void
  onCancel: () => void
  onRemove: () => void
  onRenew: () => void
  /** +1 / -1 ingresso, solo per abbonamenti gia' salvati. */
  onEntries?: (delta: 1 | -1) => void
  entriesPending?: boolean
}

export function StudentSubscriptionCard({
  sub,
  entriesUsed,
  entryDates,
  onChange,
  onEdit,
  onDone,
  onCancel,
  onRemove,
  onRenew,
  onEntries,
  entriesPending,
}: StudentSubscriptionCardProps) {
  const today = todayIso()
  const editing = sub.mode !== "view"
  const valid = isSubscriptionValid(sub, entriesUsed)
  const complete = sub.start_date && sub.end_date
  const status = complete && !editing ? subscriptionStatus(sub, today) : null
  const invalidRange = complete && sub.end_date < sub.start_date
  const totalEntries = Number(sub.entries)

  // Cambio tipo / data inizio: per mensile e trimestrale la fine e' proposta in automatico.
  const changeKind = (kind: SubscriptionKind) =>
    onChange({ kind, end_date: kind === "entries" ? "" : suggestedEndDate(kind, sub.start_date) })
  const changeStart = (start_date: string) =>
    onChange({
      start_date,
      ...(sub.kind !== "entries" && { end_date: suggestedEndDate(sub.kind, start_date) }),
    })
  // Scegliendo un metodo la data di pagamento parte da oggi; "da pagare" la azzera.
  const changePayment = (payment_method: IncassoMethod | "") =>
    onChange({ payment_method, paid_at: payment_method === "" ? "" : sub.paid_at || today })

  return (
    <div
      className={cn(
        "space-y-3 rounded-md border p-3",
        sub.mode === "new" && "border-primary bg-primary/5 border-2 border-dashed",
        sub.mode === "edit" && "border-primary bg-primary/5 border-2",
        status && SUBSCRIPTION_BOX_CLASSES[status]
      )}
    >
      {editing ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold tracking-wide uppercase">
              {sub.mode === "new" ? "Nuovo abbonamento" : "Modifica abbonamento"}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="shrink-0"
              aria-label="Annulla modifica abbonamento"
              onClick={onCancel}
            >
              <X />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                aria-label="Tipo abbonamento"
                className="bg-background/70"
                value={sub.kind}
                disabled={!!sub.id}
                onChange={(e) => changeKind(e.target.value as SubscriptionKind)}
              >
                {(Object.keys(SUBSCRIPTION_KIND_LABELS) as SubscriptionKind[]).map((k) => (
                  <option key={k} value={k}>
                    {SUBSCRIPTION_KIND_LABELS[k]}
                  </option>
                ))}
              </Select>
            </div>
            {sub.kind === "entries" && (
              <div className="space-y-1.5">
                <Label>Ingressi (max {MAX_SUBSCRIPTION_ENTRIES})</Label>
                <Input
                  type="number"
                  min={Math.max(1, entriesUsed)}
                  max={MAX_SUBSCRIPTION_ENTRIES}
                  step={1}
                  aria-label="Numero ingressi"
                  className="bg-background/70"
                  value={sub.entries}
                  onChange={(e) => onChange({ entries: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Prezzo (€) *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                aria-label="Prezzo"
                className="bg-background/70"
                value={sub.price}
                onChange={(e) => onChange({ price: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pagamento</Label>
              <PaymentMethodSelect
                allowEmpty
                emptyLabel="Da pagare"
                aria-label="Metodo di pagamento abbonamento"
                className="bg-background/70"
                value={sub.payment_method}
                onChange={changePayment}
              />
            </div>
            {sub.payment_method !== "" && (
              <div className="space-y-1.5">
                <Label>Pagato il *</Label>
                <Input
                  type="date"
                  aria-label="Data pagamento"
                  className="bg-background/70"
                  value={sub.paid_at}
                  onChange={(e) => onChange({ paid_at: e.target.value })}
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Dal</span>
            <Input
              type="date"
              aria-label="Data inizio"
              className="bg-background/70 w-auto"
              value={sub.start_date}
              onChange={(e) => changeStart(e.target.value)}
            />
            <span>al</span>
            <Input
              type="date"
              aria-label="Data fine"
              className="bg-background/70 w-auto"
              value={sub.end_date}
              onChange={(e) => onChange({ end_date: e.target.value })}
            />
          </div>
          {invalidRange && (
            <p className="text-destructive text-xs">
              La data di fine deve essere successiva a quella di inizio.
            </p>
          )}
          {sub.kind === "entries" && entriesUsed > totalEntries && (
            <p className="text-destructive text-xs">
              Sono già stati fatti {entriesUsed} ingressi: non puoi scendere sotto.
            </p>
          )}
          <div className="flex justify-end">
            <Button type="button" size="sm" disabled={!valid} onClick={onDone}>
              <Check />
              Fatto
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                {SUBSCRIPTION_KIND_LABELS[sub.kind]}
                <span className="rounded-full border px-2 py-0.5 text-xs font-medium">
                  {subscriptionValueLabel({
                    kind: sub.kind,
                    entries: sub.kind === "entries" ? totalEntries : null,
                  })}
                </span>
                {status && (
                  <span className="text-xs font-normal opacity-80">
                    {SUBSCRIPTION_STATUS_LABELS[status]}
                  </span>
                )}
                {!sub.id && (
                  <span className="text-primary text-xs font-normal">Da salvare</span>
                )}
              </p>
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {formatCurrency(Number(sub.price))}
                {sub.payment_method ? (
                  <span className="bg-background/60 rounded-full border px-2 py-0.5 text-xs font-normal">
                    Pagato {INCASSO_METHOD_LABELS[sub.payment_method]} · {formatDateOnly(sub.paid_at)}
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    Da pagare
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0"
                aria-label="Rinnova abbonamento"
                title="Rinnova"
                onClick={onRenew}
              >
                <RefreshCw />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0"
                aria-label="Modifica abbonamento"
                title="Modifica"
                onClick={onEdit}
              >
                <Pencil />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-destructive shrink-0"
                aria-label="Rimuovi abbonamento"
                title="Elimina"
                onClick={onRemove}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <p className="text-xs opacity-80">
            {formatDateOnly(sub.start_date)} → {formatDateOnly(sub.end_date)}
          </p>
          {sub.kind === "entries" && (
            <div className="bg-background/60 space-y-2 rounded-md border px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">
                  <p className="font-medium">Rimasti: {totalEntries - entriesUsed}</p>
                  <p className="text-xs opacity-80">
                    Fatti {entriesUsed} su {totalEntries}
                  </p>
                </div>
                {onEntries ? (
                  <div className="flex items-center gap-2">
                    {entriesPending && <Loader2 className="size-4 animate-spin" />}
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8"
                      aria-label="Togli un ingresso"
                      disabled={entriesUsed <= 0 || entriesPending}
                      onClick={() => onEntries(-1)}
                    >
                      <Minus />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8"
                      aria-label="Segna un ingresso oggi"
                      disabled={entriesUsed >= totalEntries || entriesPending}
                      onClick={() => onEntries(1)}
                    >
                      <Plus />
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">Salva per segnare gli ingressi</p>
                )}
              </div>
              {entryDates.length > 0 && (
                <p className="text-xs opacity-80">
                  Ingressi: {entryDates.map((d) => formatDateOnly(d)).join(", ")}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
