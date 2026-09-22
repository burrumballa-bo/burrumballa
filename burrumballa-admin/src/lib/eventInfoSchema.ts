import { z } from "zod"

export const eventInfoSchema = z.object({
  titolo: z.string().trim().min(1, "Il titolo è obbligatorio."),
  data_evento: z.string().trim(),
  ora_inizio: z.string().trim(),
  ora_fine: z.string().trim(),
  descrizione_iscrizione: z.string().trim(),
  descrizione: z.string().trim(),
  luogo: z.string().trim(),
  testi_informativi: z.string().trim(),
  // Facoltativa: se resta vuota le Edge Functions ricadono sul mittente
  // SMTP configurato nei secret, quindi vale la pena validarla solo
  // quando c'è qualcosa da validare.
  email_mittente: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.string().email().safeParse(value).success,
      "Inserisci un indirizzo email valido."
    ),
  scadenza_iscrizioni: z
    .string()
    .trim()
    .min(1, "La scadenza iscrizioni è obbligatoria."),
})

export type EventInfoFormValues = z.infer<typeof eventInfoSchema>

export const emptyEventInfoFormValues: EventInfoFormValues = {
  titolo: "",
  data_evento: "",
  ora_inizio: "",
  ora_fine: "",
  descrizione_iscrizione: "",
  descrizione: "",
  luogo: "",
  testi_informativi: "",
  email_mittente: "",
  scadenza_iscrizioni: "",
}
