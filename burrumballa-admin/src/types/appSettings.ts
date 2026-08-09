export interface AppSettings {
  id: number
  email_mittente: string | null
  ricevuta_intestazione: string | null
  ricevuta_indirizzo: string | null
  ricevuta_piva_cf: string | null
  ricevuta_iban: string | null
  ricevuta_note: string | null
  timbro_url: string | null
  updated_at: string
}
