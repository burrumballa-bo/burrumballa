import type { IncassoMethod } from "@/lib/paymentMethods"

export interface ReceiptItem {
  description: string
  /** null solo nelle ricevute evento con prezzo forfettario. */
  amount: number | null
}

export interface Receipt {
  id: string
  year: number
  number: number
  issued_on: string
  recipient_name: string
  recipient_tax_code: string | null
  recipient_address: string | null
  recipient_email: string | null
  items: ReceiptItem[]
  total: number
  payment_method: IncassoMethod | null
  notes: string | null
  student_id: string | null
  registration_id: string | null
  pdf_path: string | null
  sent_at: string | null
  sent_to: string | null
  cancelled_at: string | null
  created_at: string
}

/** Dati inviati alla Edge Function issue-receipt (il totale lo calcola lei). */
export interface ReceiptDraftInput {
  issued_on: string
  recipient_name: string
  recipient_tax_code: string | null
  recipient_address: string | null
  recipient_email: string | null
  items: { description: string; amount: number }[]
  payment_method: IncassoMethod | null
  notes: string | null
  student_id: string | null
}
