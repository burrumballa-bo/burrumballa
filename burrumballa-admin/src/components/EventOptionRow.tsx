import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save } from "lucide-react"

import { TableCell, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { eventOptionSchema, type EventOptionFormValues } from "@/lib/eventOptionSchema"
import {
  getOptionAvailability,
  OPTION_AVAILABILITY_BADGE_CLASSES,
  OPTION_AVAILABILITY_LABELS,
} from "@/lib/optionAvailability"
import type { EventOptionStato, EventOptionUpdateInput } from "@/types/eventOption"

interface EventOptionRowProps {
  option: EventOptionStato
  onSave: (input: EventOptionUpdateInput) => void
  isSaving: boolean
}

export function EventOptionRow({ option, onSave, isSaving }: EventOptionRowProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EventOptionFormValues>({
    resolver: zodResolver(eventOptionSchema),
    defaultValues: {
      label: option.label,
      prezzo: String(option.prezzo),
      ordine: String(option.ordine),
      max_posti: option.max_posti != null ? String(option.max_posti) : "",
      attivo: option.attivo,
      sold_out_manuale: option.sold_out_manuale,
    },
  })

  const attivo = watch("attivo")
  const soldOutManuale = watch("sold_out_manuale")
  const availability = getOptionAvailability(option)

  const onSubmit = (values: EventOptionFormValues) => {
    onSave({
      id: option.id,
      label: values.label.trim(),
      prezzo: Number(values.prezzo),
      ordine: Number(values.ordine),
      max_posti: values.max_posti === "" ? null : Number(values.max_posti),
      attivo: values.attivo,
      sold_out_manuale: values.sold_out_manuale,
    })
  }

  return (
    <TableRow>
      <TableCell className="min-w-[200px]">
        <Input
          aria-label={`Etichetta opzione ${option.chiave}`}
          aria-invalid={!!errors.label}
          {...register("label")}
        />
        {errors.label && (
          <p className="text-destructive mt-1 text-xs">{errors.label.message}</p>
        )}
        <p className="text-muted-foreground mt-1 font-mono text-xs">{option.chiave}</p>
      </TableCell>
      <TableCell className="w-28">
        <Input
          type="number"
          step="0.01"
          min="0"
          aria-label={`Prezzo opzione ${option.chiave}`}
          aria-invalid={!!errors.prezzo}
          {...register("prezzo")}
        />
        {errors.prezzo && (
          <p className="text-destructive mt-1 text-xs">{errors.prezzo.message}</p>
        )}
      </TableCell>
      <TableCell className="w-20">
        <Input
          type="number"
          step="1"
          aria-label={`Ordine opzione ${option.chiave}`}
          aria-invalid={!!errors.ordine}
          {...register("ordine")}
        />
        {errors.ordine && (
          <p className="text-destructive mt-1 text-xs">{errors.ordine.message}</p>
        )}
      </TableCell>
      <TableCell className="w-32">
        <Input
          type="number"
          step="1"
          min="1"
          placeholder="Illimitato"
          aria-label={`Max posti opzione ${option.chiave}`}
          aria-invalid={!!errors.max_posti}
          {...register("max_posti")}
        />
        {errors.max_posti && (
          <p className="text-destructive mt-1 text-xs">{errors.max_posti.message}</p>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Switch
          aria-label={`Attivo/non attivo opzione ${option.chiave}`}
          checked={attivo}
          onCheckedChange={(value) => setValue("attivo", value, { shouldDirty: true })}
        />
      </TableCell>
      <TableCell className="text-center">
        <Switch
          aria-label={`Sold out manuale opzione ${option.chiave}`}
          checked={soldOutManuale}
          onCheckedChange={(value) =>
            setValue("sold_out_manuale", value, { shouldDirty: true })
          }
        />
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap tabular-nums">
        {option.iscritti} / {option.max_posti ?? "∞"}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={OPTION_AVAILABILITY_BADGE_CLASSES[availability]}>
          {OPTION_AVAILABILITY_LABELS[availability]}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          size="sm"
          variant={isDirty ? "default" : "outline"}
          disabled={isSaving}
          onClick={handleSubmit(onSubmit)}
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          Salva
        </Button>
      </TableCell>
    </TableRow>
  )
}
