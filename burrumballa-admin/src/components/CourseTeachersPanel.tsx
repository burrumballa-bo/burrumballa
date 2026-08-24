import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MediaUploadField } from "@/components/MediaUploadField"
import { CourseTeacherRow } from "@/components/CourseTeacherRow"
import {
  useCreateCourseTeacher,
  useDeleteCourseTeacher,
  useUpdateCourseTeacher,
} from "@/hooks/useCourses"
import {
  courseTeacherSchema,
  emptyCourseTeacherFormValues,
  type CourseTeacherFormValues,
} from "@/lib/cms/schemas"
import type { CourseWithLevels } from "@/types/cms"

interface CourseTeachersPanelProps {
  course: CourseWithLevels
}

// Insegnanti di un corso (foto, nome, bio) mostrati nella pagina di
// dettaglio pubblica: stesso pattern di CourseLevelsPanel, elenco esistente
// + form di creazione in fondo.
export function CourseTeachersPanel({ course }: CourseTeachersPanelProps) {
  const createTeacher = useCreateCourseTeacher()
  const updateTeacher = useUpdateCourseTeacher()
  const deleteTeacher = useDeleteCourseTeacher()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CourseTeacherFormValues>({
    resolver: zodResolver(courseTeacherSchema),
    defaultValues: emptyCourseTeacherFormValues,
  })

  const onSubmit = (values: CourseTeacherFormValues) => {
    createTeacher.mutate(
      {
        course_id: course.id,
        name: values.name.trim(),
        photo_url: values.photo_url.trim() || null,
        bio: values.bio.trim() || null,
        order_index: Number(values.order_index),
      },
      {
        onSuccess: () => reset(emptyCourseTeacherFormValues),
        onError: (error) =>
          toast.error("Aggiunta non riuscita.", { description: (error as Error).message }),
      }
    )
  }

  return (
    <div className="space-y-3">
      {course.teacherProfiles.map((teacher) => (
        <CourseTeacherRow
          key={teacher.id}
          teacher={teacher}
          onSave={(input) =>
            updateTeacher.mutate(input, {
              onError: (error) =>
                toast.error("Salvataggio non riuscito.", { description: (error as Error).message }),
            })
          }
          onDelete={(id) => {
            setDeletingId(id)
            deleteTeacher.mutate(id, {
              onError: (error) =>
                toast.error("Eliminazione non riuscita.", { description: (error as Error).message }),
              onSettled: () => setDeletingId(null),
            })
          }}
          isSaving={updateTeacher.isPending}
          isDeleting={deleteTeacher.isPending && deletingId === teacher.id}
        />
      ))}

      {course.teacherProfiles.length === 0 && (
        <p className="text-muted-foreground text-sm">Nessun insegnante ancora aggiunto.</p>
      )}

      <div className="space-y-3 rounded-md border border-dashed p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
          <div className="space-y-1.5">
            <Label>Nome nuovo insegnante</Label>
            <Input placeholder="es. Pizzo" aria-invalid={!!errors.name} {...register("name")} />
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
          <Textarea rows={3} placeholder="Percorso, stile, esperienza..." {...register("bio")} />
        </div>
        <div className="flex justify-end">
          <Button type="button" size="sm" disabled={createTeacher.isPending} onClick={handleSubmit(onSubmit)}>
            {createTeacher.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            Aggiungi insegnante
          </Button>
        </div>
      </div>
    </div>
  )
}
