import { useEffect, useState } from "react"
import { Loader2, Trash2 } from "lucide-react"

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
import { formatCurrency, formatDateTime, isMinorenne } from "@/lib/format"
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_BADGE_CLASSES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_OPTIONS,
} from "@/lib/paymentStatus"
import type { UpdateRegistrationInput } from "@/hooks/useRegistrationMutations"
import type { EventOptionStato } from "@/types/eventOption"
import type { PaymentStatus, Registration } from "@/types/registration"

// Chiavi "placeholder" a catalogo (vedi supabase/migrations): non sono
// categorie reali, quindi non vanno proposte come opzioni spuntabili.
const NO_WORKSHOP_KEY = "no_workshop"
const NO_BATTLE_KEY = "no_battle"

interface RegistrationDetailModalProps {
  registration: Registration
  workshopOptions: EventOptionStato[]
  battleOptions: EventOptionStato[]
  onClose: () => void
  onSave: (input: UpdateRegistrationInput) => void
  onStatusChange: (status: PaymentStatus) => void
  onNoteChange: (note: string) => void
  onDelete: () => void
  isSaving: boolean
  isStatusSaving: boolean
  isDeleting: boolean
}

export function RegistrationDetailModal({
  registration,
  workshopOptions,
  battleOptions,
  onClose,
  onSave,
  onStatusChange,
  onNoteChange,
  onDelete,
  isSaving,
  isStatusSaving,
  isDeleting,
}: RegistrationDetailModalProps) {
  const [nome, setNome] = useState(registration.nome)
  const [cognome, setCognome] = useState(registration.cognome)
  const [aka, setAka] = useState(registration.aka ?? "")
  const [akaPartner, setAkaPartner] = useState(registration.aka_partner_2vs2 ?? "")
  const [email, setEmail] = useState(registration.email)
  const [dataNascita, setDataNascita] = useState(registration.data_nascita ?? "")
  const [workshop, setWorkshop] = useState(registration.workshop ?? "")
  const [battleCategories, setBattleCategories] = useState<string[]>(
    registration.battle_categories
  )
  const [paymentMethod, setPaymentMethod] = useState(registration.payment_method)
  const [note, setNote] = useState(registration.note_admin ?? "")
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Risincronizza solo quando cambia la persona selezionata, non a ogni
  // refetch: altrimenti un salvataggio in corso (es. cambio stato
  // pagamento, che invalida la query) cancellerebbe modifiche non ancora
  // salvate negli altri campi del form.
  useEffect(() => {
    setNome(registration.nome)
    setCognome(registration.cognome)
    setAka(registration.aka ?? "")
    setAkaPartner(registration.aka_partner_2vs2 ?? "")
    setEmail(registration.email)
    setDataNascita(registration.data_nascita ?? "")
    setWorkshop(registration.workshop ?? "")
    setBattleCategories(registration.battle_categories)
    setPaymentMethod(registration.payment_method)
    setNote(registration.note_admin ?? "")
    setConfirmingDelete(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registration.id])

  const realWorkshopOptions = workshopOptions.filter((o) => o.chiave !== NO_WORKSHOP_KEY)
  const realBattleOptions = battleOptions.filter((o) => o.chiave !== NO_BATTLE_KEY)

  const toggleBattle = (chiave: string, checked: boolean) => {
    setBattleCategories((prev) =>
      checked ? [...prev, chiave] : prev.filter((c) => c !== chiave)
    )
  }

  const handleSave = () => {
    onSave({
      id: registration.id,
      nome: nome.trim(),
      cognome: cognome.trim(),
      aka: aka.trim() || null,
      aka_partner_2vs2: akaPartner.trim() || null,
      email: email.trim(),
      data_nascita: dataNascita || null,
      workshop: workshop || null,
      battle_categories: battleCategories,
      payment_method: paymentMethod,
    })
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
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="modal-nome">Nome</Label>
            <Input id="modal-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modal-cognome">Cognome</Label>
            <Input
              id="modal-cognome"
              value={cognome}
              onChange={(e) => setCognome(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modal-aka">Aka</Label>
            <Input id="modal-aka" value={aka} onChange={(e) => setAka(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modal-aka-partner">Crew / partner 2vs2</Label>
            <Input
              id="modal-aka-partner"
              value={akaPartner}
              onChange={(e) => setAkaPartner(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modal-data-nascita">Data di nascita</Label>
            <div className="flex items-center gap-2">
              <Input
                id="modal-data-nascita"
                type="date"
                className="w-auto"
                value={dataNascita}
                onChange={(e) => setDataNascita(e.target.value)}
              />
              {dataNascita && isMinorenne(dataNascita) && (
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
            <Label htmlFor="modal-email">Email</Label>
            <Input
              id="modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="modal-workshop">Workshop</Label>
            <Select
              id="modal-workshop"
              value={workshop}
              onChange={(e) => setWorkshop(e.target.value)}
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
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
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
                    checked={battleCategories.includes(o.chiave)}
                    onChange={(e) => toggleBattle(o.chiave, e.target.checked)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          )}
        </div>

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

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <span className="text-muted-foreground">Workshop</span>
              <p className="tabular-nums">{formatCurrency(registration.amount_workshop)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Battle</span>
              <p className="tabular-nums">{formatCurrency(registration.amount_battle)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Sovrapprezzi</span>
              <p className="tabular-nums">
                {formatCurrency(registration.surcharge_late + registration.surcharge_onsite)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Totale</span>
              <p className="font-semibold tabular-nums">
                {formatCurrency(registration.amount_total)}
              </p>
            </div>
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
