import type { SchoolStudent, SchoolSubscription } from "@/types/school"

export type SubscriptionStatus = "current" | "future" | "expired"

export function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Le date sono "YYYY-MM-DD": il confronto tra stringhe è corretto
// ed evita scarti di fuso orario. Estremi inclusi.
export function subscriptionStatus(
  sub: { start_date: string; end_date: string },
  today: string = todayIso()
): SubscriptionStatus {
  if (sub.end_date < today) return "expired"
  if (sub.start_date > today) return "future"
  return "current"
}

export const SUBSCRIPTION_BOX_CLASSES: Record<SubscriptionStatus, string> = {
  current: "border-green-600 bg-green-500/25",
  future: "border-green-300 bg-green-100 dark:border-green-800 dark:bg-green-950/40",
  expired: "border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800/50",
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  current: "Attivo",
  future: "Non ancora attivo",
  expired: "Scaduto",
}

/** Stato complessivo dell'iscritto: attivo > futuro > scaduto > nessuno. */
export type StudentSubscriptionState = SubscriptionStatus | "none"

export function studentSubscriptionState(
  subs: SchoolSubscription[],
  today: string = todayIso()
): StudentSubscriptionState {
  if (subs.length === 0) return "none"
  const statuses = subs.map((s) => subscriptionStatus(s, today))
  if (statuses.includes("current")) return "current"
  if (statuses.includes("future")) return "future"
  return "expired"
}

export const STUDENT_STATE_LABELS: Record<StudentSubscriptionState, string> = {
  ...SUBSCRIPTION_STATUS_LABELS,
  none: "Nessun abbonamento",
}

export const STUDENT_STATE_BADGE_CLASSES: Record<StudentSubscriptionState, string> = {
  current: "border-green-600 bg-green-500/20 text-green-800 dark:text-green-300",
  future: "border-green-300 bg-green-100 text-green-700 dark:text-green-300",
  expired: "border-gray-300 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  none: "border-dashed text-muted-foreground",
}

export function studentFullName(s: Pick<SchoolStudent, "first_name" | "last_name">): string {
  return `${s.first_name} ${s.last_name}`.trim()
}
