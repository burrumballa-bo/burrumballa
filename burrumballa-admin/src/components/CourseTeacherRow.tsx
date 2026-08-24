import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MediaUploadField } from "@/components/MediaUploadField"
import { courseTeacherSchema, type CourseTeacherFormValues } from "@/lib/cms/schemas"
import type { CourseTeacher, CourseTeacherUpdateInput } from "@/types/cms"

interface CourseTeacherRowProps {
  teacher: CourseTeacher
  onSave: (input: CourseTeacherUpdateInput) => void
  onDelete: (id: string) => void
  isSaving: boolean
  isDeleting: boolean
}

// Scheda di un insegnante esistente: stesso pattern edit-inline di
// CourseLevelRow, ma in una card invece che in una riga di tabella perché i
// campi (foto, bio) sono più ingombranti di livello/giorno/orario.
export function CourseTeacherRow({ teacher, onSave, onDelete, isSaving, isDeleting }: CourseTeacherRowProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CourseTeacherFormValues>({
    resolver: zodResolver(courseTeacherSchema),
    defaultValues: {
      name: teacher.name,
      photo_url: teacher.photo_url ?? "",
      bio: teacher.bio ?? "",
      order_index: String(teacher.order_index),
    },
  })

  const onSubmit = (values: CourseTeacherFormValues) => {
    onSave({
      id: teacher.id,
      course_id: teacher.course_id,
      name: values.name.trim(),
      photo_url: values.photo_url.trim() || null,
      bio: values.bio.trim() || null,
      order_index: Number(values.order_index),
    })
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
        <div className="space-y-1.5">
          <Label>Nome</Label>
          <Input aria-invalid={!!errors.name} {...register("name")} />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Ordine</Label>
          <Input type="number" step="1" {...register("order_index")} />
        </div>
      </div>
      <MediaUploadField
        label="Foto"
        value={watch("photo_url") || null}
        onChange={(url) => setValue("photo_url", url ?? "", { shouldDirty: true })}
        folder="course-teachers"
      />
      <div className="space-y-1.5">
        <Label>Bio / CV</Label>
        <Textarea rows={3} {...register("bio")} />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          disabled={isDeleting}
          onClick={() => onDelete(teacher.id)}
        >
          {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
          Elimina
        </Button>
        <Button type="button" size="sm" disabled={isSaving} onClick={handleSubmit(onSubmit)}>
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          Salva
        </Button>
      </div>
    </div>
  )
}
