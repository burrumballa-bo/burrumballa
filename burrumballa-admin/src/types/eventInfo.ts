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
  /** Mittente delle email dell'evento (conferma iscrizione, ricevuta di
   *  pagamento). Vuoto = si usa il mittente SMTP di default. */
  email_mittente: string | null
  scadenza_iscrizioni: string
  nota_battle: string | null
  nota_workshop: string | null
  nota_pagamento: string | null
  /** Se false il form pubblico non propone il bonifico: ci si iscrive
   *  comunque e si paga di persona all'evento. */
  bonifico_attivo: boolean
  updated_at: string
}
