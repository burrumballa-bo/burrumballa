import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, Save, Trash2 } from "lucide-react"

import {
  Dialog,
  DialogCloseButton,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { eventOptionSchema, type EventOptionFormValues } from "@/lib/eventOptionSchema"
import type {
  EventOptionInsertInput,
  EventOptionStato,
  EventOptionTipo,
  EventOptionUpdateInput,
} from "@/types/eventOption"

// Chiave "placeholder" a catalogo (vedi supabase/migrations): non è un
// workshop reale, quindi non va proposta come componente di un pacchetto.
const NO_WORKSHOP_KEY = "no_workshop"

interface EventOptionModalProps {
  mode: "create" | "edit"
  tipo: EventOptionTipo
  option?: EventOptionStato
  // Workshop semplici (non composti, non eliminati) tra cui scegliere i
  // componenti di un pacchetto: rilevante solo quando tipo === "workshop".
  siblingWorkshops: EventOptionStato[]
  onClose: () => void
  onCreate: (input: EventOptionInsertInput) => void
  onSave: (input: EventOptionUpdateInput) => void
  onDelete: (id: string) => void
  isSaving: boolean
  isDeleting: boolean
}

export function EventOptionModal({
  mode,
  tipo,
  option,
  siblingWorkshops,
  onClose,
  onCreate,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: EventOptionModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventOptionFormValues>({
    resolver: zodResolver(eventOptionSchema),
    defaultValues: {
      chiave: option?.chiave ?? "",
      label: option?.label ?? "",
      prezzo: option ? String(option.prezzo) : "0",
      ordine: option ? String(option.ordine) : "0",
      max_posti: option?.max_posti != null ? String(option.max_posti) : "",
      attivo: option?.attivo ?? true,
      sold_out_manuale: option?.sold_out_manuale ?? false,
      composto: option?.composto ?? false,
      child_ids: option
        ? siblingWorkshops
            .filter((w) => option.composto_di.includes(w.chiave))
            .map((w) => w.id)
        : [],
    },
  })

  const attivo = watch("attivo")
  const soldOutManuale = watch("sold_out_manuale")
  const composto = watch("composto")
  const childIds = watch("child_ids")

  const candidateChildren = siblingWorkshops.filter(
    (w) => !w.composto && w.chiave !== NO_WORKSHOP_KEY && w.id !== option?.id
  )

  const toggleChild = (id: string, checked: boolean) => {
    setValue(
      "child_ids",
      checked ? [...childIds, id] : childIds.filter((c) => c !== id),
      { shouldValidate: true }
    )
  }

  const onSubmit = (values: EventOptionFormValues) => {
    const shared = {
      label: values.label.trim(),
      prezzo: Number(values.prezzo),
      ordine: Number(values.ordine),
      max_posti: values.max_posti === "" ? null : Number(values.max_posti),
      attivo: values.attivo,
      sold_out_manuale: values.sold_out_manuale,
      composto: tipo === "workshop" ? values.composto : false,
      childIds: tipo === "workshop" && values.composto ? values.child_ids : [],
    }

    if (mode === "create") {
      onCreate({ tipo, chiave: values.chiave.trim(), ...shared })
    } else if (option) {
      onSave({ id: option.id, ...shared })
    }
  }

  const title = mode === "create"
    ? tipo === "workshop" ? "Nuova opzione workshop" : "Nuova opzione battle"
    : `Modifica opzione — ${option?.label}`

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogCloseButton onClick={onClose} />
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="option-chiave">Chiave</Label>
          <Input
            id="option-chiave"
            disabled={mode === "edit"}
            aria-invalid={!!errors.chiave}
            {...register("chiave")}
          />
          {errors.chiave ? (
            <p className="text-destructive text-xs">{errors.chiave.message}</p>
          ) : mode === "create" ? (
            <p className="text-muted-foreground text-xs">
              Identificativo tecnico stabile, non modificabile in seguito (es.
              waacking_rada).
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="option-label">Etichetta</Label>
          <Input id="option-label" aria-invalid={!!errors.label} {...register("label")} />
          {errors.label && (
            <p className="text-destructive text-xs">{errors.label.message}</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="option-prezzo">Prezzo</Label>
            <Input
              id="option-prezzo"
              type="number"
              step="0.01"
              min="0"
              aria-invalid={!!errors.prezzo}
              {...register("prezzo")}
            />
            {errors.prezzo && (
              <p className="text-destructive text-xs">{errors.prezzo.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="option-ordine">Ordine</Label>
            <Input
              id="option-ordine"
              type="number"
              step="1"
              aria-invalid={!!errors.ordine}
              {...register("ordine")}
            />
            {errors.ordine && (
              <p className="text-destructive text-xs">{errors.ordine.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="option-max-posti">Max posti</Label>
            <Input
              id="option-max-posti"
              type="number"
              step="1"
              min="1"
              placeholder="Illimitato"
              aria-invalid={!!errors.max_posti}
              {...register("max_posti")}
            />
            {errors.max_posti && (
              <p className="text-destructive text-xs">{errors.max_posti.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="option-attivo"
              checked={attivo}
              onCheckedChange={(value) => setValue("attivo", value)}
            />
            <Label htmlFor="option-attivo">Attivo</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="option-sold-out"
              checked={soldOutManuale}
              onCheckedChange={(value) => setValue("sold_out_manuale", value)}
            />
            <Label htmlFor="option-sold-out">Sold out manuale</Label>
          </div>
        </div>

        {tipo === "workshop" && (
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Switch
                id="option-composto"
                checked={composto}
                onCheckedChange={(value) => setValue("composto", value, { shouldValidate: true })}
              />
              <Label htmlFor="option-composto">Workshop composto (pacchetto)</Label>
            </div>
            {composto && (
              <div className="space-y-1.5 pt-1">
                <p className="text-muted-foreground text-xs">
                  Chi si iscrive a questo pacchetto viene conteggiato anche
                  negli iscritti di ciascun workshop selezionato qui sotto.
                </p>
                {candidateChildren.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Nessun altro workshop semplice disponibile.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {candidateChildren.map((child) => (
                      <li key={child.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`option-child-${child.id}`}
                          checked={childIds.includes(child.id)}
                          onCheckedChange={(checked) => toggleChild(child.id, checked)}
                        />
                        <Label htmlFor={`option-child-${child.id}`} className="font-normal">
                          {child.label}
                        </Label>
                      </li>
                    ))}
                  </ul>
                )}
                {errors.child_ids && (
                  <p className="text-destructive text-xs">{errors.child_ids.message}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t pt-4">
          {mode === "edit" && option ? (
            confirmingDelete ? (
              <div className="border-destructive/40 bg-destructive/5 flex-1 space-y-3 rounded-md border p-3">
                <p className="text-sm">
                  Eliminare questa opzione? Non comparirà più nel form pubblico
                  né nella lista admin.
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
                    disabled={isDeleting}
                    onClick={() => onDelete(option.id)}
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
                Elimina opzione
              </Button>
            )
          ) : (
            <span />
          )}

          {!confirmingDelete && (
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              Salva
            </Button>
          )}
        </div>
      </form>
    </Dialog>
  )
}
