import { useEffect, useState } from "react"
import { Loader2, Mail, Trash2 } from "lucide-react"

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
import { fieldValuesToRegistration, registrationToFieldValues } from "@/lib/registrationFields"
import { formatDateTime } from "@/lib/format"
import {
  PAYMENT_STATUS_BADGE_CLASSES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_OPTIONS,
} from "@/lib/paymentStatus"
import { parsePrezzoAdmin } from "@/lib/pricing"
import type { UpdateRegistrationInput } from "@/hooks/useRegistrationMutations"
import type { EventOptionStato } from "@/types/eventOption"
import type { PaymentStatus, Registration } from "@/types/registration"

interface RegistrationDetailModalProps {
  registration: Registration
  workshopOptions: EventOptionStato[]
  battleOptions: EventOptionStato[]
  onClose: () => void
  onSave: (input: UpdateRegistrationInput) => void
  onStatusChange: (status: PaymentStatus) => void
  onNoteChange: (note: string) => void
  onPrezzoAdminChange: (prezzoAdmin: number | null) => void
  onResendReceipt: () => void
  onDelete: () => void
  isSaving: boolean
  isStatusSaving: boolean
  isPrezzoAdminSaving: boolean
  isResending: boolean
  isDeleting: boolean
}

function prezzoToInput(value: number | null): string {
  return value === null ? "" : String(value)
}

export function RegistrationDetailModal({
  registration,
  workshopOptions,
  battleOptions,
  onClose,
  onSave,
  onStatusChange,
  onNoteChange,
  onPrezzoAdminChange,
  onResendReceipt,
  onDelete,
  isSaving,
  isStatusSaving,
  isPrezzoAdminSaving,
  isResending,
  isDeleting,
}: RegistrationDetailModalProps) {
  const [fields, setFields] = useState(() => registrationToFieldValues(registration))
  const [note, setNote] = useState(registration.note_admin ?? "")
  const [prezzoAdmin, setPrezzoAdmin] = useState(prezzoToInput(registration.prezzo_admin))
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Risincronizza solo quando cambia la persona selezionata, non a ogni
  // refetch: altrimenti un salvataggio in corso (es. cambio stato
  // pagamento, che invalida la query) cancellerebbe modifiche non ancora
  // salvate negli altri campi del form.
  useEffect(() => {
    setFields(registrationToFieldValues(registration))
    setNote(registration.note_admin ?? "")
    setPrezzoAdmin(prezzoToInput(registration.prezzo_admin))
    setConfirmingDelete(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registration.id])

  const { value: prezzoAdminValue, valid: prezzoAdminValido } = parsePrezzoAdmin(prezzoAdmin)
  const prezzoAdminModificato = prezzoAdminValue !== registration.prezzo_admin
  const isPagato = registration.payment_status !== "da_pagare"

  const handleSave = () => {
    onSave({ id: registration.id, ...fieldValuesToRegistration(fields) })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogHeader>
        <div>
          <DialogTitle>
            {registration.nome} {registration.cognome}
          </DialogTitle>
          <p className="text-muted-foreground text-xs">
            Iscritto il {formatDateTime(registration.created_at)}
          </p>
        </div>
        <DialogCloseButton onClick={onClose} />
      </DialogHeader>

      <div className="space-y-5">
        <RegistrationFields
          values={fields}
          onChange={setFields}
          workshopOptions={workshopOptions}
          battleOptions={battleOptions}
        />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="animate-spin" />}
            Salva modifiche
          </Button>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="modal-status">Stato pagamento</Label>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={PAYMENT_STATUS_BADGE_CLASSES[registration.payment_status]}
                >
                  {PAYMENT_STATUS_LABELS[registration.payment_status]}
                </Badge>
                <Select
                  id="modal-status"
                  className="h-8 text-xs"
                  value={registration.payment_status}
                  disabled={isStatusSaving}
                  onChange={(e) => onStatusChange(e.target.value as PaymentStatus)}
                >
                  {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <RegistrationAmounts
            amountWorkshop={registration.amount_workshop}
            amountBattle={registration.amount_battle}
            surcharges={registration.surcharge_late + registration.surcharge_onsite}
            amountTotal={registration.amount_total}
            hasPrezzoAdmin={registration.prezzo_admin !== null}
          />

          <div className="space-y-1.5">
            <Label htmlFor="modal-prezzo-admin">Prezzo amministratore</Label>
            <div className="flex items-center gap-2">
              <Input
                id="modal-prezzo-admin"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                className="w-32"
                placeholder="—"
                value={prezzoAdmin}
                onChange={(e) => setPrezzoAdmin(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!prezzoAdminValido || !prezzoAdminModificato || isPrezzoAdminSaving}
                onClick={() => onPrezzoAdminChange(prezzoAdminValue)}
              >
                {isPrezzoAdminSaving && <Loader2 className="animate-spin" />}
                Salva prezzo
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Opzionale. Se impostato è la cifra incassata al posto del totale (statistiche e
              ricevuta). Lascia vuoto per usare il totale.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="modal-note">Note interne</Label>
          <Textarea
            id="modal-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (note !== (registration.note_admin ?? "")) {
                onNoteChange(note)
              }
            }}
          />
        </div>

        <div className="border-t pt-4">
          {!confirmingDelete && (
            <div className="mb-3 flex flex-col items-end gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onResendReceipt}
                disabled={!isPagato || isResending}
              >
                {isResending ? <Loader2 className="animate-spin" /> : <Mail />}
                Rimanda ricevuta
              </Button>
              {!isPagato && (
                <p className="text-muted-foreground text-xs">
                  Disponibile solo per iscrizioni già pagate.
                </p>
              )}
            </div>
          )}
          {confirmingDelete ? (
            <div className="border-destructive/40 bg-destructive/5 space-y-3 rounded-md border p-3">
              <p className="text-sm">
                Eliminare questo iscritto? Non comparirà più in liste, statistiche e nel
                conteggio posti.
                {registration.payment_status !== "da_pagare" && (
                  <>
                    {" "}
                    Risulta già pagato: assicurati di aver effettuato il rimborso prima di
                    confermare.
                  </>
                )}
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Annulla
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 className="animate-spin" />}
                  Conferma eliminazione
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 />
              Elimina iscritto
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  )
}
