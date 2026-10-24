import { useMemo, useState } from "react"
import { Search, UserPlus } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAppSettings } from "@/hooks/useAppSettings"
import { useCourses } from "@/hooks/useCourses"
import { useSchoolStudents } from "@/hooks/useSchoolStudents"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { weekdayLabel } from "@/lib/weekdays"
import { medicalCertStatus } from "@/lib/medicalCert"
import { membershipFor } from "@/lib/memberships"
import { currentSeason, seasonLabel } from "@/lib/seasons"
import { SchoolStudentsTable } from "@/components/SchoolStudentsTable"
import { SchoolStudentModal } from "@/components/SchoolStudentModal"
import type { SchoolStudent } from "@/types/school"

const ALL = "tutti"

// Filtri "cose da sistemare" sulla stagione in corso.
type StatusFilter =
  | typeof ALL
  | "tessera_da_fare"
  | "tessera_da_pagare"
  | "quota_da_pagare"
  | "abbonamento_da_pagare"
  | "certificato"

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: ALL, label: "Tutti gli stati" },
  { value: "tessera_da_fare", label: "Tessera da fare" },
  { value: "tessera_da_pagare", label: "Tessera da pagare" },
  { value: "quota_da_pagare", label: "Quota non pagata" },
  { value: "abbonamento_da_pagare", label: "Abbonamento da pagare" },
  { value: "certificato", label: "Certificato scaduto o mancante" },
]

function matchesStatus(s: SchoolStudent, filter: StatusFilter, season: number): boolean {
  const m = membershipFor(s, season)
  switch (filter) {
    case "tessera_da_fare":
      return (m?.card_status ?? "da_fare") === "da_fare"
    case "tessera_da_pagare":
      return m?.card_status === "da_pagare"
    case "quota_da_pagare":
      return !m?.fee_paid
    case "abbonamento_da_pagare":
      return s.subscriptions.some((sub) => sub.payment_method == null)
    case "certificato":
      return medicalCertStatus(s.medical_cert_expiry) !== "ok"
    default:
      return true
  }
}

export default function IscrittiScuolaPage() {
  const studentsQuery = useSchoolStudents()
  const coursesQuery = useCourses()
  const season = currentSeason(useAppSettings().data?.stagione_mese_inizio ?? 9)

  const [tab, setTab] = useState<string>(ALL)
  const [classFilter, setClassFilter] = useState<string>(ALL)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL)
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

  // Classi filtrabili raggruppate per corso: tutti i corsi se "Tutti", altrimenti solo quello scelto.
  const classGroups = useMemo(
    () =>
      courses
        .filter((c) => (tab === ALL || c.id === tab) && c.levels.length > 0)
        .map((c) => ({
          id: c.id,
          name: c.name,
          levels: c.levels.map((l) => ({
            id: l.id,
            label: `${l.level} · ${weekdayLabel(l.day_of_week)}`,
            count: students.filter((s) => s.classIds.includes(l.id)).length,
          })),
        })),
    [courses, tab, students]
  )

  const visible = useMemo(() => {
    let base = tab === ALL ? students : (studentsByCourse.get(tab) ?? [])
    if (classFilter !== ALL) base = base.filter((s) => s.classIds.includes(classFilter))
    if (statusFilter !== ALL) base = base.filter((s) => matchesStatus(s, statusFilter, season))
    const term = search.trim().toLowerCase()
    if (!term) return base
    return base.filter((s) => `${s.first_name} ${s.last_name}`.toLowerCase().includes(term))
  }, [tab, classFilter, statusFilter, season, students, studentsByCourse, search])

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
            onClick={() => {
              setTab(t.id)
              setClassFilter(ALL)
            }}
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
          <Input
            className="pl-9"
            placeholder="Cerca per nome o cognome"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full max-w-60 sm:w-56">
          <Select
            aria-label="Filtra per stato"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
        {classGroups.length > 0 && (
          <div className="w-full max-w-60 sm:w-60">
            <Select
              aria-label="Filtra per classe"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value={ALL}>Tutte le classi</option>
              {classGroups.map((group) =>
                tab === ALL ? (
                  <optgroup key={group.id} label={group.name}>
                    {group.levels.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label} ({l.count})
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  group.levels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label} ({l.count})
                    </option>
                  ))
                )
              )}
            </Select>
          </div>
        )}
      </div>

      {studentsQuery.isError && (
        <p className="text-destructive text-sm">
          Errore nel caricamento degli iscritti: {(studentsQuery.error as Error).message}
        </p>
      )}
      {studentsQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento iscritti...</p>
      ) : (
        <>
          <p className="text-muted-foreground -mb-3 text-xs">
            Tessera e quota si riferiscono alla stagione {seasonLabel(season)}.
          </p>
          <SchoolStudentsTable
            data={visible}
            season={season}
            onRowClick={(s) => setSelectedId(s.id)}
          />
        </>
      )}

      {creating && <SchoolStudentModal onClose={() => setCreating(false)} />}
      {selected && (
        <SchoolStudentModal key={selected.id} student={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
