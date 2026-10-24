import { z } from "zod"

import { NO_BATTLE_KEY, NO_WORKSHOP_KEY } from "./pricing"

// `partnerKeys` restituisce le chiavi delle categorie battle che chiedono
// il nome del crew/partner (event_options.richiede_partner): e' una
// funzione perche' le opzioni arrivano dopo il primo render del form.
export const buildRegistrationSchema = (partnerKeys: () => string[]) => z
  .object({
    nome: z.string().trim().min(1),
    cognome: z.string().trim().min(1),
    dataNascita: z.string().trim().min(1),
    telefono: z.string().trim().min(1),
    citta: z.string().trim().optional(),
    aka: z.string().trim().min(1),
    akaPartner2vs2: z.string().trim().optional(),
    email: z.string().trim().min(1).email(),
    // Facoltativo: si può inviare l'iscrizione senza scegliere un workshop,
    // basta che sia selezionata almeno una categoria battle (vedi superRefine).
    workshop: z.string(),
    battleCategorie: z.array(z.string()),
    paymentMethod: z.enum(["bonifico", "sul_posto"]),
    consensoRegolamento: z
      .boolean()
      .refine((value) => value === true, {
        message: "Devi accettare il regolamento e il trattamento dei dati.",
      }),
    consensoImmagini: z
      .boolean()
      .refine((value) => value === true, {
        message:
          "Devi acconsentire alla pubblicazione di foto/video per completare l'iscrizione.",
      }),
  })
  // Categorie in coppia (es. Hip Hop 2vs2): il crew/partner è obbligatorio
  // solo in questo caso (in tutti gli altri il campo resta nascosto).
  .superRefine((values, ctx) => {
    const keys = partnerKeys()
    if (
      values.battleCategorie.some((c) => keys.includes(c)) &&
      !values.akaPartner2vs2?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Il crew/partner è obbligatorio per la categoria in coppia scelta.",
        path: ["akaPartner2vs2"],
      })
    }

    // Il workshop non è più obbligatorio di per sé, ma deve essere scelta
    // almeno una cosa tra workshop e battle.
    const haWorkshopReale = !!values.workshop && values.workshop !== NO_WORKSHOP_KEY
    const haBattleReale = values.battleCategorie.some((c) => c !== NO_BATTLE_KEY)
    if (!haWorkshopReale && !haBattleReale) {
      const message = "Seleziona almeno un workshop o una categoria battle."
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ["workshop"] })
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ["battleCategorie"] })
    }
  })

export type RegistrationFormValues = z.infer<ReturnType<typeof buildRegistrationSchema>>

export const registrationDefaultValues: RegistrationFormValues = {
  nome: "",
  cognome: "",
  dataNascita: "",
  telefono: "",
  citta: "",
  aka: "",
  akaPartner2vs2: "",
  email: "",
  workshop: "",
  battleCategorie: [],
  paymentMethod: "bonifico",
  consensoRegolamento: false,
  consensoImmagini: false,
}
