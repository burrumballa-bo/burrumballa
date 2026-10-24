import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { PaymentMethodSelect } from "@/components/PaymentMethodSelect"
import {
  CARD_STATUSES,
  CARD_STATUS_HINTS,
  CARD_STATUS_LABELS,
  isPrice,
  type MembershipDraft,
} from "@/lib/memberships"
import { seasonLabel } from "@/lib/seasons"
import { todayIso } from "@/lib/subscriptions"
import { cn } from "@/lib/utils"
import type { CardStatus } from "@/types/school"

interface SchoolMembershipSectionProps {
  draft: MembershipDraft
  seasons: number[]
  onSeasonChange: (season: number) => void
  onChange: (patch: Partial<MembershipDraft>) => void
  defaultCardPrice: number | null
  defaultFeePrice: number | null
}

export function SchoolMembershipSection({
  draft,
  seasons,
  onSeasonChange,
  onChange,
  defaultCardPrice,
  defaultFeePrice,
}: SchoolMembershipSectionProps) {
  const today = todayIso()

  // Passando a uno stato con importo si propone il prezzo delle Impostazioni.
  const changeCardStatus = (card_status: CardStatus) =>
    onChange({
      card_status,
      ...((card_status === "pagata" || card_status === "da_pagare") &&
        draft.card_price === "" &&
        defaultCardPrice != null && { card_price: String(defaultCardPrice) }),
      ...(card_status === "pagata" && !draft.card_paid_at && { card_paid_at: today }),
    })

  const toggleFee = (fee_paid: boolean) =>
    onChange({
      fee_paid,
      ...(fee_paid &&
        draft.fee_price === "" &&
        defaultFeePrice != null && { fee_price: String(defaultFeePrice) }),
      ...(fee_paid && !draft.fee_paid_at && { fee_paid_at: today }),
    })

  const missing = (cond: boolean) => cond && "border-destructive"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Tessera e quota di iscrizione</h3>
        <div className="w-36">
          <Select
            aria-label="Stagione"
            value={String(draft.season)}
            onChange={(e) => onSeasonChange(Number(e.target.value))}
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                Stagione {seasonLabel(s)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tessera</Label>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Stato tessera">
          {CARD_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              role="radio"
              aria-checked={draft.card_status === status}
              onClick={() => changeCardStatus(status)}
              className={cn(
                "rounded-md border px-3 py-2 text-left transition-colors",
                draft.card_status === status
                  ? "border-primary bg-primary/10 ring-primary ring-1"
                  : "hover:bg-accent"
              )}
            >
              <span className="block text-sm font-medium">{CARD_STATUS_LABELS[status]}</span>
              <span className="text-muted-foreground block text-xs">{CARD_STATUS_HINTS[status]}</span>
            </button>
          ))}
        </div>

        {draft.card_status !== "da_fare" && (
          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="card-number">Numero tessera</Label>
              <Input
                id="card-number"
                placeholder="Facoltativo"
                value={draft.card_number}
                onChange={(e) => onChange({ card_number: e.target.value })}
              />
            </div>
            {(draft.card_status === "pagata" || draft.card_status === "da_pagare") && (
              <div className="space-y-1.5">
                <Label htmlFor="card-price">
                  Importo (€){draft.card_status === "pagata" && " *"}
                </Label>
                <Input
                  id="card-price"
                  type="number"
                  min={0}
                  step="0.01"
                  className={cn(missing(draft.card_status === "pagata" && !isPrice(draft.card_price)))}
                  value={draft.card_price}
                  onChange={(e) => onChange({ card_price: e.target.value })}
                />
              </div>
            )}
            {draft.card_status === "pagata" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="card-method">Pagata con *</Label>
                  <PaymentMethodSelect
                    id="card-method"
                    emptyLabel="Scegli metodo"
                    className={cn(missing(draft.card_payment_method === ""))}
                    value={draft.card_payment_method}
                    onChange={(card_payment_method) => onChange({ card_payment_method })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="card-paid-at">Pagata il *</Label>
                  <Input
                    id="card-paid-at"
                    type="date"
                    value={draft.card_paid_at}
                    onChange={(e) => onChange({ card_paid_at: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-medium">Quota di iscrizione pagata</span>
            <span className="text-muted-foreground block text-xs">
              Stagione {seasonLabel(draft.season)}
            </span>
          </span>
          <Switch
            checked={draft.fee_paid}
            onCheckedChange={toggleFee}
            aria-label="Quota di iscrizione pagata"
          />
        </label>
        {draft.fee_paid && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="fee-price">Importo (€) *</Label>
              <Input
                id="fee-price"
                type="number"
                min={0}
                step="0.01"
                className={cn(missing(!isPrice(draft.fee_price)))}
                value={draft.fee_price}
                onChange={(e) => onChange({ fee_price: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fee-method">Pagata con *</Label>
              <PaymentMethodSelect
                id="fee-method"
                emptyLabel="Scegli metodo"
                className={cn(missing(draft.fee_payment_method === ""))}
                value={draft.fee_payment_method}
                onChange={(fee_payment_method) => onChange({ fee_payment_method })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fee-paid-at">Pagata il *</Label>
              <Input
                id="fee-paid-at"
                type="date"
                value={draft.fee_paid_at}
                onChange={(e) => onChange({ fee_paid_at: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
