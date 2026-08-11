import { z } from "zod"

export const registrationSchema = z.object({
  nome: z.string().trim().min(1),
  cognome: z.string().trim().min(1),
  dataNascita: z.string().trim().min(1),
  telefono: z.string().trim().min(1),
  citta: z.string().trim().optional(),
  aka: z.string().trim().min(1),
  akaPartner2vs2: z.string().trim().optional(),
  email: z.string().trim().min(1).email(),
  workshop: z.string().min(1),
  battleCategorie: z.array(z.string()).min(1),
  paymentMethod: z.enum(["bonifico", "sul_posto"]),
  consensoRegolamento: z
    .boolean()
    .refine((value) => value === true, {
      message: "Devi accettare il regolamento e il trattamento dei dati.",
    }),
  consensoImmagini: z.enum(["si", "no"]),
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
  consensoImmagini: "no",
}
