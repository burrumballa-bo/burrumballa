import { z } from "zod"

const HEX = /^#[0-9a-f]{6}$/i
// Indirizzo della pagina pubblica: minuscole, numeri e trattini.
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export const eventInfoSchema = z.object({
  titolo: z.string().trim().min(1, "Il titolo è obbligatorio."),
  slug: z
    .string()
    .trim()
    .regex(SLUG_PATTERN, "Solo lettere minuscole, numeri e trattini (es. senti-come-suona-4)."),
  citta: z.string().trim(),
  colore_primario: z.string().trim().regex(HEX, "Colore non valido."),
  colore_secondario: z.string().trim().regex(HEX, "Colore non valido."),
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
  slug: "",
  citta: "",
  colore_primario: "#f5d90a",
  colore_secondario: "#a855f7",
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
