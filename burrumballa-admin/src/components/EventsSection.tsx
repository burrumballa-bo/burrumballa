import { useState } from "react"
import { Pencil, Plus, Star } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EventModal } from "@/components/EventModal"
import {
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
} from "@/hooks/useEvents"
import type { EventItem } from "@/types/cms"

type ModalState = { mode: "create" } | { mode: "edit"; event: EventItem } | null

export function EventsSection() {
  const eventsQuery = useEvents()
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()

  const [modal, setModal] = useState<ModalState>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (eventsQuery.isLoading) {
    return <p className="text-muted-foreground text-sm">Caricamento eventi...</p>
  }
  if (eventsQuery.isError) {
    return (
      <p className="text-destructive text-sm">
        Errore nel caricamento degli eventi: {(eventsQuery.error as Error).message}
      </p>
    )
  }

  const events = eventsQuery.data ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Schede mostrate su Home (le prime 3, in ordine) e nella pagina Eventi.
        </p>
        <Button size="sm" onClick={() => setModal({ mode: "create" })}>
          <Plus />
          Nuovo evento
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessun evento ancora creato.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titolo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    {event.featured && <Star className="size-3.5 fill-current text-amber-500" />}
                    {event.title}
                  </div>
                  {event.tags.length > 0 && (
                    <div className="text-muted-foreground mt-0.5 text-xs">{event.tags.join(" · ")}</div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {event.subtitle || "—"}
                </TableCell>
                <TableCell>
                  {event.published ? (
                    <span className="text-xs text-emerald-600">Pubblicato</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Bozza</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setModal({ mode: "edit", event })}>
                    <Pencil />
                    Modifica
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {modal && (
        <EventModal
          mode={modal.mode}
          event={modal.mode === "edit" ? modal.event : undefined}
          onClose={() => setModal(null)}
          onCreate={(input) =>
            createEvent.mutate(input, {
              onSuccess: () => {
                toast.success("Evento creato.")
                setModal(null)
              },
              onError: (error) =>
                toast.error("Creazione non riuscita.", { description: (error as Error).message }),
            })
          }
          onSave={(input) =>
            updateEvent.mutate(input, {
              onSuccess: () => {
                toast.success("Evento salvato.")
                setModal(null)
              },
              onError: (error) =>
                toast.error("Salvataggio non riuscito.", { description: (error as Error).message }),
            })
          }
          onDelete={(id) => {
            setDeletingId(id)
            deleteEvent.mutate(id, {
              onSuccess: () => {
                toast.success("Evento eliminato.")
                setModal(null)
              },
              onError: (error) =>
                toast.error("Eliminazione non riuscita.", { description: (error as Error).message }),
              onSettled: () => setDeletingId(null),
            })
          }}
          isSaving={createEvent.isPending || updateEvent.isPending}
          isDeleting={deleteEvent.isPending && modal.mode === "edit" && deletingId === modal.event.id}
        />
      )}
    </div>
  )
}
