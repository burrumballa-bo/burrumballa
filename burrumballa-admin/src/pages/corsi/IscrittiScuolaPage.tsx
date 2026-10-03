import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Search, UserPlus } from "lucide-react"

import { cn } from "@/lib/utils"
import { useCourses } from "@/hooks/useCourses"
import { useSchoolStudents } from "@/hooks/useSchoolStudents"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SchoolStudentsTable } from "@/components/SchoolStudentsTable"
import { SchoolStudentModal } from "@/components/SchoolStudentModal"
import type { SchoolStudent } from "@/types/school"

const ALL = "tutti"

export default function IscrittiScuolaPage() {
  const navigate = useNavigate()
  const studentsQuery = useSchoolStudents()
  const coursesQuery = useCourses()

  const [tab, setTab] = useState<string>(ALL)
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data])
  const courses = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data])

  // Iscritti di un corso = assegnati ad almeno una delle sue classi.
  const studentsByCourse = useMemo(() => {
    const map = new Map<string, SchoolStudent[]>()
    for (const course of courses) {
      const levelIds = new Set(course.levels.map((l) => l.id))
      map.set(
        course.id,
        students.filter((s) => s.classIds.some((id) => levelIds.has(id)))
      )
    }
    return map
  }, [courses, students])

  const visible = useMemo(() => {
    const base = tab === ALL ? students : (studentsByCourse.get(tab) ?? [])
    const term = search.trim().toLowerCase()
    if (!term) return base
    return base.filter((s) => `${s.first_name} ${s.last_name}`.toLowerCase().includes(term))
  }, [tab, students, studentsByCourse, search])

  // Derivato dalla cache: il modale riflette sempre i dati aggiornati.
  const selected = students.find((s) => s.id === selectedId)

  const tabs = [
    { id: ALL, label: "Tutti", count: students.length },
    ...courses.map((c) => ({
      id: c.id,
      label: c.name,
      count: studentsByCourse.get(c.id)?.length ?? 0,
    })),
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin/corsi")}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-semibold">Iscritti alla scuola</h1>
        </div>
        <Button onClick={() => setCreating(true)}>
          <UserPlus />
          Nuovo iscritto
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              tab === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-accent"
            )}
          >
            {t.label} <span className="opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
        <Input
          className="pl-9"
          placeholder="Cerca per nome o cognome"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {studentsQuery.isError && (
        <p className="text-destructive text-sm">
          Errore nel caricamento degli iscritti: {(studentsQuery.error as Error).message}
        </p>
      )}
      {studentsQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento iscritti...</p>
      ) : (
        <SchoolStudentsTable data={visible} onRowClick={(s) => setSelectedId(s.id)} />
      )}

      {creating && <SchoolStudentModal onClose={() => setCreating(false)} />}
      {selected && (
        <SchoolStudentModal key={selected.id} student={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
