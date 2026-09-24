import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { formatCurrency, isMinorenne } from "@/lib/format"
import { PAYMENT_METHOD_LABELS } from "@/lib/paymentStatus"
import { NO_BATTLE_KEY, NO_WORKSHOP_KEY } from "@/lib/pricing"
import type { RegistrationFieldValues } from "@/lib/registrationFields"
import type { EventOptionStato } from "@/types/eventOption"
import type { PaymentMethod } from "@/types/registration"

interface RegistrationFieldsProps {
  values: RegistrationFieldValues
  onChange: (values: RegistrationFieldValues) => void
  workshopOptions: EventOptionStato[]
  battleOptions: EventOptionStato[]
}

export function RegistrationFields({
  values,
  onChange,
  workshopOptions,
  battleOptions,
}: RegistrationFieldsProps) {
  const set = <K extends keyof RegistrationFieldValues>(
    key: K,
    value: RegistrationFieldValues[K]
  ) => onChange({ ...values, [key]: value })

  const realWorkshopOptions = workshopOptions.filter((o) => o.chiave !== NO_WORKSHOP_KEY)
  const realBattleOptions = battleOptions.filter((o) => o.chiave !== NO_BATTLE_KEY)

  const toggleBattle = (chiave: string, checked: boolean) =>
    set(
      "battleCategories",
      checked
        ? [...values.battleCategories, chiave]
        : values.battleCategories.filter((c) => c !== chiave)
    )

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="modal-nome">Nome</Label>
          <Input
            id="modal-nome"
            value={values.nome}
            onChange={(e) => set("nome", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="modal-cognome">Cognome</Label>
          <Input
            id="modal-cognome"
            value={values.cognome}
            onChange={(e) => set("cognome", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="modal-aka">Aka</Label>
          <Input id="modal-aka" value={values.aka} onChange={(e) => set("aka", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="modal-aka-partner">Crew / partner 2vs2</Label>
          <Input
            id="modal-aka-partner"
            value={values.akaPartner}
            onChange={(e) => set("akaPartner", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="modal-data-nascita">Data di nascita</Label>
          <div className="flex items-center gap-2">
            <Input
              id="modal-data-nascita"
              type="date"
              className="w-auto"
              value={values.dataNascita}
              onChange={(e) => set("dataNascita", e.target.value)}
            />
            {values.dataNascita && isMinorenne(values.dataNascita) && (
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
              >
                Minorenne
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="modal-telefono">Telefono</Label>
          <Input
            id="modal-telefono"
            type="tel"
            value={values.telefono}
            onChange={(e) => set("telefono", e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="modal-email">Email</Label>
          <Input
            id="modal-email"
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="modal-workshop">Workshop</Label>
          <Select
            id="modal-workshop"
            value={values.workshop}
            onChange={(e) => set("workshop", e.target.value)}
          >
            <option value="">Nessun workshop</option>
            {realWorkshopOptions.map((o) => (
              <option key={o.chiave} value={o.chiave}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="modal-payment-method">Metodo di pagamento</Label>
          <Select
            id="modal-payment-method"
            value={values.paymentMethod}
            onChange={(e) => set("paymentMethod", e.target.value as PaymentMethod)}
          >
            <option value="bonifico">{PAYMENT_METHOD_LABELS.bonifico}</option>
            <option value="sul_posto">{PAYMENT_METHOD_LABELS.sul_posto}</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Battle</Label>
        {realBattleOptions.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nessuna categoria a catalogo.</p>
        ) : (
          <div className="grid gap-1.5 rounded-md border p-2.5 sm:grid-cols-2">
            {realBattleOptions.map((o) => (
              <label key={o.chiave} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={values.battleCategories.includes(o.chiave)}
                  onChange={(e) => toggleBattle(o.chiave, e.target.checked)}
                />
                {o.label}
              </label>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

interface RegistrationAmountsProps {
  amountWorkshop: number
  amountBattle: number
  surcharges: number
  amountTotal: number
  hasPrezzoAdmin: boolean
}

// Riepilogo importi di listino; con un prezzo amministratore il totale
// viene barrato perché non è più la cifra dovuta.
export function RegistrationAmounts({
  amountWorkshop,
  amountBattle,
  surcharges,
  amountTotal,
  hasPrezzoAdmin,
}: RegistrationAmountsProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
      <div>
        <span className="text-muted-foreground">Workshop</span>
        <p className="tabular-nums">{formatCurrency(amountWorkshop)}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Battle</span>
        <p className="tabular-nums">{formatCurrency(amountBattle)}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Sovrapprezzi</span>
        <p className="tabular-nums">{formatCurrency(surcharges)}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Totale</span>
        <p
          className={
            hasPrezzoAdmin
              ? "text-muted-foreground tabular-nums line-through"
              : "font-semibold tabular-nums"
          }
        >
          {formatCurrency(amountTotal)}
        </p>
      </div>
    </div>
  )
}
