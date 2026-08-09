import { z } from "zod"

export const eventInfoSchema = z.object({
  titolo: z.string().trim().min(1, "Il titolo è obbligatorio."),
  data_evento: z.string().trim(),
  descrizione: z.string().trim(),
  testi_informativi: z.string().trim(),
  scadenza_iscrizioni: z
    .string()
    .trim()
    .min(1, "La scadenza iscrizioni è obbligatoria."),
})

export type EventInfoFormValues = z.infer<typeof eventInfoSchema>

export const emptyEventInfoFormValues: EventInfoFormValues = {
  titolo: "",
  data_evento: "",
  descrizione: "",
  testi_informativi: "",
  scadenza_iscrizioni: "",
}
