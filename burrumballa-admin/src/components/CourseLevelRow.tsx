import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save, Trash2 } from "lucide-react"

import { TableCell, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { WEEKDAY_OPTIONS } from "@/lib/weekdays"
import { courseLevelSchema, type CourseLevelFormValues } from "@/lib/cms/schemas"
import type { CourseLevel, CourseLevelUpdateInput } from "@/types/cms"

interface CourseLevelRowProps {
  level: CourseLevel
  onSave: (input: CourseLevelUpdateInput) => void
  onDelete: (id: string) => void
  isSaving: boolean
  isDeleting: boolean
}

export function CourseLevelRow({ level, onSave, onDelete, isSaving, isDeleting }: CourseLevelRowProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CourseLevelFormValues>({
    resolver: zodResolver(courseLevelSchema),
    defaultValues: {
      level: level.level,
      day_of_week: String(level.day_of_week),
      time: level.time,
      order_index: String(level.order_index),
    },
  })

  const onSubmit = (values: CourseLevelFormValues) => {
    onSave({
      id: level.id,
      course_id: level.course_id,
      level: values.level.trim(),
      day_of_week: Number(values.day_of_week),
      time: values.time.trim(),
      order_index: Number(values.order_index),
    })
  }

  return (
    <TableRow>
      <TableCell className="min-w-[120px]">
        <Input aria-label="Livello" aria-invalid={!!errors.level} {...register("level")} />
      </TableCell>
      <TableCell className="w-36">
        <Select aria-label="Giorno" {...register("day_of_week")}>
          {WEEKDAY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </TableCell>
      <TableCell className="w-28">
        <Input aria-label="Orario" placeholder="18:00" aria-invalid={!!errors.time} {...register("time")} />
        {errors.time && <p className="text-destructive mt-1 text-xs">{errors.time.message}</p>}
      </TableCell>
      <TableCell className="w-20">
        <Input type="number" step="1" aria-label="Ordine" {...register("order_index")} />
      </TableCell>
      <TableCell className="text-right whitespace-nowrap">
        <Button
          type="button"
          size="sm"
          variant={isDirty ? "default" : "outline"}
          disabled={isSaving}
          onClick={handleSubmit(onSubmit)}
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive ml-1"
          disabled={isDeleting}
          onClick={() => onDelete(level.id)}
        >
          {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
        </Button>
      </TableCell>
    </TableRow>
  )
}
