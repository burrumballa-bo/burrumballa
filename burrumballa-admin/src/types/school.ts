import type { IncassoMethod } from "@/lib/paymentMethods"

export type SubscriptionKind = "monthly" | "quarterly" | "entries"

export interface SchoolSubscription {
  id: string
  student_id: string
  kind: SubscriptionKind
  /** Numero di ingressi (1..10), solo per kind = "entries". */
  entries: number | null
  /** Ingressi gia' effettuati (0..entries). */
  entries_used: number
  price: number
  start_date: string
  end_date: string
  /** null = ancora da pagare. */
  payment_method: IncassoMethod | null
  paid_at: string | null
}

/** Stato della tessera nella stagione. */
export type CardStatus = "pagata" | "altro_circolo" | "da_pagare" | "da_fare"

/** Tessera e quota di iscrizione di un iscritto per una stagione. */
export interface SchoolMembership {
  id: string
  student_id: string
  /** Anno di inizio stagione (2026 = 2026/27). */
  season: number
  card_status: CardStatus
  card_number: string | null
  card_price: number | null
  card_payment_method: IncassoMethod | null
  card_paid_at: string | null
  fee_paid: boolean
  fee_price: number | null
  fee_payment_method: IncassoMethod | null
  fee_paid_at: string | null
}

export type MembershipInput = Omit<SchoolMembership, "id" | "student_id">

export interface SchoolStudent {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  birth_date: string | null
  notes: string | null
  /** Id delle classi (course_levels) a cui l'iscritto è assegnato. */
  classIds: string[]
  subscriptions: SchoolSubscription[]
  memberships: SchoolMembership[]
}

export interface SchoolStudentInput {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  birth_date: string | null
  notes: string | null
}

export interface SubscriptionInput {
  kind: SubscriptionKind
  entries: number | null
  entries_used: number
  price: number
  start_date: string
  end_date: string
  payment_method: IncassoMethod | null
  paid_at: string | null
}

export interface SchoolStudentSaveInput {
  id?: string
  student: SchoolStudentInput
  classIds: string[]
  subscriptions: SubscriptionInput[]
  /** Stagioni modificate nella scheda: salvate con upsert su (student_id, season). */
  memberships: MembershipInput[]
}
