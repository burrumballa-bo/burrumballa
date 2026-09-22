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
  updated_at: string
}
