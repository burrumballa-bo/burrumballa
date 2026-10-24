import type { IncassoMethod } from "@/lib/paymentMethods"
import { MAX_SUBSCRIPTION_ENTRIES, suggestedEndDate, todayIso } from "@/lib/subscriptions"
import type { SchoolSubscription, SubscriptionInput, SubscriptionKind } from "@/types/school"

export interface SubscriptionFields {
  kind: SubscriptionKind
  entries: string
  price: string
  start_date: string
  end_date: string
  /** "" = da pagare. */
  payment_method: IncassoMethod | ""
  paid_at: string
}

// Bozza nella scheda iscritto: tutto viene scritto solo al "Salva".
// "new" = appena aggiunta, "edit" = in modifica, "view" = confermata.
// `backup` e' lo stato da ripristinare se la modifica viene annullata.
export interface SubscriptionDraft extends SubscriptionFields {
  key: string
  /** Id su database; assente per gli abbonamenti non ancora salvati. */
  id?: string
  mode: "new" | "edit" | "view"
  backup?: SubscriptionFields
}

let draftCounter = 0
export const newDraftKey = () => `draft-${draftCounter++}`

export function subscriptionToDraft(s: SchoolSubscription): SubscriptionDraft {
  return {
    key: s.id,
    id: s.id,
    mode: "view",
    kind: s.kind,
    entries: s.entries != null ? String(s.entries) : "",
    price: String(s.price),
    start_date: s.start_date,
    end_date: s.end_date,
    payment_method: s.payment_method ?? "",
    paid_at: s.paid_at ?? "",
  }
}

export function emptySubscriptionDraft(): SubscriptionDraft {
  const today = todayIso()
  return {
    key: newDraftKey(),
    mode: "new",
    kind: "monthly",
    entries: "",
    price: "",
    start_date: today,
    end_date: suggestedEndDate("monthly", today),
    payment_method: "",
    paid_at: "",
  }
}

function addDays(dateIso: string, days: number): string {
  const [y, m, d] = dateIso.split("-").map(Number)
  const date = new Date(y, m - 1, d + days)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number)
  const [y2, m2, d2] = to.split("-").map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000)
}

/**
 * Rinnovo: stesso tipo, prezzo e ingressi. Mensile/trimestrale ripartono
 * dal giorno dopo la scadenza (o da oggi se e' gia' scaduto da tempo);
 * gli ingressi ripartono da oggi con la stessa durata.
 */
export function renewalDraft(from: SubscriptionFields): SubscriptionDraft {
  const today = todayIso()
  const start =
    from.kind === "entries" ? today : [addDays(from.end_date, 1), today].sort().reverse()[0]
  const end =
    from.kind === "entries"
      ? addDays(start, Math.max(daysBetween(from.start_date, from.end_date), 0))
      : suggestedEndDate(from.kind, start)
  return {
    key: newDraftKey(),
    mode: "new",
    kind: from.kind,
    entries: from.entries,
    price: from.price,
    start_date: start,
    end_date: end,
    payment_method: "",
    paid_at: "",
  }
}

export function isSubscriptionValid(s: SubscriptionFields, entriesUsed = 0): boolean {
  const entries = Number(s.entries)
  return (
    s.price !== "" &&
    Number(s.price) >= 0 &&
    !!s.start_date &&
    !!s.end_date &&
    s.end_date >= s.start_date &&
    (s.payment_method === "" || !!s.paid_at) &&
    (s.kind !== "entries" ||
      (Number.isInteger(entries) &&
        entries >= 1 &&
        entries <= MAX_SUBSCRIPTION_ENTRIES &&
        entriesUsed <= entries))
  )
}

export function draftToSubscriptionInput(s: SubscriptionFields): SubscriptionInput {
  return {
    kind: s.kind,
    entries: s.kind === "entries" ? Number(s.entries) : null,
    price: Number(s.price),
    start_date: s.start_date,
    end_date: s.end_date,
    payment_method: s.payment_method || null,
    paid_at: s.payment_method ? s.paid_at : null,
  }
}

export function pickFields(s: SubscriptionFields): SubscriptionFields {
  return {
    kind: s.kind,
    entries: s.entries,
    price: s.price,
    start_date: s.start_date,
    end_date: s.end_date,
    payment_method: s.payment_method,
    paid_at: s.paid_at,
  }
}
