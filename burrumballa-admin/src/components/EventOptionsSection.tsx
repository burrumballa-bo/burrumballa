import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table"
import { EventOptionRow } from "@/components/EventOptionRow"
import type { EventOptionStato, EventOptionUpdateInput } from "@/types/eventOption"

interface EventOptionsSectionProps {
  options: EventOptionStato[]
  onSave: (input: EventOptionUpdateInput) => void
  savingId: string | null
}

export function EventOptionsSection({ options, onSave, savingId }: EventOptionsSectionProps) {
  if (options.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Nessuna opzione configurata.</p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Etichetta</TableHead>
            <TableHead>Prezzo</TableHead>
            <TableHead>Ordine</TableHead>
            <TableHead>Max posti</TableHead>
            <TableHead className="text-center">Attivo</TableHead>
            <TableHead className="text-center">Sold out manuale</TableHead>
            <TableHead>Iscritti</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {options.map((option) => (
            <EventOptionRow
              key={option.id}
              option={option}
              onSave={onSave}
              isSaving={savingId === option.id}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
