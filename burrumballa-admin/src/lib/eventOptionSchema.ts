import { z } from "zod"

const CHIAVE_PATTERN = /^[a-z0-9_]+$/

// Un solo schema per creazione e modifica: in modifica il campo chiave è
// mostrato disabilitato (precompilato con il valore esistente, sempre
// valido) così il form non deve gestire due tipi diversi.
export const eventOptionSchema = z
  .object({
    chiave: z
      .string()
      .trim()
      .min(1, "La chiave è obbligatoria.")
      .regex(
        CHIAVE_PATTERN,
        "Usa solo lettere minuscole, numeri e underscore (es. waacking_rada)."
      ),
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
    // Rilevanti solo per tipo 'workshop': per 'battle' restano sempre false/[].
    composto: z.boolean(),
    child_ids: z.array(z.string()),
  })
  .refine((v) => !v.composto || v.child_ids.length > 0, {
    message: "Seleziona almeno un workshop da includere nel pacchetto.",
    path: ["child_ids"],
  })

export type EventOptionFormValues = z.infer<typeof eventOptionSchema>
