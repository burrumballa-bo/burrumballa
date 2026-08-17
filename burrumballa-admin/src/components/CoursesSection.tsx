import { useState } from "react"
import { ChevronDown, ChevronRight, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CourseLevelsPanel } from "@/components/CourseLevelsPanel"
import { CourseModal } from "@/components/CourseModal"
import {
  useCourses,
  useCreateCourse,
  useDeleteCourse,
  useUpdateCourse,
} from "@/hooks/useCourses"
import type { Course } from "@/types/cms"

type ModalState = { mode: "create" } | { mode: "edit"; course: Course } | null

export function CoursesSection() {
  const coursesQuery = useCourses()
  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse()
  const deleteCourse = useDeleteCourse()

  const [modal, setModal] = useState<ModalState>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (coursesQuery.isLoading) {
    return <p className="text-muted-foreground text-sm">Caricamento corsi...</p>
  }
  if (coursesQuery.isError) {
    return (
      <p className="text-destructive text-sm">
        Errore nel caricamento dei corsi: {(coursesQuery.error as Error).message}
      </p>
    )
  }

  const courses = coursesQuery.data ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Discipline mostrate su Home e Corsi, con i relativi orari settimanali.
        </p>
        <Button size="sm" onClick={() => setModal({ mode: "create" })}>
          <Plus />
          Nuovo corso
        </Button>
      </div>

      {courses.length === 0 && (
        <p className="text-muted-foreground text-sm">Nessun corso ancora creato.</p>
      )}

      {courses.map((course) => {
        const isExpanded = expandedId === course.id
        return (
          <Card key={course.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <button
                type="button"
                className="flex flex-1 items-center gap-3 text-left"
                onClick={() => setExpandedId(isExpanded ? null : course.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="text-muted-foreground size-4 shrink-0" />
                ) : (
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                )}
                <span
                  className="border-input h-5 w-5 shrink-0 rounded-sm border"
                  style={{ backgroundColor: course.color }}
                  aria-hidden
                />
                <span className="font-medium">{course.name}</span>
                <span className="text-muted-foreground text-xs">/{course.slug}</span>
                {!course.published && (
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                    Non pubblicato
                  </span>
                )}
                <span className="text-muted-foreground ml-auto text-xs">
                  {course.levels.length} {course.levels.length === 1 ? "livello" : "livelli"}
                </span>
              </button>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setModal({ mode: "edit", course })}>
                  <Pencil />
                  Modifica
                </Button>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent>
                <CourseLevelsPanel course={course} />
              </CardContent>
            )}
          </Card>
        )
      })}

      {modal && (
        <CourseModal
          mode={modal.mode}
          course={modal.mode === "edit" ? modal.course : undefined}
          onClose={() => setModal(null)}
          onCreate={(input) =>
            createCourse.mutate(input, {
              onSuccess: () => {
                toast.success("Corso creato.")
                setModal(null)
              },
              onError: (error) =>
                toast.error("Creazione non riuscita.", { description: (error as Error).message }),
            })
          }
          onSave={(input) =>
            updateCourse.mutate(input, {
              onSuccess: () => {
                toast.success("Corso salvato.")
                setModal(null)
              },
              onError: (error) =>
                toast.error("Salvataggio non riuscito.", { description: (error as Error).message }),
            })
          }
          onDelete={(id) => {
            setDeletingId(id)
            deleteCourse.mutate(id, {
              onSuccess: () => {
                toast.success("Corso eliminato.")
                setModal(null)
              },
              onError: (error) =>
                toast.error("Eliminazione non riuscita.", { description: (error as Error).message }),
              onSettled: () => setDeletingId(null),
            })
          }}
          isSaving={createCourse.isPending || updateCourse.isPending}
          isDeleting={deleteCourse.isPending && modal.mode === "edit" && deletingId === modal.course.id}
        />
      )}
    </div>
  )
}
