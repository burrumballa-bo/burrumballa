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
  /** Date ("YYYY-MM-DD") degli ingressi registrati; quelli di prima del registro non ci sono. */
  entry_dates: string[]
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
  tax_code: string | null
  address: string | null
  /** Genitore/tutore: per i minori paga e riceve la ricevuta. */
  guardian_name: string | null
  guardian_tax_code: string | null
  guardian_email: string | null
  guardian_phone: string | null
  medical_cert_expiry: string | null
  privacy_consent: boolean
  photo_consent: boolean
  /** Id delle classi (course_levels) a cui l'iscritto è assegnato. */
  classIds: string[]
  subscriptions: SchoolSubscription[]
  memberships: SchoolMembership[]
}

export type SchoolStudentInput = Omit<
  SchoolStudent,
  "id" | "classIds" | "subscriptions" | "memberships"
>

// entries_used non si scrive mai da qui: lo aggiornano solo le funzioni
// school_use_entry / school_undo_entry (vedi supabase/migrations).
export interface SubscriptionInput {
  kind: SubscriptionKind
  entries: number | null
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
  /** Con id = aggiornamento, senza = nuovo abbonamento. */
  subscriptions: { id?: string; input: SubscriptionInput }[]
  deletedSubscriptionIds: string[]
  /** Stagioni modificate nella scheda: salvate con upsert su (student_id, season). */
  memberships: MembershipInput[]
}
