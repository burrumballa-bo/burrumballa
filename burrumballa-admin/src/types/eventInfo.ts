export interface EventInfo {
  id: number
  titolo: string
  data_evento: string | null
  ora_inizio: string | null
  ora_fine: string | null
  descrizione_iscrizione: string | null
  descrizione: string | null
  luogo: string | null
  testi_informativi: string | null
  scadenza_iscrizioni: string
  nota_battle: string | null
  nota_workshop: string | null
  nota_pagamento: string | null
  updated_at: string
}
