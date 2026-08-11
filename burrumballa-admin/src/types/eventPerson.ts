export type EventPersonCategoria = "giuria" | "host_dj"

// Riga della tabella `event_people` (vedi supabase/migrations).
export interface EventPerson {
  id: string
  categoria: EventPersonCategoria
  nome: string
  ruolo: string | null
  immagine_path: string | null
  colore: string | null
  ordine: number
  attivo: boolean
  created_at: string
}

export interface EventPersonInsertInput {
  categoria: EventPersonCategoria
  nome: string
  ruolo: string | null
  immagine_path: string | null
  colore: string | null
  ordine: number
  attivo: boolean
}

export interface EventPersonUpdateInput extends EventPersonInsertInput {
  id: string
}
