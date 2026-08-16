import type { EventOptionStato, PaymentMethod } from "./types"

// Chiavi speciali che rappresentano "nessuna scelta" (vedi seed di event_options).
export const NO_WORKSHOP_KEY = "no_workshop"
export const NO_BATTLE_KEY = "no_battle"

// Categoria 2vs2: richiede il nome del crew/partner (vedi seed di event_options).
export const HIPHOP_2VS2_OPEN_KEY = "hiphop_2vs2_open"

// Scadenza iscrizioni di fallback, usata solo se `event_info` non è
// raggiungibile: il valore reale arriva da `event_info.scadenza_iscrizioni`
// (gestito dall'admin in /admin/evento).
export const FALLBACK_REGISTRATION_DEADLINE = new Date("2025-09-21T23:59:59+02:00")

// Note del form, di fallback se `event_info` non è raggiungibile: i valori
// reali arrivano da `event_info.nota_battle`/`nota_workshop`/`nota_pagamento`
// (gestiti dall'admin in /admin/evento/pagina).
export const FALLBACK_NOTA_BATTLE =
  "Nessun obbligo di scelta: puoi anche non selezionare nessuna categoria. Costo in base al numero di categorie scelte: 15,00 € / 20,00 € / 25,00 € / 30,00 €."
export const FALLBACK_NOTA_WORKSHOP =
  'Iscrizione a uno o entrambi i workshop, oppure "Nessun workshop" se partecipi solo alla battle.'
export const FALLBACK_NOTA_PAGAMENTO =
  "Il posto è confermato solo dopo il pagamento. Scadenza iscrizioni: 20/09/2026 — dopo la scadenza: +5,00 €. Le coordinate bancarie per il bonifico saranno visibili nello step successivo e ti verranno inviate anche via email."

export const LATE_SURCHARGE = 5
export const ONSITE_SURCHARGE = 5

// Prezzo mostrato per le categorie battle non selezionate quando ne è già
// stata scelta almeno una: riflette il costo incrementale del bundle
// (15 → 20 → 25 → 30, sempre +5 per categoria aggiuntiva).
export const BATTLE_ADDITIONAL_CATEGORY_PRICE = 5

// Prezzo del workshop se l'opzione selezionata non riporta un prezzo (fallback).
const WORKSHOP_FALLBACK_PRICE = 25

// La battle non si paga a somma delle singole categorie: il prezzo dipende
// da QUANTE categorie vengono scelte (bundle 1/2/3/4 = 15/20/25/30€).
const BATTLE_MAX_TIER = 4
const BATTLE_TIER_PRICES: Record<number, number> = {
  1: 15,
  2: 20,
  3: 25,
  4: 30,
}

function prezzoBattlePerNumeroCategorie(numero: number): number {
  if (numero <= 0) return 0
  if (numero >= BATTLE_MAX_TIER) return BATTLE_TIER_PRICES[BATTLE_MAX_TIER]
  return BATTLE_TIER_PRICES[numero] ?? 0
}

export interface CalcolaTotaleInput {
  workshop: string
  battleCategorie: string[]
  paymentMethod: PaymentMethod | ""
  workshopOptions: EventOptionStato[]
  deadline: Date
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
  const isLate = now.getTime() > input.deadline.getTime()

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

  // I sovrapprezzi riguardano solo la battle (che ha una scadenza e una
  // gestione dei posti più stringenti): il solo workshop non li paga mai.
  const surchargeLate = isLate && amountBattle > 0 ? LATE_SURCHARGE : 0

  const surchargeOnsite =
    input.paymentMethod === "sul_posto" && amountBattle > 0
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
