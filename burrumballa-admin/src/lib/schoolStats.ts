import { buildMovimenti, buildPendenti } from "@/lib/incassi"
import { medicalCertStatus } from "@/lib/medicalCert"
import { membershipFor } from "@/lib/memberships"
import { isElectronic } from "@/lib/paymentMethods"
import { seasonRange } from "@/lib/seasons"
import { subscriptionStatus, todayIso } from "@/lib/subscriptions"
import type { CourseWithLevels } from "@/types/cms"
import type { CardStatus, SchoolStudent, SchoolSubscription, SubscriptionKind } from "@/types/school"

const pad = (n: number) => String(n).padStart(2, "0")

/** "YYYY-MM" */
export type MonthKey = string

export function monthKey(dateIso: string): MonthKey {
  return dateIso.slice(0, 7)
}

export function monthRange(month: MonthKey): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number)
  return { from: `${month}-01`, to: `${month}-${pad(new Date(y, m, 0).getDate())}` }
}

/** Gli ultimi `n` mesi fino a quello corrente incluso, dal piu' vecchio. */
export function lastMonths(n: number, today: string = todayIso()): MonthKey[] {
  const [y, m] = today.split("-").map(Number)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(y, m - 1 - (n - 1 - i), 1)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
  })
}

const MONTH_SHORT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"]
const MONTH_LONG = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
]

export function monthShortLabel(month: MonthKey): string {
  const [y, m] = month.split("-").map(Number)
  return m === 1 ? `${MONTH_SHORT[0]} ${String(y).slice(2)}` : MONTH_SHORT[m - 1]
}

export function monthLongLabel(month: MonthKey): string {
  const [y, m] = month.split("-").map(Number)
  return `${MONTH_LONG[m - 1]} ${y}`
}

