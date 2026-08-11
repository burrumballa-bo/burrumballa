import { z } from "zod"

export const eventPersonSchema = z.object({
  categoria: z.enum(["giuria", "host_dj"]),
  nome: z.string().trim().min(1, "Il nome è obbligatorio."),
  ruolo: z.string().trim(),
  immagine_path: z.string().trim(),
  colore: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^#[0-9a-fA-F]{6}$/.test(v),
      "Inserisci un colore esadecimale valido (es. #d6249f) o lascia vuoto."
    ),
  ordine: z
    .string()
    .trim()
    .min(1, "L'ordine è obbligatorio.")
    .refine(
      (v) => Number.isInteger(Number(v)),
      "L'ordine deve essere un numero intero."
    ),
  attivo: z.boolean(),
})

export type EventPersonFormValues = z.infer<typeof eventPersonSchema>

export const emptyEventPersonFormValues: EventPersonFormValues = {
  categoria: "giuria",
  nome: "",
  ruolo: "",
  immagine_path: "",
  colore: "",
  ordine: "0",
  attivo: true,
}
