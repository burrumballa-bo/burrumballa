import type { EventOptionStato, PaymentMethod } from "./types"

// Chiavi speciali che rappresentano "nessuna scelta" (vedi seed di event_options).
export const NO_WORKSHOP_KEY = "no_workshop"
export const NO_BATTLE_KEY = "no_battle"

// Scadenza iscrizioni: dal 22/09/2025 scattano i sovrapprezzi di ritardo.
export const REGISTRATION_DEADLINE = new Date("2025-09-21T23:59:59+02:00")

export const LATE_SURCHARGE = 5
export const ONSITE_SURCHARGE = 5

// Prezzo del workshop se l'opzione selezionata non riporta un prezzo (fallback).
const WORKSHOP_FALLBACK_PRICE = 25

// La battle non si paga a somma delle singole categorie: il prezzo dipende
// da QUANTE categorie vengono scelte (bundle 1/2/3 = 15/20/25€).
const BATTLE_TIER_PRICES: Record<number, number> = {
  1: 15,
  2: 20,
  3: 25,
}

function prezzoBattlePerNumeroCategorie(numero: number): number {
  if (numero <= 0) return 0
  if (numero >= 3) return BATTLE_TIER_PRICES[3]
  return BATTLE_TIER_PRICES[numero] ?? 0
}

export interface CalcolaTotaleInput {
  workshop: string
  battleCategorie: string[]
  paymentMethod: PaymentMethod | ""
  workshopOptions: EventOptionStato[]
  now?: Date
}

export interface CalcolaTotaleResult {
  amountWorkshop: number
  amountBattle: number
  surchargeLate: number
  surchargeOnsite: number
  amountTotal: number
  isLate: boolean
  battleCount: number
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

export function calcolaTotale(input: CalcolaTotaleInput): CalcolaTotaleResult {
  const now = input.now ?? new Date()
  const isLate = now.getTime() > REGISTRATION_DEADLINE.getTime()

  const workshopChiave =
    input.workshop && input.workshop !== NO_WORKSHOP_KEY ? input.workshop : null
  const opzioneWorkshop = workshopChiave
    ? input.workshopOptions.find((o) => o.chiave === workshopChiave)
    : undefined
  const amountWorkshop = workshopChiave
    ? (opzioneWorkshop?.prezzo ?? WORKSHOP_FALLBACK_PRICE)
    : 0

  const categorieBattleReali = input.battleCategorie.filter(
    (chiave) => chiave !== NO_BATTLE_KEY
  )
  const battleCount = categorieBattleReali.length
  const amountBattle = prezzoBattlePerNumeroCategorie(battleCount)

  const surchargeLate =
    (isLate && amountWorkshop > 0 ? LATE_SURCHARGE : 0) +
    (isLate && amountBattle > 0 ? LATE_SURCHARGE : 0)

  const surchargeOnsite =
    input.paymentMethod === "sul_posto" && amountWorkshop + amountBattle > 0
      ? ONSITE_SURCHARGE
      : 0

  const amountTotal = amountWorkshop + amountBattle + surchargeLate + surchargeOnsite

  return {
    amountWorkshop,
    amountBattle,
    surchargeLate,
    surchargeOnsite,
    amountTotal,
    isLate,
    battleCount,
  }
}