function addDays(dateIso: string, days: number): string {
  const [y, m, d] = dateIso.split("-").map(Number)
  const date = new Date(y, m - 1, d + days)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// ---- Alunni attivi ---------------------------------------------------------
// Attivo nel mese = abbonamento mensile/trimestrale che copre almeno un
// giorno del mese, oppure almeno un ingresso registrato nel mese con un
// abbonamento a ingressi.

function subActiveInRange(sub: SchoolSubscription, from: string, to: string): boolean {
  if (sub.kind === "entries") return sub.entry_dates.some((d) => d >= from && d <= to)
  return sub.start_date <= to && sub.end_date >= from
}

export function isActiveInMonth(student: SchoolStudent, month: MonthKey): boolean {
  const { from, to } = monthRange(month)
  return student.subscriptions.some((s) => subActiveInRange(s, from, to))
}

export function activeStudents(students: SchoolStudent[], month: MonthKey): SchoolStudent[] {
  return students.filter((s) => isActiveInMonth(s, month))
}

/** Ha un abbonamento in corso o che deve ancora iniziare: e' "della scuola" oggi. */
export function isCurrentStudent(student: SchoolStudent, today: string = todayIso()): boolean {
  return student.subscriptions.some((s) => subscriptionStatus(s, today) !== "expired")
}

export function monthlyActiveCounts(students: SchoolStudent[], months: MonthKey[]) {
  return months.map((month) => ({ month, value: activeStudents(students, month).length }))
}

export function monthlyEntryCounts(students: SchoolStudent[], months: MonthKey[]) {
  const counts = new Map(months.map((m) => [m, 0]))
  for (const s of students)
    for (const sub of s.subscriptions)
      for (const d of sub.entry_dates) {
        const k = monthKey(d)
        if (counts.has(k)) counts.set(k, counts.get(k)! + 1)
      }
  return months.map((month) => ({ month, value: counts.get(month) ?? 0 }))
}

export function monthlyNewStudents(students: SchoolStudent[], months: MonthKey[]) {
  return months.map((month) => ({
    month,
    value: students.filter((s) => monthKey(s.created_at) === month).length,
  }))
}

export function monthlyIncassi(students: SchoolStudent[], months: MonthKey[]) {
  const movimenti = buildMovimenti(students)
  return months.map((month) => {
    let contanti = 0
    let elettronico = 0
    for (const m of movimenti) {
      if (monthKey(m.data) !== month) continue
      if (isElectronic(m.metodo)) elettronico += m.importo
      else contanti += m.importo
    }
    return { month, contanti, elettronico }
  })
}

/** Abbonamenti in corso oggi, per tipo. */
export function currentSubsByKind(students: SchoolStudent[], today: string = todayIso()) {
  const counts: Record<SubscriptionKind, number> = { monthly: 0, quarterly: 0, entries: 0 }
  for (const s of students)
    for (const sub of s.subscriptions) if (subscriptionStatus(sub, today) === "current") counts[sub.kind]++
  return counts
}

/** Alunni attivi nel mese per corso (uno studente conta in ogni corso che frequenta). */
export function activeByCourse(students: SchoolStudent[], courses: CourseWithLevels[], month: MonthKey) {
  const active = activeStudents(students, month)
  return courses
    .filter((c) => c.levels.length > 0)
    .map((course) => {
      const levelIds = new Set(course.levels.map((l) => l.id))
      return {
        course,
        value: active.filter((s) => s.classIds.some((id) => levelIds.has(id))).length,
        total: students.filter((s) => s.classIds.some((id) => levelIds.has(id))).length,
      }
    })
    .sort((a, b) => b.value - a.value)
}

/** Stato tessere della stagione tra gli iscritti attivi nella stagione. */
export function cardStatusCounts(students: SchoolStudent[], season: number, startMonth: number) {
  const { from, to } = seasonRange(season, startMonth)
  const counts: Record<CardStatus, number> = { pagata: 0, altro_circolo: 0, da_pagare: 0, da_fare: 0 }
  for (const s of students) {
    const m = membershipFor(s, season)
    const inSeason = !!m || s.subscriptions.some((sub) => subActiveInRange(sub, from, to))
    if (inSeason) counts[m?.card_status ?? "da_fare"]++
  }
  return counts
}

// ---- Cose da fare ------------------------------------------------------------

export interface TodoItem {
  student: SchoolStudent
  /** Dettaglio breve, es. "scade il 3 novembre". */
  detail: string
  /** Data di riferimento per l'ordinamento. */
  date?: string
}

export interface TodoLists {
  inScadenza: TodoItem[]
  daRinnovare: TodoItem[]
  ingressiFiniti: TodoItem[]
  certificati: TodoItem[]
  tessere: TodoItem[]
  quote: TodoItem[]
  abbonamentiDaPagare: TodoItem[]
}

export const EXPIRY_WARNING_DAYS = 7
export const RENEWAL_LOOKBACK_DAYS = 30

export function buildTodos(
  students: SchoolStudent[],
  opts: { season: number; startMonth: number; defaults: { tessera: number | null; quota: number | null } },
  formatDate: (d: string) => string,
  today: string = todayIso()
): TodoLists {
  const soon = addDays(today, EXPIRY_WARNING_DAYS)
  const recent = addDays(today, -RENEWAL_LOOKBACK_DAYS)
  const lists: TodoLists = {
    inScadenza: [],
    daRinnovare: [],
    ingressiFiniti: [],
    certificati: [],
    tessere: [],
    quote: [],
    abbonamentiDaPagare: [],
  }

  for (const student of students) {
    const subs = student.subscriptions
    const latestEnd = subs.reduce((max, s) => (s.end_date > max ? s.end_date : max), "")
    // Un abbonamento successivo (gia' rinnovato) toglie l'avviso.
    const renewedAfter = (end: string) => subs.some((s) => s.start_date > end)

    for (const sub of subs) {
      const status = subscriptionStatus(sub, today)
      if (status !== "current") continue
      if (sub.kind !== "entries" && sub.end_date <= soon && !renewedAfter(sub.end_date)) {
        lists.inScadenza.push({ student, detail: `scade il ${formatDate(sub.end_date)}`, date: sub.end_date })
      }
      if (sub.kind === "entries" && sub.entries != null && sub.entries - sub.entries_used <= 1 && !renewedAfter(sub.start_date)) {
        const left = sub.entries - sub.entries_used
        lists.ingressiFiniti.push({ student, detail: left === 0 ? "ingressi finiti" : "ultimo ingresso" })
      }
    }

    if (latestEnd && latestEnd < today && latestEnd >= recent) {
      lists.daRinnovare.push({ student, detail: `scaduto il ${formatDate(latestEnd)}`, date: latestEnd })
    }

    const current = isCurrentStudent(student, today)
    if (current) {
      const cert = medicalCertStatus(student.medical_cert_expiry, today)
      if (cert !== "ok") {
        lists.certificati.push({
          student,
          detail:
            cert === "missing"
              ? "manca la scadenza"
              : `${cert === "expired" ? "scaduto il" : "scade il"} ${formatDate(student.medical_cert_expiry!)}`,
          date: student.medical_cert_expiry ?? "",
        })
      }
      const card = membershipFor(student, opts.season)?.card_status ?? "da_fare"
      if (card === "da_fare" || card === "da_pagare") {
        lists.tessere.push({ student, detail: card === "da_fare" ? "da fare" : "da pagare" })
      }
    }
  }

  for (const p of buildPendenti(students, opts.season, opts.startMonth, opts.defaults)) {
    if (p.voce === "quota") lists.quote.push({ student: p.student, detail: "quota non pagata" })
    if (p.voce === "abbonamento") lists.abbonamentiDaPagare.push({ student: p.student, detail: p.descrizione.toLowerCase() })
  }

  lists.inScadenza.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
  lists.daRinnovare.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
  lists.certificati.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
  return lists
}
