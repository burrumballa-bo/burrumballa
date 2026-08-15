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
  composto: boolean
  ordine: number
  deleted_at: string | null
  iscritti: number
  sold_out: boolean
  // Chiavi dei workshop componenti, popolate solo quando composto = true.
  composto_di: string[]
}

export interface EventOptionUpdateInput {
  id: string
  label: string
  prezzo: number
  ordine: number
  attivo: boolean
  max_posti: number | null
  sold_out_manuale: boolean
  composto: boolean
  // Id dei workshop componenti (solo per tipo 'workshop'); sincronizzati
  // in event_option_components dopo l'update dell'opzione.
  childIds: string[]
}

export interface EventOptionInsertInput {
  tipo: EventOptionTipo
  chiave: string
  label: string
  prezzo: number
  ordine: number
  attivo: boolean
  max_posti: number | null
  sold_out_manuale: boolean
  composto: boolean
  childIds: string[]
}
