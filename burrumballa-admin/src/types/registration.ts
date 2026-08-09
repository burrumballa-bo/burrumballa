export type PaymentMethod = "bonifico" | "sul_posto"
export type PaymentStatus = "da_pagare" | "pagato_bonifico" | "pagato_in_loco"

export interface Registration {
  id: string
  created_at: string
  nome: string
  cognome: string
  aka: string | null
  aka_partner_2vs2: string | null
  email: string
  workshop: string | null
  battle_categories: string[]
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  amount_workshop: number
  amount_battle: number
  surcharge_late: number
  surcharge_onsite: number
  amount_total: number
  consenso_immagini: boolean
  note_admin: string | null
  email_conferma_bonifico_inviata_at: string | null
}

export interface EventOption {
  chiave: string
  label: string
  tipo: "workshop" | "battle"
}
