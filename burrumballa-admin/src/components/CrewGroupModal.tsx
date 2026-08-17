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
import { crewGroupSchema, type CrewGroupFormValues } from "@/lib/cms/schemas"
import type { CrewGroup, CrewGroupInsertInput, CrewGroupUpdateInput } from "@/types/cms"

interface CrewGroupModalProps {
  mode: "create" | "edit"
  group?: CrewGroup
  onClose: () => void
  onCreate: (input: CrewGroupInsertInput) => void
  onSave: (input: CrewGroupUpdateInput) => void
  onDelete: (id: string) => void
  isSaving: boolean
  isDeleting: boolean
}

export function CrewGroupModal({
  mode,
  group,
  onClose,
  onCreate,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: CrewGroupModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CrewGroupFormValues>({
    resolver: zodResolver(crewGroupSchema),
    defaultValues: {
      title: group?.title ?? "",
      body: group?.body ?? "",
      image_url: group?.image_url ?? "",
      order_index: group ? String(group.order_index) : "0",
      published: group?.published ?? true,
    },
  })

  const imageUrl = watch("image_url")
  const published = watch("published")

  const onSubmit = (values: CrewGroupFormValues) => {
    const shared = {
      title: values.title.trim(),
      body: values.body.trim() || null,
      image_url: values.image_url.trim() || null,
      order_index: Number(values.order_index),
      published: values.published,
    }

    if (mode === "create") {
      onCreate(shared)
    } else if (group) {
      onSave({ id: group.id, ...shared })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "Nuova card crew" : `Modifica — ${group?.title}`}</DialogTitle>
        <DialogCloseButton onClick={onClose} />
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="crew-title">Titolo</Label>
          <Input
            id="crew-title"
            placeholder="es. Breaking & Waacking"
            aria-invalid={!!errors.title}
            {...register("title")}
          />
          {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="crew-body">Descrizione</Label>
          <Textarea id="crew-body" rows={2} {...register("body")} />
        </div>

        <MediaUploadField
          label="Immagine"
          value={imageUrl || null}
          onChange={(url) => setValue("image_url", url ?? "", { shouldDirty: true })}
          folder="crew"
        />

        <div className="flex flex-wrap items-center gap-6">
          <div className="w-32 space-y-1.5">
            <Label htmlFor="crew-order">Ordine</Label>
            <Input
              id="crew-order"
              type="number"
              step="1"
              aria-invalid={!!errors.order_index}
              {...register("order_index")}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch
              id="crew-published"
              checked={published}
              onCheckedChange={(value) => setValue("published", value)}
            />
            <Label htmlFor="crew-published">Pubblicato</Label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-4">
          {mode === "edit" && group ? (
            confirmingDelete ? (
              <div className="border-destructive/40 bg-destructive/5 flex-1 space-y-3 rounded-md border p-3">
                <p className="text-sm">Eliminare questa card? Non comparirà più in Chi Siamo.</p>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingDelete(false)}>
                    Annulla
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => onDelete(group.id)}
                  >
                    {isDeleting && <Loader2 className="animate-spin" />}
                    Conferma eliminazione
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmingDelete(true)}>
                <Trash2 />
                Elimina
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
