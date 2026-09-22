import { z } from "zod"

// Campi compilati a mano nel form. Lo stesso schema vale due volte: nel
// browser per mostrare errori leggibili mentre si scrive, e dentro
// /api/contatti per non fidarsi di quello che arriva (vedi
// contactRequestSchema qui sotto).
export const contactSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Inserisci il tuo nome.")
    .max(80, "Il nome è troppo lungo."),
  email: z
    .string()
    .trim()
    .min(1, "Inserisci la tua email.")
    .max(160, "L'email è troppo lunga.")
    .email("Inserisci un'email valida."),
  telefono: z.string().trim().max(40, "Il numero di telefono è troppo lungo."),
  messaggio: z
    .string()
    .trim()
    .min(10, "Scrivi qualche parola in più: ci aiuta a risponderti meglio.")
    .max(4000, "Il messaggio è troppo lungo."),
  consenso: z.boolean().refine((value) => value === true, {
    message: "Devi accettare il trattamento dei dati per inviare il messaggio.",
  }),
  // Honeypot: campo invisibile che solo i bot compilano. Non è validato —
  // il messaggio viene accettato e buttato via lato server, così chi lo
  // compila non capisce di essere stato scartato.
  website: z.string(),
})

export type ContactFormValues = z.infer<typeof contactSchema>

// Quello che il form manda davvero a /api/contatti: i campi compilati più
// il contesto aggiunto dal codice (da quale pulsante e da quale pagina è
// partito il messaggio), che finisce nell'oggetto dell'email.
export const contactRequestSchema = contactSchema.extend({
  argomento: z.string().trim().max(120),
  pagina: z.string().trim().max(300),
})

export type ContactRequest = z.infer<typeof contactRequestSchema>

export function contactDefaultValues(message = ""): ContactFormValues {
  return {
    nome: "",
    email: "",
    telefono: "",
    messaggio: message,
    consenso: false,
    website: "",
  }
}
