import type { PaymentMethod, PaymentStatus } from "@/types/registration"

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "da_pagare", label: "Da pagare" },
  { value: "pagato_bonifico", label: "Pagato bonifico" },
  { value: "pagato_in_loco", label: "Pagato in loco" },
]

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  da_pagare: "Da pagare",
  pagato_bonifico: "Pagato bonifico",
  pagato_in_loco: "Pagato in loco",
}

export const PAYMENT_STATUS_BADGE_CLASSES: Record<PaymentStatus, string> = {
  da_pagare:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  pagato_bonifico:
    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  pagato_in_loco:
    "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bonifico: "Bonifico",
  sul_posto: "Sul posto",
}
