import { useMemo } from "react"
import { useNavigate } from "react-router-dom"

import { useAppSettings } from "@/hooks/useAppSettings"
import { useCourses } from "@/hooks/useCourses"
import { useSchoolStudents } from "@/hooks/useSchoolStudents"
import { formatCurrency } from "@/lib/format"
import { CARD_STATUSES, CARD_STATUS_LABELS } from "@/lib/memberships"
import {
  activeByCourse,
  activeStudents,
  cardStatusCounts,
  currentSubsByKind,
  isCurrentStudent,
  lastMonths,
  monthLongLabel,
  monthShortLabel,
  monthlyActiveCounts,
  monthlyEntryCounts,
  monthlyIncassi,
  monthlyNewStudents,
} from "@/lib/schoolStats"
import { currentSeason, seasonLabel } from "@/lib/seasons"
import { SUBSCRIPTION_KIND_LABELS } from "@/lib/subscriptions"
import { StatTile } from "@/components/StatTile"
import { BarList } from "@/components/charts/BarList"
import { ChartCard } from "@/components/charts/ChartCard"
import { ColumnChart } from "@/components/charts/ColumnChart"
import type { SubscriptionKind } from "@/types/school"

const MONTHS = 12

// Asse in euro compatto: 0 / 500 / 1K / 1,5K.
function compactEuro(v: number): string {
  return v >= 1000
    ? `${(v / 1000).toLocaleString("it-IT", { maximumFractionDigits: 1 })}K`
    : String(v)
}

