import type { EventInfo } from "@/types/eventInfo"
import type { EventOptionStato } from "@/types/eventOption"
import type { PaymentMethod } from "@/types/registration"

// Stessa regola di prezzo del form pubblico (vedi
// burrumballa-web/src/lib/registration/pricing.ts): usata dall'admin per
// mostrare in tempo reale gli importi di una nuova iscrizione.

// Chiavi "placeholder" a catalogo (vedi supabase/migrations): non sono
// categorie reali, quindi non vanno proposte come opzioni spuntabili.
export const NO_WORKSHOP_KEY = "no_workshop"
export const NO_BATTLE_KEY = "no_battle"

const WORKSHOP_FALLBACK_PRICE = 25

// Regole di prezzo dell'evento (event_info): la battle si paga a scaglioni
// in base a QUANTE categorie si scelgono; oltre l'ultimo vale l'ultimo.
export type EventPricing = Pick<
  EventInfo,
  "battle_prezzi" | "maggiorazione_ritardo" | "maggiorazione_sul_posto"
>

export interface CalcolaImportiInput {
  workshop: string
  battleCategories: string[]
  paymentMethod: PaymentMethod
  workshopOptions: EventOptionStato[]
  deadline: Date | null
  pricing: EventPricing
}

export interface Importi {
  amount_workshop: number
  amount_battle: number
  surcharge_late: number
  surcharge_onsite: number
  amount_total: number
}

// Campo "prezzo amministratore": vuoto = nessun prezzo (null), accetta la
// virgola come separatore decimale. valid = false per valori non numerici
// o negativi.
export function parsePrezzoAdmin(raw: string): { value: number | null; valid: boolean } {
  const trimmed = raw.trim().replace(",", ".")
  if (trimmed === "") return { value: null, valid: true }
  const value = Number(trimmed)
  return { value, valid: Number.isFinite(value) && value >= 0 }
}

export function calcolaImporti(input: CalcolaImportiInput): Importi {
  const workshopChiave =
    input.workshop && input.workshop !== NO_WORKSHOP_KEY ? input.workshop : null
  const amountWorkshop = workshopChiave
    ? (input.workshopOptions.find((o) => o.chiave === workshopChiave)?.prezzo ??
      WORKSHOP_FALLBACK_PRICE)
    : 0

  const battleCount = input.battleCategories.filter((c) => c !== NO_BATTLE_KEY).length
  const prezzi = input.pricing.battle_prezzi
  const amountBattle =
    battleCount > 0 && prezzi.length > 0 ? prezzi[Math.min(battleCount, prezzi.length) - 1] : 0

  // I sovrapprezzi riguardano solo la battle, come nel form pubblico.
  const isLate = input.deadline !== null && Date.now() > input.deadline.getTime()
  const surchargeLate = isLate && amountBattle > 0 ? input.pricing.maggiorazione_ritardo : 0
  const surchargeOnsite =
    input.paymentMethod === "sul_posto" && amountBattle > 0
      ? input.pricing.maggiorazione_sul_posto
      : 0

  return {
    amount_workshop: amountWorkshop,
    amount_battle: amountBattle,
    surcharge_late: surchargeLate,
    surcharge_onsite: surchargeOnsite,
    amount_total: amountWorkshop + amountBattle + surchargeLate + surchargeOnsite,
  }
}
