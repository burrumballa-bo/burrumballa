export interface EventInfo {
  id: number
  /** Indirizzo della pagina pubblica: /eventi/<slug>. */
  slug: string
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
  /** Visibile sul sito. */
  pubblicato: boolean
  iscrizioni_aperte: boolean
  /** Es. "Bologna · Italy", sotto la data nell'hero. */
  citta: string | null
  colore_primario: string
  colore_secondario: string
  /** Path nel bucket privato "assets". */
  immagine_copertina: string | null
  immagine_cornice: string | null
  immagine_logo: string | null
  /** Prezzo battle per numero di categorie: [1 categoria, 2, 3, ...]. */
  battle_prezzi: number[]
  maggiorazione_ritardo: number
  maggiorazione_sul_posto: number
  created_at: string
  updated_at: string
}

export type EventInfoPatch = Partial<Omit<EventInfo, "id" | "created_at" | "updated_at">>
