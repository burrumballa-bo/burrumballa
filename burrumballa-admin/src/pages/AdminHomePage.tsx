import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlarmClock,
  BadgeEuro,
  CalendarX2,
  CircleCheck,
  FilePlus2,
  HeartPulse,
  IdCard,
  RefreshCw,
  Ticket,
  UserPlus,
  type LucideIcon,
} from "lucide-react"

import { useAppSettings } from "@/hooks/useAppSettings"
import { useSchoolStudents } from "@/hooks/useSchoolStudents"
import { formatDateOnly } from "@/lib/datetime"
import { formatCurrency } from "@/lib/format"
import { buildPendenti } from "@/lib/incassi"
import {
  EXPIRY_WARNING_DAYS,
  activeStudents,
  buildTodos,
  lastMonths,
  monthLongLabel,
  monthlyIncassi,
  type TodoItem,
} from "@/lib/schoolStats"
import { currentSeason, seasonLabel } from "@/lib/seasons"
import { studentFullName, todayIso } from "@/lib/subscriptions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReceiptModal } from "@/components/ReceiptModal"
import { SchoolStudentModal } from "@/components/SchoolStudentModal"
import { StatTile } from "@/components/StatTile"

type StudentTab = "anagrafica" | "abbonamenti" | "tessera"

const MAX_ROWS = 6

