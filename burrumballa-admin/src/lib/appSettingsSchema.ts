import { z } from "zod"

// Importo facoltativo come stringa del form: "" = non impostato.
const optionalPrice = z
  .string()
  .trim()
  .refine((value) => value === "" || Number(value) >= 0, "Inserisci un importo valido.")

export const appSettingsSchema = z.object({
  email_contatti: z
    .string()
    .trim()
    .min(1, "L'email contatti è obbligatoria.")
    .email("Inserisci un indirizzo email valido."),
  email_mittente_generale: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Inserisci un indirizzo email valido."
    ),
  ricevuta_intestazione: z
    .string()
    .trim()
    .min(1, "L'intestazione è obbligatoria."),
  ricevuta_indirizzo: z.string().trim(),
  ricevuta_piva_cf: z.string().trim(),
  ricevuta_iban: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^[A-Z0-9]{15,34}$/i.test(value.replace(/\s+/g, "")),
      "Formato IBAN non valido."
    ),
  ricevuta_note: z.string().trim(),
  presidente_nome: z.string().trim(),
  stagione_mese_inizio: z.string().regex(/^([1-9]|1[0-2])$/, "Scegli un mese."),
  prezzo_tessera: optionalPrice,
  prezzo_quota_iscrizione: optionalPrice,
})

export type AppSettingsFormValues = z.infer<typeof appSettingsSchema>

export const emptyAppSettingsFormValues: AppSettingsFormValues = {
  email_contatti: "",
  email_mittente_generale: "",
  ricevuta_intestazione: "",
  ricevuta_indirizzo: "",
  ricevuta_piva_cf: "",
  ricevuta_iban: "",
  ricevuta_note: "",
  presidente_nome: "",
  stagione_mese_inizio: "9",
  prezzo_tessera: "",
  prezzo_quota_iscrizione: "",
}
