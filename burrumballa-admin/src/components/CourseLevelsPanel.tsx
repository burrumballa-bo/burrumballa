import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CourseLevelRow } from "@/components/CourseLevelRow"
import {
  useCreateCourseLevel,
  useDeleteCourseLevel,
  useUpdateCourseLevel,
} from "@/hooks/useCourses"
import { WEEKDAY_OPTIONS } from "@/lib/weekdays"
import {
  courseLevelSchema,
  emptyCourseLevelFormValues,
  type CourseLevelFormValues,
} from "@/lib/cms/schemas"
import type { CourseWithLevels } from "@/types/cms"

interface CourseLevelsPanelProps {
  course: CourseWithLevels
}

// Orari/livelli di un corso: editabili inline (una riga per livello),
// stesso pattern di EventPeopleSection/EventPersonRow.
export function CourseLevelsPanel({ course }: CourseLevelsPanelProps) {
  const createLevel = useCreateCourseLevel()
  const updateLevel = useUpdateCourseLevel()
  const deleteLevel = useDeleteCourseLevel()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseLevelFormValues>({
    resolver: zodResolver(courseLevelSchema),
    defaultValues: emptyCourseLevelFormValues,
  })

  const onSubmit = (values: CourseLevelFormValues) => {
    createLevel.mutate(
      {
        course_id: course.id,
        level: values.level.trim(),
        day_of_week: Number(values.day_of_week),
        time: values.time.trim(),
        order_index: Number(values.order_index),
      },
      {
        onSuccess: () => reset(emptyCourseLevelFormValues),
        onError: (error) =>
          toast.error("Aggiunta non riuscita.", { description: (error as Error).message }),
      }
    )
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Livello</TableHead>
            <TableHead>Giorno</TableHead>
            <TableHead>Orario</TableHead>
            <TableHead>Ordine</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {course.levels.map((level) => (
            <CourseLevelRow
              key={level.id}
              level={level}
              onSave={(input) =>
                updateLevel.mutate(input, {
                  onError: (error) =>
                    toast.error("Salvataggio non riuscito.", {
                      description: (error as Error).message,
                    }),
                })
              }
              onDelete={(id) =>
                deleteLevel.mutate(id, {
                  onError: (error) =>
                    toast.error("Eliminazione non riuscita.", {
                      description: (error as Error).message,
                    }),
                })
              }
              isSaving={updateLevel.isPending}
              isDeleting={deleteLevel.isPending}
            />
          ))}
          <TableRow>
            <TableCell className="min-w-[120px]">
              <Input
                aria-label="Nuovo livello"
                placeholder="es. Base"
                aria-invalid={!!errors.level}
                {...register("level")}
              />
            </TableCell>
            <TableCell className="w-36">
              <Select aria-label="Nuovo giorno" {...register("day_of_week")}>
                {WEEKDAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </TableCell>
            <TableCell className="w-28">
              <Input aria-label="Nuovo orario" placeholder="18:00" {...register("time")} />
            </TableCell>
            <TableCell className="w-20">
              <Input type="number" step="1" aria-label="Nuovo ordine" {...register("order_index")} />
            </TableCell>
            <TableCell className="text-right">
              <Button type="button" size="sm" disabled={createLevel.isPending} onClick={handleSubmit(onSubmit)}>
                {createLevel.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
                Aggiungi
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
