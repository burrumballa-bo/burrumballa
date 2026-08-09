// Riga della view pubblica `event_options_stato` (vedi supabase/migrations).
export interface EventOptionStato {
  id: string
  tipo: "workshop" | "battle"
  chiave: string
  label: string
  prezzo: number
  max_posti: number | null
  sold_out_manuale: boolean
  attivo: boolean
  ordine: number
  iscritti: number
  sold_out: boolean
}

export type PaymentMethod = "bonifico" | "sul_posto"
