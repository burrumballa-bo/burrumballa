import { Plus } from "lucide-react"

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { EventOptionRow } from "@/components/EventOptionRow"
import type { EventOptionStato, EventOptionTipo } from "@/types/eventOption"

interface EventOptionsSectionProps {
  tipo: EventOptionTipo
  options: EventOptionStato[]
  onEdit: (option: EventOptionStato) => void
  onCreate: () => void
}

export function EventOptionsSection({ tipo, options, onEdit, onCreate }: EventOptionsSectionProps) {
  return (
    <div className="space-y-3">
      {options.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna opzione configurata.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etichetta</TableHead>
                <TableHead>Prezzo</TableHead>
                <TableHead>Ordine</TableHead>
                <TableHead>Max posti</TableHead>
                <TableHead className="text-center">Attivo</TableHead>
                {tipo === "workshop" && <TableHead>Composto</TableHead>}
                <TableHead>Iscritti</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map((option) => (
                <EventOptionRow key={option.id} option={option} onEdit={onEdit} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={onCreate}>
        <Plus />
        Nuova opzione
      </Button>
    </div>
  )
}
