export type EventOptionTipo = "workshop" | "battle"

// Riga della view `event_options_stato` (vedi supabase/migrations).
export interface EventOptionStato {
  id: string
  tipo: EventOptionTipo
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

export interface EventOptionUpdateInput {
  id: string
  label: string
  prezzo: number
  ordine: number
  attivo: boolean
  max_posti: number | null
  sold_out_manuale: boolean
}
