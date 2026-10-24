import type { IncassoMethod } from "@/lib/paymentMethods"
import type { PaymentMethod, PaymentStatus, Registration } from "@/types/registration"

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "da_pagare", label: "Da pagare" },
  { value: "pagato_bonifico", label: "Pagato bonifico" },
  { value: "pagato_in_loco", label: "Pagato contanti" },
  { value: "pagato_pos", label: "Pagato POS" },
]

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  da_pagare: "Da pagare",
  pagato_bonifico: "Pagato bonifico",
  pagato_in_loco: "Pagato contanti",
  pagato_pos: "Pagato POS",
}

export const PAYMENT_STATUS_BADGE_CLASSES: Record<PaymentStatus, string> = {
  da_pagare:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  pagato_bonifico:
    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  pagato_in_loco:
    "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
  pagato_pos:
    "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30",
}

// Metodo di incasso corrispondente a uno stato pagato (null = da pagare).
export const INCASSO_BY_STATUS: Record<PaymentStatus, IncassoMethod | null> = {
  da_pagare: null,
  pagato_bonifico: "bonifico",
  pagato_in_loco: "contanti",
  pagato_pos: "pos",
}

// Stati "pagato" sensati per ogni metodo scelto in iscrizione: sul posto si
// puo' pagare in contanti o con POS.
export const PAID_STATUSES_BY_METHOD: Record<PaymentMethod, PaymentStatus[]> = {
  bonifico: ["pagato_bonifico"],
  sul_posto: ["pagato_in_loco", "pagato_pos"],
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bonifico: "Bonifico",
  sul_posto: "Sul posto",
}

// Conferma rapida dalla tabella iscritti: il bottone porta allo stato
// "pagato" piu' comune per il metodo (il POS si sceglie dal dettaglio).
export const PAYMENT_CONFIRM_ACTIONS: Record<
  PaymentMethod,
  { status: PaymentStatus; label: string }
> = {
  bonifico: { status: "pagato_bonifico", label: "Conferma bonifico" },
  sul_posto: { status: "pagato_in_loco", label: "Pagato contanti" },
}

// Cifra effettivamente dovuta/incassata: il prezzo amministratore, se
// impostato, sostituisce il totale calcolato dal listino.
export function importoEffettivo(r: Registration): number {
  return r.prezzo_admin ?? r.amount_total
}
