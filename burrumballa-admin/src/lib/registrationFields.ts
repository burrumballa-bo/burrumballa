import type { RegistrationValues } from "@/hooks/useRegistrationMutations"
import type { PaymentMethod, Registration } from "@/types/registration"

// Stato del form: stringhe vuote al posto dei null, convertite in
// RegistrationValues solo al salvataggio.
export interface RegistrationFieldValues {
  nome: string
  cognome: string
  aka: string
  akaPartner: string
  email: string
  telefono: string
  dataNascita: string
  workshop: string
  battleCategories: string[]
  paymentMethod: PaymentMethod
}

export const EMPTY_REGISTRATION_FIELDS: RegistrationFieldValues = {
  nome: "",
  cognome: "",
  aka: "",
  akaPartner: "",
  email: "",
  telefono: "",
  dataNascita: "",
  workshop: "",
  battleCategories: [],
  paymentMethod: "sul_posto",
}

export function registrationToFieldValues(r: Registration): RegistrationFieldValues {
  return {
    nome: r.nome,
    cognome: r.cognome,
    aka: r.aka ?? "",
    akaPartner: r.aka_partner_2vs2 ?? "",
    email: r.email,
    telefono: r.telefono ?? "",
    dataNascita: r.data_nascita ?? "",
    workshop: r.workshop ?? "",
    battleCategories: r.battle_categories,
    paymentMethod: r.payment_method,
  }
}

export function fieldValuesToRegistration(v: RegistrationFieldValues): RegistrationValues {
  return {
    nome: v.nome.trim(),
    cognome: v.cognome.trim(),
    aka: v.aka.trim() || null,
    aka_partner_2vs2: v.akaPartner.trim() || null,
    email: v.email.trim(),
    telefono: v.telefono.trim() || null,
    data_nascita: v.dataNascita || null,
    workshop: v.workshop || null,
    battle_categories: v.battleCategories,
    payment_method: v.paymentMethod,
  }
}
