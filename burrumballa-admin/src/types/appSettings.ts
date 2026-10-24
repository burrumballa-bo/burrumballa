export interface AppSettings {
  id: number
  /** Destinatario dei messaggi del form contatti del sito, e contatto
   *  pubblico dell'associazione. Il mittente delle email dell'evento è
   *  un'altra cosa e sta su `EventInfo.email_mittente`. */
  email_contatti: string | null
  ricevuta_intestazione: string | null
  ricevuta_indirizzo: string | null
  ricevuta_piva_cf: string | null
  ricevuta_iban: string | null
  ricevuta_note: string | null
  timbro_url: string | null
  /** Mittente delle email non legate a un evento (ricevute scuola/libere). */
  email_mittente_generale: string | null
  presidente_nome: string | null
  /** Path della firma del presidente nel bucket privato "assets". */
  firma_url: string | null
  /** Mese (1..12) di inizio della stagione della scuola. */
  stagione_mese_inizio: number
  prezzo_tessera: number | null
  prezzo_quota_iscrizione: number | null
  updated_at: string
}
