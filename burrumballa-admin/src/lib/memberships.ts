import type { IncassoMethod } from "@/lib/paymentMethods"
import type { CardStatus, MembershipInput, SchoolMembership, SchoolStudent } from "@/types/school"

export const CARD_STATUSES: CardStatus[] = ["pagata", "altro_circolo", "da_pagare", "da_fare"]

export const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  pagata: "Fatta e pagata",
  altro_circolo: "Fatta in altro circolo",
  da_pagare: "Fatta, da pagare",
  da_fare: "Da fare",
}

export const CARD_STATUS_HINTS: Record<CardStatus, string> = {
  pagata: "Tesserato con Burrumballa, già incassata",
  altro_circolo: "Ha già la tessera, fatta altrove",
  da_pagare: "Tesserato con Burrumballa, manca il pagamento",
  da_fare: "Ancora senza tessera",
}

export const CARD_STATUS_BADGE_CLASSES: Record<CardStatus, string> = {
  pagata: "border-green-600 bg-green-500/20 text-green-800 dark:text-green-300",
  altro_circolo: "border-sky-300 bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  da_pagare: "border-amber-300 bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  da_fare: "border-dashed text-muted-foreground",
}

/** L'iscritto ha una tessera valida (pagata o meno) per la stagione. */
export function hasCard(status: CardStatus): boolean {
  return status !== "da_fare"
}

export function emptyMembership(season: number): Omit<SchoolMembership, "id" | "student_id"> {
  return {
    season,
    card_status: "da_fare",
    card_number: null,
    card_price: null,
    card_payment_method: null,
    card_paid_at: null,
    fee_paid: false,
    fee_price: null,
    fee_payment_method: null,
    fee_paid_at: null,
  }
}

export function membershipFor(
  student: Pick<SchoolStudent, "memberships">,
  season: number
): SchoolMembership | undefined {
  return student.memberships.find((m) => m.season === season)
}

// Bozza modificabile nella scheda: importi come stringhe del form.
export interface MembershipDraft {
  season: number
  card_status: CardStatus
  card_number: string
  card_price: string
  card_payment_method: IncassoMethod | ""
  card_paid_at: string
  fee_paid: boolean
  fee_price: string
  fee_payment_method: IncassoMethod | ""
  fee_paid_at: string
}

export function membershipToDraft(m: MembershipInput): MembershipDraft {
  return {
    season: m.season,
    card_status: m.card_status,
    card_number: m.card_number ?? "",
    card_price: m.card_price != null ? String(m.card_price) : "",
    card_payment_method: m.card_payment_method ?? "",
    card_paid_at: m.card_paid_at ?? "",
    fee_paid: m.fee_paid,
    fee_price: m.fee_price != null ? String(m.fee_price) : "",
    fee_payment_method: m.fee_payment_method ?? "",
    fee_paid_at: m.fee_paid_at ?? "",
  }
}

export const isPrice = (v: string) => v !== "" && Number(v) >= 0

export function isMembershipDraftValid(d: MembershipDraft): boolean {
  const cardOk =
    d.card_status !== "pagata" ||
    (isPrice(d.card_price) && d.card_payment_method !== "" && !!d.card_paid_at)
  const feeOk = !d.fee_paid || (isPrice(d.fee_price) && d.fee_payment_method !== "" && !!d.fee_paid_at)
  return cardOk && feeOk
}

// I campi di pagamento si azzerano quando lo stato non li prevede (vincoli SQL).
export function draftToMembershipInput(d: MembershipDraft): MembershipInput {
  const cardPaid = d.card_status === "pagata"
  const cardPriced = cardPaid || d.card_status === "da_pagare"
  return {
    season: d.season,
    card_status: d.card_status,
    card_number: d.card_status === "da_fare" ? null : d.card_number.trim() || null,
    card_price: cardPriced && d.card_price !== "" ? Number(d.card_price) : null,
    card_payment_method: cardPaid ? (d.card_payment_method as IncassoMethod) : null,
    card_paid_at: cardPaid ? d.card_paid_at : null,
    fee_paid: d.fee_paid,
    fee_price: d.fee_paid ? Number(d.fee_price) : null,
    fee_payment_method: d.fee_paid ? (d.fee_payment_method as IncassoMethod) : null,
    fee_paid_at: d.fee_paid ? d.fee_paid_at : null,
  }
}