export default function GestioneCorsiPage() {
  const navigate = useNavigate()
  const studentsQuery = useSchoolStudents()
  const coursesQuery = useCourses()
  const settings = useAppSettings().data
  const startMonth = settings?.stagione_mese_inizio ?? 9
  const season = currentSeason(startMonth)

  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data])
  const courses = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data])

  const months = useMemo(() => lastMonths(MONTHS), [])
  const thisMonth = months[months.length - 1]
  const prevMonth = months[months.length - 2]

  const stats = useMemo(() => {
    const active = monthlyActiveCounts(students, months)
    const entries = monthlyEntryCounts(students, months)
    const nuovi = monthlyNewStudents(students, months)
    const incassi = monthlyIncassi(students, months)
    return {
      active,
      entries,
      nuovi,
      incassi,
      current: students.filter((s) => isCurrentStudent(s)).length,
      activeNow: activeStudents(students, thisMonth).length,
      activePrev: activeStudents(students, prevMonth).length,
      byKind: currentSubsByKind(students),
      byCourse: activeByCourse(students, courses, thisMonth),
      cards: cardStatusCounts(students, season, startMonth),
    }
  }, [students, courses, months, thisMonth, prevMonth, season, startMonth])

  if (studentsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-6 md:p-8">
        <p className="text-muted-foreground text-sm">Caricamento panoramica...</p>
      </div>
    )
  }

  const incassoMese = stats.incassi[stats.incassi.length - 1]
  const at = (list: { value: number }[]) => list[list.length - 1]?.value ?? 0
  const kinds = Object.keys(SUBSCRIPTION_KIND_LABELS) as SubscriptionKind[]

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Scuola</h1>
        <p className="text-muted-foreground text-sm">
          Panoramica di {monthLongLabel(thisMonth)} · stagione {seasonLabel(season)}
        </p>
      </div>

      {studentsQuery.isError && (
        <p className="text-destructive text-sm">
          Errore nel caricamento: {(studentsQuery.error as Error).message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile
          label="Alunni attivi nel mese"
          value={String(stats.activeNow)}
          delta={{ value: stats.activeNow - stats.activePrev, label: "rispetto al mese scorso" }}
          onClick={() => navigate("/admin/corsi/iscritti")}
        />
        <StatTile
          label="Iscritti in archivio"
          value={String(students.length)}
          hint={`${stats.current} con abbonamento in corso o futuro`}
          onClick={() => navigate("/admin/corsi/iscritti")}
        />
        <StatTile label="Nuovi iscritti nel mese" value={String(at(stats.nuovi))} />
        <StatTile label="Ingressi nel mese" value={String(at(stats.entries))} hint="abbonamenti a ingressi" />
        <StatTile
          label="Incassato nel mese"
          value={formatCurrency(incassoMese.contanti + incassoMese.elettronico)}
          hint={`Contanti ${formatCurrency(incassoMese.contanti)} · Elettronico ${formatCurrency(incassoMese.elettronico)}`}
          onClick={() => navigate("/admin/corsi/incassi")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Alunni attivi per mese"
          description="Con un abbonamento mensile o trimestrale nel mese, o almeno un ingresso registrato."
          table={{
            columns: ["Mese", "Alunni attivi"],
            rows: stats.active.map((d) => [monthLongLabel(d.month), d.value]),
          }}
        >
          <ColumnChart
            ariaLabel="Alunni attivi negli ultimi 12 mesi"
            series={[{ name: "Alunni attivi", color: "var(--chart-1)" }]}
            data={stats.active.map((d) => ({
              label: monthShortLabel(d.month),
              tooltipLabel: monthLongLabel(d.month),
              values: [d.value],
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Incassi per mese"
          description="Abbonamenti, tessere e quote, per data di pagamento."
          table={{
            columns: ["Mese", "Contanti", "Elettronico", "Totale"],
            rows: stats.incassi.map((d) => [
              monthLongLabel(d.month),
              formatCurrency(d.contanti),
              formatCurrency(d.elettronico),
              formatCurrency(d.contanti + d.elettronico),
            ]),
          }}
        >
          <ColumnChart
            ariaLabel="Incassi negli ultimi 12 mesi, contanti ed elettronico"
            series={[
              { name: "Contanti", color: "var(--chart-1)" },
              { name: "Elettronico (POS + bonifico)", color: "var(--chart-2)" },
            ]}
            formatValue={formatCurrency}
            formatTick={compactEuro}
            data={stats.incassi.map((d) => ({
              label: monthShortLabel(d.month),
              tooltipLabel: monthLongLabel(d.month),
              values: [d.contanti, d.elettronico],
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Alunni attivi per corso"
          description={`${monthLongLabel(thisMonth)}. Chi frequenta più corsi conta in ognuno.`}
          table={{
            columns: ["Corso", "Attivi nel mese", "Iscritti al corso"],
            rows: stats.byCourse.map((c) => [c.course.name, c.value, c.total]),
          }}
        >
          <BarList
            ariaLabel="Alunni attivi per corso"
            items={stats.byCourse.map((c) => ({
              key: c.course.id,
              label: c.course.name,
              value: c.value,
              hint: `su ${c.total} iscritti al corso`,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Abbonamenti in corso per tipo"
          description="Abbonamenti validi oggi."
          table={{
            columns: ["Tipo", "Abbonamenti"],
            rows: kinds.map((k) => [SUBSCRIPTION_KIND_LABELS[k], stats.byKind[k]]),
          }}
        >
          <BarList
            ariaLabel="Abbonamenti in corso per tipo"
            items={kinds.map((k) => ({ key: k, label: SUBSCRIPTION_KIND_LABELS[k], value: stats.byKind[k] }))}
          />
        </ChartCard>

        <ChartCard
          title={`Tessere stagione ${seasonLabel(season)}`}
          description="Iscritti attivi nella stagione."
          table={{
            columns: ["Stato", "Iscritti"],
            rows: CARD_STATUSES.map((s) => [CARD_STATUS_LABELS[s], stats.cards[s]]),
          }}
        >
          <BarList
            ariaLabel="Stato delle tessere"
            items={CARD_STATUSES.map((s) => ({ key: s, label: CARD_STATUS_LABELS[s], value: stats.cards[s] }))}
          />
        </ChartCard>

        <ChartCard
          title="Ingressi per mese"
          description="Ingressi registrati sugli abbonamenti a ingressi (dal registro con data)."
          table={{
            columns: ["Mese", "Ingressi", "Nuovi iscritti"],
            rows: stats.entries.map((d, i) => [monthLongLabel(d.month), d.value, stats.nuovi[i].value]),
          }}
        >
          <ColumnChart
            ariaLabel="Ingressi negli ultimi 12 mesi"
            series={[{ name: "Ingressi", color: "var(--chart-1)" }]}
            data={stats.entries.map((d) => ({
              label: monthShortLabel(d.month),
              tooltipLabel: monthLongLabel(d.month),
              values: [d.value],
            }))}
          />
        </ChartCard>
      </div>
    </div>
  )
}
