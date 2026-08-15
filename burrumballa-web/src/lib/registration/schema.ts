import { z } from "zod"

import { HIPHOP_2VS2_OPEN_KEY } from "./pricing"

export const registrationSchema = z
  .object({
    nome: z.string().trim().min(1),
    cognome: z.string().trim().min(1),
    dataNascita: z.string().trim().min(1),
    telefono: z.string().trim().min(1),
    citta: z.string().trim().optional(),
    aka: z.string().trim().min(1),
    akaPartner2vs2: z.string().trim().optional(),
    email: z.string().trim().min(1).email(),
    workshop: z.string().min(1),
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
  // Categoria Hip Hop 2vs2 Open: il crew/partner è obbligatorio solo in
  // questo caso (in tutti gli altri il campo resta facoltativo/nascosto).
  .superRefine((values, ctx) => {
    if (
      values.battleCategorie.includes(HIPHOP_2VS2_OPEN_KEY) &&
      !values.akaPartner2vs2?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Il crew/partner 2vs2 è obbligatorio per la categoria Hip Hop 2vs2 Open.",
        path: ["akaPartner2vs2"],
      })
    }
  })

export type RegistrationFormValues = z.infer<typeof registrationSchema>

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
