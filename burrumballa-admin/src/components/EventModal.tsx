import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, Save, Trash2 } from "lucide-react"

import { Dialog, DialogCloseButton, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { MediaUploadField } from "@/components/MediaUploadField"
import { eventSchema, type EventFormValues } from "@/lib/cms/schemas"
import type { EventInsertInput, EventItem, EventUpdateInput } from "@/types/cms"

interface EventModalProps {
  mode: "create" | "edit"
  event?: EventItem
  onClose: () => void
  onCreate: (input: EventInsertInput) => void
  onSave: (input: EventUpdateInput) => void
  onDelete: (id: string) => void
  isSaving: boolean
  isDeleting: boolean
}

export function EventModal({
  mode,
  event,
  onClose,
  onCreate,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: EventModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      slug: event?.slug ?? "",
      title: event?.title ?? "",
      subtitle: event?.subtitle ?? "",
      body: event?.body ?? "",
      image_url: event?.image_url ?? "",
      tagsText: event?.tags.join(", ") ?? "",
      event_date: event?.event_date ?? "",
      event_end_date: event?.event_end_date ?? "",
      event_time: event?.event_time ?? "",
      note: event?.note ?? "",
      color: event?.color ?? "#7e3fae",
      featured: event?.featured ?? false,
      show_in_calendar: event?.show_in_calendar ?? true,
      cta_label: event?.cta_label ?? "",
      cta_url: event?.cta_url ?? "",
      order_index: event ? String(event.order_index) : "0",
      published: event?.published ?? true,
    },
  })

  const color = watch("color")
  const imageUrl = watch("image_url")
  const featured = watch("featured")
  const showInCalendar = watch("show_in_calendar")
  const published = watch("published")

  const onSubmit = (values: EventFormValues) => {
    const shared = {
      title: values.title.trim(),
      subtitle: values.subtitle.trim() || null,
      body: values.body.trim() || null,
      image_url: values.image_url.trim() || null,
      tags: values.tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      event_date: values.event_date || null,
      event_end_date: values.event_end_date || null,
      event_time: values.event_time.trim() || null,
      note: values.note.trim() || null,
      color: values.color.trim(),
      featured: values.featured,
      show_in_calendar: values.show_in_calendar,
      cta_label: values.cta_label.trim() || null,
      cta_url: values.cta_url.trim() || null,
      order_index: Number(values.order_index),
      published: values.published,
    }

    if (mode === "create") {
      onCreate({ slug: values.slug.trim(), ...shared })
    } else if (event) {
      onSave({ id: event.id, slug: event.slug, ...shared })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "Nuovo evento" : `Modifica — ${event?.title}`}</DialogTitle>
        <DialogCloseButton onClick={onClose} />
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="event-slug">Slug</Label>
            <Input
              id="event-slug"
              disabled={mode === "edit"}
              placeholder="es. apericreativo"
              aria-invalid={!!errors.slug}
              {...register("slug")}
            />
            {errors.slug && <p className="text-destructive text-xs">{errors.slug.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-title">Titolo</Label>
            <Input id="event-title" aria-invalid={!!errors.title} {...register("title")} />
            {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="event-subtitle">Etichetta data (testo libero)</Label>
          <Input
            id="event-subtitle"
            placeholder='es. "12–13 ottobre" oppure "VENERDÌ · DALLE 18:30"'
            {...register("subtitle")}
          />
          <p className="text-muted-foreground text-xs">
            Mostrata nella scheda evento così com&apos;è scritta: utile per eventi ricorrenti senza
            una data singola.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="event-body">Descrizione</Label>
          <Textarea id="event-body" rows={3} {...register("body")} />
        </div>

        <MediaUploadField
          label="Immagine"
          value={imageUrl || null}
          onChange={(url) => setValue("image_url", url ?? "", { shouldDirty: true })}
          folder="events"
        />

        <div className="space-y-1.5">
          <Label htmlFor="event-tags">Tag (separati da virgola)</Label>
          <Input id="event-tags" placeholder="Workshop, Battle, Party" {...register("tagsText")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="event-color">Colore</Label>
          <div className="flex items-center gap-2">
            <span
              className="border-input h-9 w-9 shrink-0 rounded-md border"
              style={{ backgroundColor: color || "transparent" }}
              aria-hidden
            />
            <Input id="event-color" aria-invalid={!!errors.color} {...register("color")} />
          </div>
          {errors.color && <p className="text-destructive text-xs">{errors.color.message}</p>}
        </div>

        <div className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <Label htmlFor="event-show-calendar">Mostra nel calendario di Home</Label>
              <p className="text-muted-foreground text-xs">
                Richiede una data di inizio: l&apos;evento compare nei giorni corrispondenti nel
                widget &quot;Cosa succede&quot; della home.
              </p>
            </div>
            <Switch
              id="event-show-calendar"
              checked={showInCalendar}
              onCheckedChange={(value) => setValue("show_in_calendar", value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-date">Data inizio</Label>
              <Input id="event-date" type="date" {...register("event_date")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-end-date">Data fine (facoltativa)</Label>
              <Input id="event-end-date" type="date" {...register("event_end_date")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-time">Orario (testo libero)</Label>
              <Input id="event-time" placeholder="es. 19:00 oppure 21:00–23:00" {...register("event_time")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-note">Nota (mostrata accanto all&apos;orario)</Label>
            <Input id="event-note" placeholder="es. aperto a tutti · tessera ARCI" {...register("note")} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="event-cta-label">Etichetta pulsante (facoltativa)</Label>
            <Input id="event-cta-label" placeholder="es. Scopri di più" {...register("cta_label")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-cta-url">Link pulsante (facoltativo)</Label>
            <Input id="event-cta-url" placeholder="/eventi/senti-come-suona" {...register("cta_url")} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="w-32 space-y-1.5">
            <Label htmlFor="event-order">Ordine</Label>
            <Input
              id="event-order"
              type="number"
              step="1"
              aria-invalid={!!errors.order_index}
              {...register("order_index")}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch id="event-featured" checked={featured} onCheckedChange={(value) => setValue("featured", value)} />
            <Label htmlFor="event-featured">In evidenza</Label>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch
              id="event-published"
              checked={published}
              onCheckedChange={(value) => setValue("published", value)}
            />
            <Label htmlFor="event-published">Pubblicato</Label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-4">
          {mode === "edit" && event ? (
            confirmingDelete ? (
              <div className="border-destructive/40 bg-destructive/5 flex-1 space-y-3 rounded-md border p-3">
                <p className="text-sm">Eliminare questo evento? Non comparirà più sul sito pubblico.</p>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingDelete(false)}>
                    Annulla
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => onDelete(event.id)}
                  >
                    {isDeleting && <Loader2 className="animate-spin" />}
                    Conferma eliminazione
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmingDelete(true)}>
                <Trash2 />
                Elimina evento
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
