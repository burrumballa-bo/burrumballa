import { z } from "zod"

export const appSettingsSchema = z.object({
  email_mittente: z
    .string()
    .trim()
    .min(1, "L'email mittente è obbligatoria.")
    .email("Inserisci un indirizzo email valido."),
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
})

export type AppSettingsFormValues = z.infer<typeof appSettingsSchema>

export const emptyAppSettingsFormValues: AppSettingsFormValues = {
  email_mittente: "",
  ricevuta_intestazione: "",
  ricevuta_indirizzo: "",
  ricevuta_piva_cf: "",
  ricevuta_iban: "",
  ricevuta_note: "",
}
