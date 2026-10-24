import { todayIso } from "@/lib/subscriptions"

export type MedicalCertStatus = "missing" | "expired" | "expiring" | "ok"

/** Giorni prima della scadenza in cui il certificato risulta "in scadenza". */
export const CERT_WARNING_DAYS = 30

export function medicalCertStatus(expiry: string | null, today: string = todayIso()): MedicalCertStatus {
  if (!expiry) return "missing"
  if (expiry < today) return "expired"
  const [y, m, d] = today.split("-").map(Number)
  const limit = new Date(y, m - 1, d + CERT_WARNING_DAYS)
  const pad = (n: number) => String(n).padStart(2, "0")
  const limitIso = `${limit.getFullYear()}-${pad(limit.getMonth() + 1)}-${pad(limit.getDate())}`
  return expiry <= limitIso ? "expiring" : "ok"
}

export const MEDICAL_CERT_LABELS: Record<MedicalCertStatus, string> = {
  missing: "Certificato mancante",
  expired: "Certificato scaduto",
  expiring: "Certificato in scadenza",
  ok: "Certificato valido",
}

export const MEDICAL_CERT_BADGE_CLASSES: Record<MedicalCertStatus, string> = {
  missing: "border-dashed text-muted-foreground",
  expired: "border-red-300 bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  expiring: "border-amber-300 bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  ok: "border-green-600 bg-green-500/20 text-green-800 dark:text-green-300",
}
