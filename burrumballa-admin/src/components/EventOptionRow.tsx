import { Pencil } from "lucide-react"

import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  getOptionAvailability,
  OPTION_AVAILABILITY_BADGE_CLASSES,
  OPTION_AVAILABILITY_LABELS,
} from "@/lib/optionAvailability"
import { formatCurrency } from "@/lib/format"
import type { EventOptionStato } from "@/types/eventOption"

interface EventOptionRowProps {
  option: EventOptionStato
  onEdit: (option: EventOptionStato) => void
}

export function EventOptionRow({ option, onEdit }: EventOptionRowProps) {
  const availability = getOptionAvailability(option)

  return (
    <TableRow>
      <TableCell className="min-w-[200px]">
        <p>{option.label}</p>
        <p className="text-muted-foreground font-mono text-xs">{option.chiave}</p>
      </TableCell>
      <TableCell className="text-sm tabular-nums">{formatCurrency(option.prezzo)}</TableCell>
      <TableCell className="text-sm tabular-nums">{option.ordine}</TableCell>
      <TableCell className="text-sm tabular-nums">
        {option.composto ? "Da componenti" : (option.max_posti ?? "Illimitato")}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={option.attivo ? "outline" : "secondary"}>
          {option.attivo ? "Sì" : "No"}
        </Badge>
      </TableCell>
      {option.tipo === "workshop" && (
        <TableCell>
          {option.composto ? (
            <div className="space-y-0.5">
              <Badge variant="outline">Composto</Badge>
              {option.composto_di.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  {option.composto_di.join(", ")}
                </p>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </TableCell>
      )}
      <TableCell className="text-sm whitespace-nowrap tabular-nums">
        {option.iscritti} / {option.composto ? "—" : (option.max_posti ?? "∞")}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={OPTION_AVAILABILITY_BADGE_CLASSES[availability]}>
          {OPTION_AVAILABILITY_LABELS[availability]}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button type="button" size="sm" variant="outline" onClick={() => onEdit(option)}>
          <Pencil />
          Modifica
        </Button>
      </TableCell>
    </TableRow>
  )
}
