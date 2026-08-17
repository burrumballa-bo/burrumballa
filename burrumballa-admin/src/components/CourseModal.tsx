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
import { courseSchema, type CourseFormValues } from "@/lib/cms/schemas"
import type { Course, CourseInsertInput, CourseUpdateInput } from "@/types/cms"

interface CourseModalProps {
  mode: "create" | "edit"
  course?: Course
  onClose: () => void
  onCreate: (input: CourseInsertInput) => void
  onSave: (input: CourseUpdateInput) => void
  onDelete: (id: string) => void
  isSaving: boolean
  isDeleting: boolean
}

export function CourseModal({
  mode,
  course,
  onClose,
  onCreate,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: CourseModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      slug: course?.slug ?? "",
      name: course?.name ?? "",
      color: course?.color ?? "#7e3fae",
      body: course?.body ?? "",
      teachers: course?.teachers ?? "",
      image_url: course?.image_url ?? "",
      order_index: course ? String(course.order_index) : "0",
      published: course?.published ?? true,
    },
  })

  const color = watch("color")
  const imageUrl = watch("image_url")
  const published = watch("published")

  const onSubmit = (values: CourseFormValues) => {
    const shared = {
      name: values.name.trim(),
      color: values.color.trim(),
      body: values.body.trim() || null,
      teachers: values.teachers.trim() || null,
      image_url: values.image_url.trim() || null,
      order_index: Number(values.order_index),
      published: values.published,
    }

    if (mode === "create") {
      onCreate({ slug: values.slug.trim(), ...shared })
    } else if (course) {
      onSave({ id: course.id, slug: course.slug, ...shared })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "Nuovo corso" : `Modifica — ${course?.name}`}</DialogTitle>
        <DialogCloseButton onClick={onClose} />
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="course-slug">Slug</Label>
            <Input
              id="course-slug"
              disabled={mode === "edit"}
              placeholder="es. hip-hop"
              aria-invalid={!!errors.slug}
              {...register("slug")}
            />
            {errors.slug ? (
              <p className="text-destructive text-xs">{errors.slug.message}</p>
            ) : mode === "create" ? (
              <p className="text-muted-foreground text-xs">
                Identificativo tecnico (usato come ancora nella pagina Corsi), non modificabile in seguito.
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="course-name">Nome disciplina</Label>
            <Input id="course-name" aria-invalid={!!errors.name} {...register("name")} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="course-color">Colore</Label>
          <div className="flex items-center gap-2">
            <span
              className="border-input h-9 w-9 shrink-0 rounded-md border"
              style={{ backgroundColor: color || "transparent" }}
              aria-hidden
            />
            <Input id="course-color" aria-invalid={!!errors.color} {...register("color")} />
          </div>
          {errors.color && <p className="text-destructive text-xs">{errors.color.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="course-body">Descrizione</Label>
          <Textarea id="course-body" rows={3} {...register("body")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="course-teachers">Insegnanti (facoltativo)</Label>
          <Input id="course-teachers" placeholder="es. con Pizzo & Still" {...register("teachers")} />
        </div>

        <MediaUploadField
          label="Immagine"
          value={imageUrl || null}
          onChange={(url) => setValue("image_url", url ?? "", { shouldDirty: true })}
          folder="courses"
        />

        <div className="flex flex-wrap items-center gap-6">
          <div className="w-32 space-y-1.5">
            <Label htmlFor="course-order">Ordine</Label>
            <Input
              id="course-order"
              type="number"
              step="1"
              aria-invalid={!!errors.order_index}
              {...register("order_index")}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch
              id="course-published"
              checked={published}
              onCheckedChange={(value) => setValue("published", value)}
            />
            <Label htmlFor="course-published">Pubblicato</Label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-4">
          {mode === "edit" && course ? (
            confirmingDelete ? (
              <div className="border-destructive/40 bg-destructive/5 flex-1 space-y-3 rounded-md border p-3">
                <p className="text-sm">
                  Eliminare questo corso? Vengono eliminati anche i suoi livelli/orari e non
                  comparirà più sul sito pubblico.
                </p>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingDelete(false)}>
                    Annulla
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => onDelete(course.id)}
                  >
                    {isDeleting && <Loader2 className="animate-spin" />}
                    Conferma eliminazione
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmingDelete(true)}>
                <Trash2 />
                Elimina corso
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
