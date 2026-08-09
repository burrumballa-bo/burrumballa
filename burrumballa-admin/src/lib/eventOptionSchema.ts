import { z } from "zod"

export const eventOptionSchema = z.object({
  label: z.string().trim().min(1, "L'etichetta è obbligatoria."),
  prezzo: z
    .string()
    .trim()
    .min(1, "Il prezzo è obbligatorio.")
    .refine(
      (v) => !Number.isNaN(Number(v)) && Number(v) >= 0,
      "Inserisci un prezzo valido (>= 0)."
    ),
  ordine: z
    .string()
    .trim()
    .min(1, "L'ordine è obbligatorio.")
    .refine(
      (v) => Number.isInteger(Number(v)),
      "L'ordine deve essere un numero intero."
    ),
  max_posti: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (Number.isInteger(Number(v)) && Number(v) > 0),
      "Inserisci un numero intero positivo, oppure lascia vuoto per illimitato."
    ),
  attivo: z.boolean(),
  sold_out_manuale: z.boolean(),
})

export type EventOptionFormValues = z.infer<typeof eventOptionSchema>
