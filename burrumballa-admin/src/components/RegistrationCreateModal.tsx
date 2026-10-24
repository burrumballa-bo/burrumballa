import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogCloseButton,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RegistrationAmounts, RegistrationFields } from "@/components/RegistrationFields"
import { EMPTY_REGISTRATION_FIELDS, fieldValuesToRegistration } from "@/lib/registrationFields"
import { useEventId } from "@/hooks/useEventId"
import { useEventInfo } from "@/hooks/useEventInfo"
import { useEventOptionsStato } from "@/hooks/useEventOptionsStato"
import { notifyReceiptResult } from "@/hooks/usePaymentStatusChange"
import { useCreateRegistration } from "@/hooks/useRegistrationMutations"
import {
  PAID_STATUSES_BY_METHOD,
  PAYMENT_STATUS_BADGE_CLASSES,
  PAYMENT_STATUS_LABELS,
} from "@/lib/paymentStatus"
import { calcolaImporti, parsePrezzoAdmin, type EventPricing } from "@/lib/pricing"
import type { PaymentStatus } from "@/types/registration"

// Solo finche' l'evento non e' caricato: gli importi veri usano i suoi prezzi.
const DEFAULT_PRICING: EventPricing = {
  battle_prezzi: [],
  maggiorazione_ritardo: 0,
  maggiorazione_sul_posto: 0,
}

interface RegistrationCreateModalProps {
  onClose: () => void
}

export function RegistrationCreateModal({ onClose }: RegistrationCreateModalProps) {
  const eventId = useEventId()
  const optionsQuery = useEventOptionsStato(eventId)
  const eventInfoQuery = useEventInfo(eventId)
  const createRegistration = useCreateRegistration()

  const [fields, setFields] = useState(EMPTY_REGISTRATION_FIELDS)
  const [statoScelto, setStatoScelto] = useState<PaymentStatus>("da_pagare")
  const [note, setNote] = useState("")
  const [prezzoAdmin, setPrezzoAdmin] = useState("")

  const options = useMemo(
    () => (optionsQuery.data ?? []).filter((o) => o.attivo && !o.deleted_at),
    [optionsQuery.data]
  )
  const workshopOptions = useMemo(() => options.filter((o) => o.tipo === "workshop"), [options])
  const battleOptions = useMemo(() => options.filter((o) => o.tipo === "battle"), [options])

  const scadenza = eventInfoQuery.data?.scadenza_iscrizioni
  const importi = calcolaImporti({
    workshop: fields.workshop,
    battleCategories: fields.battleCategories,
    paymentMethod: fields.paymentMethod,
    workshopOptions,
    deadline: scadenza ? new Date(scadenza) : null,
    pricing: eventInfoQuery.data ?? DEFAULT_PRICING,
  })

  // Gli stati "pagato" seguono il metodo scelto: bonifico -> pagato
  // bonifico, sul posto -> contanti o POS. Cambiando metodo uno stato non
  // piu' compatibile torna "da pagare".
  const statiPagato = PAID_STATUSES_BY_METHOD[fields.paymentMethod]
  const paymentStatus: PaymentStatus = statiPagato.includes(statoScelto) ? statoScelto : "da_pagare"
  const pagato = paymentStatus !== "da_pagare"

  const { value: prezzoAdminValue, valid: prezzoAdminValido } = parsePrezzoAdmin(prezzoAdmin)
  const values = fieldValuesToRegistration(fields)
  const isValid =
    values.nome !== "" && values.cognome !== "" && values.email !== "" && prezzoAdminValido

  const handleCreate = () => {
    createRegistration.mutate(
      {
        event_id: eventId,
        ...values,
        ...importi,
        payment_status: paymentStatus,
        prezzo_admin: prezzoAdminValue,
        note_admin: note.trim() || null,
      },
      {
        onSuccess: (result) => {
          notifyReceiptResult(result, "Iscritto creato.")
          onClose()
        },
        onError: (error) =>
          toast.error("Creazione non riuscita.", {
            description: (error as Error).message,
          }),
      }
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogHeader>
        <DialogTitle>Nuovo iscritto</DialogTitle>
        <DialogCloseButton onClick={onClose} />
      </DialogHeader>

      <div className="space-y-5">
        <RegistrationFields
          values={fields}
          onChange={setFields}
          workshopOptions={workshopOptions}
          battleOptions={battleOptions}
        />

        <div className="space-y-3 border-t pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="create-status">Stato pagamento</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={PAYMENT_STATUS_BADGE_CLASSES[paymentStatus]}>
                {PAYMENT_STATUS_LABELS[paymentStatus]}
              </Badge>
              <Select
                id="create-status"
                className="h-8 w-auto text-xs"
                value={paymentStatus}
                onChange={(e) => setStatoScelto(e.target.value as PaymentStatus)}
              >
                <option value="da_pagare">{PAYMENT_STATUS_LABELS.da_pagare}</option>
                {statiPagato.map((stato) => (
                  <option key={stato} value={stato}>
                    {PAYMENT_STATUS_LABELS[stato]}
                  </option>
                ))}
              </Select>
            </div>
            {pagato && (
              <p className="text-muted-foreground text-xs">
                Alla creazione verrà inviata la ricevuta di pagamento via email.
              </p>
            )}
          </div>

          <RegistrationAmounts
            amountWorkshop={importi.amount_workshop}
            amountBattle={importi.amount_battle}
            surcharges={importi.surcharge_late + importi.surcharge_onsite}
            amountTotal={importi.amount_total}
            hasPrezzoAdmin={prezzoAdminValue !== null}
          />

          <div className="space-y-1.5">
            <Label htmlFor="create-prezzo-admin">Prezzo amministratore</Label>
            <Input
              id="create-prezzo-admin"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              className="w-32"
              placeholder="—"
              value={prezzoAdmin}
              onChange={(e) => setPrezzoAdmin(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Opzionale. Se impostato è la cifra incassata al posto del totale (statistiche e
              ricevuta). Lascia vuoto per usare il totale.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="create-note">Note interne</Label>
          <Textarea
            id="create-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!isValid || !eventInfoQuery.data || createRegistration.isPending}
          >
            {createRegistration.isPending && <Loader2 className="animate-spin" />}
            Crea iscritto
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