function TodoCard({
  title,
  icon: Icon,
  items,
  onOpen,
  empty,
}: {
  title: string
  icon: LucideIcon
  items: TodoItem[]
  onOpen: (item: TodoItem) => void
  empty: string
}) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? items : items.slice(0, MAX_ROWS)
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="text-muted-foreground size-4" aria-hidden />
          {title}
        </CardTitle>
        <span
          className={
            items.length > 0
              ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 tabular-nums dark:bg-amber-500/15 dark:text-amber-300"
              : "text-muted-foreground text-xs"
          }
        >
          {items.length}
        </span>
      </CardHeader>
      <CardContent className="px-4">
        {items.length === 0 ? (
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <CircleCheck className="size-3.5 text-green-600" aria-hidden />
            {empty}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {shown.map((item, i) => (
              <li key={`${item.student.id}-${i}`}>
                <button
                  type="button"
                  onClick={() => onOpen(item)}
                  className="hover:bg-accent flex w-full items-baseline justify-between gap-3 rounded px-1.5 py-1 text-left text-sm"
                >
                  <span className="truncate">{studentFullName(item.student)}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">{item.detail}</span>
                </button>
              </li>
            ))}
            {items.length > MAX_ROWS && (
              <li>
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="text-muted-foreground hover:text-foreground px-1.5 py-1 text-xs"
                >
                  {expanded ? "Mostra meno" : `Mostra tutti (${items.length})`}
                </button>
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminHomePage() {
  const navigate = useNavigate()
  const studentsQuery = useSchoolStudents()
  const settings = useAppSettings().data
  const startMonth = settings?.stagione_mese_inizio ?? 9
  const season = currentSeason(startMonth)

  const [opened, setOpened] = useState<{ id: string; tab: StudentTab } | null>(null)
  const [creating, setCreating] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)

  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data])
  const defaults = useMemo(
    () => ({ tessera: settings?.prezzo_tessera ?? null, quota: settings?.prezzo_quota_iscrizione ?? null }),
    [settings]
  )

  const thisMonth = lastMonths(1)[0]
  const todos = useMemo(
    () => buildTodos(students, { season, startMonth, defaults }, formatDateOnly),
    [students, season, startMonth, defaults]
  )
  const activeNow = useMemo(() => activeStudents(students, thisMonth).length, [students, thisMonth])
  const incassoMese = useMemo(() => monthlyIncassi(students, [thisMonth])[0], [students, thisMonth])
  const daIncassare = useMemo(
    () =>
      buildPendenti(students, season, startMonth, defaults).reduce((s, p) => s + (p.importo ?? 0), 0),
    [students, season, startMonth, defaults]
  )

  const selected = opened ? students.find((s) => s.id === opened.id) : undefined
  const open = (tab: StudentTab) => (item: TodoItem) => setOpened({ id: item.student.id, tab })

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Home</h1>
          <p className="text-muted-foreground text-sm">
            Cosa c&apos;è da fare oggi, {formatDateOnly(todayIso())}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreating(true)}>
            <UserPlus />
            Nuovo iscritto
          </Button>
          <Button variant="outline" onClick={() => setReceiptOpen(true)}>
            <FilePlus2 />
            Nuova ricevuta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label={`Alunni attivi a ${monthLongLabel(thisMonth).split(" ")[0]}`}
          value={String(activeNow)}
          onClick={() => navigate("/admin/corsi")}
        />
        <StatTile
          label="Incassato nel mese"
          value={formatCurrency(incassoMese.contanti + incassoMese.elettronico)}
          hint={`Contanti ${formatCurrency(incassoMese.contanti)} · Elettronico ${formatCurrency(incassoMese.elettronico)}`}
          onClick={() => navigate("/admin/corsi/incassi")}
        />
        <StatTile
          label={`Da incassare (${seasonLabel(season)})`}
          value={formatCurrency(daIncassare)}
          onClick={() => navigate("/admin/corsi/incassi")}
        />
        <StatTile
          label="Abbonamenti da rinnovare"
          value={String(todos.inScadenza.length + todos.daRinnovare.length + todos.ingressiFiniti.length)}
          hint={`in scadenza entro ${EXPIRY_WARNING_DAYS} giorni o scaduti da poco`}
        />
      </div>

      {studentsQuery.isError && (
        <p className="text-destructive text-sm">
          Errore nel caricamento degli iscritti: {(studentsQuery.error as Error).message}
        </p>
      )}

      {studentsQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TodoCard
            title={`In scadenza nei prossimi ${EXPIRY_WARNING_DAYS} giorni`}
            icon={AlarmClock}
            items={todos.inScadenza}
            onOpen={open("abbonamenti")}
            empty="Nessun abbonamento in scadenza."
          />
          <TodoCard
            title="Scaduti da rinnovare"
            icon={RefreshCw}
            items={todos.daRinnovare}
            onOpen={open("abbonamenti")}
            empty="Nessun abbonamento scaduto di recente."
          />
          <TodoCard
            title="Ingressi finiti o all'ultimo"
            icon={Ticket}
            items={todos.ingressiFiniti}
            onOpen={open("abbonamenti")}
            empty="Nessun abbonamento a ingressi in esaurimento."
          />
          <TodoCard
            title="Certificati medici"
            icon={HeartPulse}
            items={todos.certificati}
            onOpen={open("anagrafica")}
            empty="Tutti i certificati sono validi."
          />
          <TodoCard
            title={`Tessere ${seasonLabel(season)}`}
            icon={IdCard}
            items={todos.tessere}
            onOpen={open("tessera")}
            empty="Tutte le tessere sono a posto."
          />
          <TodoCard
            title="Quote di iscrizione non pagate"
            icon={BadgeEuro}
            items={todos.quote}
            onOpen={open("tessera")}
            empty="Tutte le quote sono pagate."
          />
          <TodoCard
            title="Abbonamenti da pagare"
            icon={CalendarX2}
            items={todos.abbonamentiDaPagare}
            onOpen={open("abbonamenti")}
            empty="Nessun abbonamento da pagare."
          />
        </div>
      )}

      {creating && <SchoolStudentModal onClose={() => setCreating(false)} />}
      {selected && opened && (
        <SchoolStudentModal
          key={selected.id}
          student={selected}
          initialTab={opened.tab}
          onClose={() => setOpened(null)}
        />
      )}
      {receiptOpen && <ReceiptModal onClose={() => setReceiptOpen(false)} />}
    </div>
  )
}
