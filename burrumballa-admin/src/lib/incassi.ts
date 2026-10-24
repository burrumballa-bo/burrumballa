import { membershipFor } from "@/lib/memberships"
import { isElectronic, type IncassoMethod } from "@/lib/paymentMethods"
import { seasonRange } from "@/lib/seasons"
import { studentFullName, SUBSCRIPTION_KIND_LABELS, subscriptionValueLabel } from "@/lib/subscriptions"
import type { SchoolStudent } from "@/types/school"

export type VoceIncasso = "abbonamento" | "tessera" | "quota"

export const VOCE_LABELS: Record<VoceIncasso, string> = {
  abbonamento: "Abbonamenti",
  tessera: "Tessere",
  quota: "Quote di iscrizione",
}

/** Un pagamento incassato (abbonamento, tessera o quota). */
export interface Movimento {
  key: string
  student: SchoolStudent
  voce: VoceIncasso
  descrizione: string
  importo: number
  metodo: IncassoMethod
  /** "YYYY-MM-DD" */
  data: string
}

/** Qualcosa che risulta ancora da incassare. importo null = non noto. */
export interface Pendente {
  key: string
  student: SchoolStudent
  voce: VoceIncasso
  descrizione: string
  importo: number | null
}

// I movimenti non dipendono dal periodo: il filtro per data si applica dopo.
export function buildMovimenti(students: SchoolStudent[]): Movimento[] {
  const out: Movimento[] = []
  for (const student of students) {
    for (const sub of student.subscriptions) {
      if (!sub.payment_method || !sub.paid_at) continue
      out.push({
        key: `sub-${sub.id}`,
        student,
        voce: "abbonamento",
        descrizione: `Abbonamento ${SUBSCRIPTION_KIND_LABELS[sub.kind].toLowerCase()} (${subscriptionValueLabel(sub)})`,
        importo: sub.price,
        metodo: sub.payment_method,
        data: sub.paid_at,
      })
    }
    for (const m of student.memberships) {
      if (m.card_status === "pagata" && m.card_payment_method && m.card_paid_at) {
        out.push({
          key: `card-${m.id}`,
          student,
          voce: "tessera",
          descrizione: "Tessera",
          importo: m.card_price ?? 0,
          metodo: m.card_payment_method,
          data: m.card_paid_at,
        })
      }
      if (m.fee_paid && m.fee_payment_method && m.fee_paid_at) {
        out.push({
          key: `fee-${m.id}`,
          student,
          voce: "quota",
          descrizione: "Quota di iscrizione",
          importo: m.fee_price ?? 0,
          metodo: m.fee_payment_method,
          data: m.fee_paid_at,
        })
      }
    }
  }
  return out.sort((a, b) => b.data.localeCompare(a.data))
}

// Da incassare nella stagione: abbonamenti "da pagare", tessere fatte ma
// non pagate e quote mancanti degli iscritti attivi nella stagione (con
// tessera/quota registrate o un abbonamento che cade nella stagione).
export function buildPendenti(
  students: SchoolStudent[],
  season: number,
  startMonth: number,
  defaults: { tessera: number | null; quota: number | null }
): Pendente[] {
  const { from, to } = seasonRange(season, startMonth)
  const out: Pendente[] = []
  for (const student of students) {
    for (const sub of student.subscriptions) {
      if (sub.payment_method) continue
      out.push({
        key: `sub-${sub.id}`,
        student,
        voce: "abbonamento",
        descrizione: `Abbonamento ${SUBSCRIPTION_KIND_LABELS[sub.kind].toLowerCase()}`,
        importo: sub.price,
      })
    }
    const m = membershipFor(student, season)
    if (m?.card_status === "da_pagare") {
      out.push({
        key: `card-${student.id}`,
        student,
        voce: "tessera",
        descrizione: "Tessera",
        importo: m.card_price ?? defaults.tessera,
      })
    }
    const activeInSeason =
      !!m || student.subscriptions.some((s) => s.start_date <= to && s.end_date >= from)
    if (activeInSeason && !m?.fee_paid) {
      out.push({
        key: `fee-${student.id}`,
        student,
        voce: "quota",
        descrizione: "Quota di iscrizione",
        importo: defaults.quota,
      })
    }
  }
  return out.sort((a, b) => studentFullName(a.student).localeCompare(studentFullName(b.student)))
}

export interface RiepilogoIncassi {
  totale: number
  contanti: number
  elettronico: number
  pos: number
  bonifico: number
  perVoce: Record<VoceIncasso, { contanti: number; elettronico: number; totale: number }>
}

export function riepiloga(movimenti: Movimento[]): RiepilogoIncassi {
  const vuoto = () => ({ contanti: 0, elettronico: 0, totale: 0 })
  const r: RiepilogoIncassi = {
    totale: 0,
    contanti: 0,
    elettronico: 0,
    pos: 0,
    bonifico: 0,
    perVoce: { abbonamento: vuoto(), tessera: vuoto(), quota: vuoto() },
  }
  for (const m of movimenti) {
    const voce = r.perVoce[m.voce]
    r.totale += m.importo
    voce.totale += m.importo
    if (isElectronic(m.metodo)) {
      r.elettronico += m.importo
      voce.elettronico += m.importo
      if (m.metodo === "pos") r.pos += m.importo
      else r.bonifico += m.importo
    } else {
      r.contanti += m.importo
      voce.contanti += m.importo
    }
  }
  return r
}
