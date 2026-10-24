import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarDays, Loader2, Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { useConfirm } from "@/hooks/useConfirm"
import { useCreateEvent, useDeleteEvent, useEvents, type EventListItem } from "@/hooks/useEventInfo"
import { datetimeLocalToIso, formatDateOnly } from "@/lib/datetime"
import { SLUG_PATTERN, slugify } from "@/lib/eventInfoSchema"
import { todayIso } from "@/lib/subscriptions"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogCloseButton, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

function eventStatus(e: EventListItem, today: string) {
  if (!e.pubblicato) return { label: "Non pubblicato", className: "border-dashed text-muted-foreground" }
  if (e.data_evento && e.data_evento < today) return { label: "Concluso", className: "text-muted-foreground" }
  if (!e.iscrizioni_aperte) return { label: "Iscrizioni chiuse", className: "border-amber-300 bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" }
  return { label: "Iscrizioni aperte", className: "border-green-600 bg-green-500/20 text-green-800 dark:text-green-300" }
}

function NewEventDialog({ events, onClose }: { events: EventListItem[]; onClose: () => void }) {
  const navigate = useNavigate()
  const create = useCreateEvent()
  const [titolo, setTitolo] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [data, setData] = useState("")
  const [scadenza, setScadenza] = useState("")
  const [copyFrom, setCopyFrom] = useState<string>(events[0] ? String(events[0].id) : "")

  const effectiveSlug = slugTouched ? slug : slugify(titolo)
  const slugTaken = events.some((e) => e.slug === effectiveSlug)
  const valid =
    titolo.trim() !== "" && SLUG_PATTERN.test(effectiveSlug) && !slugTaken && !!datetimeLocalToIso(scadenza)

  const handleCreate = () =>
    create.mutate(
      {
        titolo: titolo.trim(),
        slug: effectiveSlug,
        data_evento: data || null,
        scadenza_iscrizioni: datetimeLocalToIso(scadenza)!,
        copyFromId: copyFrom ? Number(copyFrom) : null,
      },
      {
        onSuccess: (id) => {
          toast.success("Evento creato. Completa la pagina e pubblicalo quando è pronto.")
          navigate(`/admin/eventi/${id}/pagina`)
        },
        onError: (error) => toast.error("Creazione non riuscita.", { description: (error as Error).message }),
      }
    )

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Nuovo evento</DialogTitle>
        <DialogCloseButton onClick={onClose} />
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ne-titolo">Titolo *</Label>
          <Input id="ne-titolo" value={titolo} onChange={(e) => setTitolo(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ne-slug">Indirizzo della pagina *</Label>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground shrink-0">/eventi/</span>
            <Input
              id="ne-slug"
              aria-invalid={slugTaken || (effectiveSlug !== "" && !SLUG_PATTERN.test(effectiveSlug))}
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
            />
          </div>
          {slugTaken && <p className="text-destructive text-xs">Indirizzo già usato da un altro evento.</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ne-data">Data evento</Label>
            <Input id="ne-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ne-scadenza">Scadenza iscrizioni *</Label>
            <Input
              id="ne-scadenza"
              type="datetime-local"
              value={scadenza}
              onChange={(e) => setScadenza(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ne-copy">Parti da</Label>
          <Select id="ne-copy" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
            <option value="">Evento vuoto</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                Copia di {e.titolo}
              </option>
            ))}
          </Select>
          <p className="text-muted-foreground text-xs">
            Copiando si riprendono opzioni workshop e battle, giuria, prezzi, testi e colori;
            immagini e iscritti no. L&apos;evento nasce non pubblicato.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button disabled={!valid || create.isPending} onClick={handleCreate}>
            {create.isPending && <Loader2 className="animate-spin" />}
            Crea evento
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default function GestioneEventiPage() {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const eventsQuery = useEvents()
  const deleteEvent = useDeleteEvent()
  const [creating, setCreating] = useState(false)
  const today = todayIso()
  const events = eventsQuery.data ?? []

  const handleDelete = async (e: EventListItem) => {
    const ok = await confirm({
      title: `Eliminare "${e.titolo}"?`,
      description: "Vengono eliminate anche opzioni e giuria. Possibile solo se non ci sono iscrizioni.",
    })
    if (!ok) return
    deleteEvent.mutate(e.id, {
      onSuccess: () => toast.success("Evento eliminato."),
      onError: (error) => toast.error("Eliminazione non riuscita.", { description: (error as Error).message }),
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Eventi</h1>
        <Button onClick={() => setCreating(true)} disabled={eventsQuery.isLoading}>
          <Plus />
          Nuovo evento
        </Button>
      </div>

      {eventsQuery.isError && (
        <p className="text-destructive text-sm">
          Errore nel caricamento degli eventi: {(eventsQuery.error as Error).message}
        </p>
      )}
      {eventsQuery.isLoading && <p className="text-muted-foreground text-sm">Caricamento eventi...</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => {
          const status = eventStatus(e, today)
          return (
            <Card
              key={e.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/admin/eventi/${e.id}`)}
              onKeyDown={(ev) => ev.key === "Enter" && navigate(`/admin/eventi/${e.id}`)}
              className={cn(
                "hover:border-primary/50 cursor-pointer transition-colors",
                !e.pubblicato && "opacity-80"
              )}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 leading-snug">
                    <CalendarDays className="text-muted-foreground size-4 shrink-0" />
                    {e.titolo}
                  </CardTitle>
                  {e.iscritti === 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive -mt-1 -mr-2 size-8 shrink-0"
                      aria-label={`Elimina ${e.titolo}`}
                      onClick={(ev) => {
                        ev.stopPropagation()
                        handleDelete(e)
                      }}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {e.data_evento ? formatDateOnly(e.data_evento) : "Data da definire"} · /eventi/{e.slug}
                </CardDescription>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Users className="size-3.5" />
                    {e.iscritti} iscritti
                  </span>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {creating && <NewEventDialog events={events} onClose={() => setCreating(false)} />}
    </div>
  )
}
