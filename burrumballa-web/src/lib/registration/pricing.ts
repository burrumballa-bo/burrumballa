import type { EventPricing } from "@/lib/event-info"

import type { EventOptionStato, PaymentMethod } from "./types"

// Chiavi speciali che rappresentano "nessuna scelta" (vedi seed di event_options).
export const NO_WORKSHOP_KEY = "no_workshop"
export const NO_BATTLE_KEY = "no_battle"

// Note del form, di fallback se l'evento non le ha compilate: i valori
// reali arrivano da `event_info.nota_battle`/`nota_workshop`/`nota_pagamento`
// (gestiti dall'admin nella pagina dell'evento).
export const FALLBACK_NOTA_BATTLE =
  "Nessun obbligo di scelta: puoi anche non selezionare nessuna categoria. Il costo dipende dal numero di categorie scelte."
export const FALLBACK_NOTA_WORKSHOP =
  'Iscrizione a uno o più workshop, oppure "Nessun workshop" se partecipi solo alla battle.'
export const FALLBACK_NOTA_PAGAMENTO =
  "Il posto è confermato solo dopo il pagamento. Le coordinate bancarie per il bonifico saranno visibili nello step successivo e ti verranno inviate anche via email."

// Prezzo del workshop se l'opzione selezionata non riporta un prezzo (fallback).
const WORKSHOP_FALLBACK_PRICE = 25

// La battle non si paga a somma delle singole categorie: il prezzo dipende
// da QUANTE categorie vengono scelte (event_info.battle_prezzi: [1 cat, 2,
// 3, ...]; oltre l'ultimo scaglione vale l'ultimo prezzo).
export function prezzoBattlePerNumeroCategorie(numero: number, pricing: EventPricing): number {
  const prezzi = pricing.battlePrezzi
  if (numero <= 0 || prezzi.length === 0) return 0
  return prezzi[Math.min(numero, prezzi.length) - 1]
}

// Costo aggiuntivo di una categoria in piu' rispetto a quelle gia' scelte.
export function prezzoCategoriaAggiuntiva(scelte: number, pricing: EventPricing): number {
  return (
    prezzoBattlePerNumeroCategorie(scelte + 1, pricing) -
    prezzoBattlePerNumeroCategorie(scelte, pricing)
  )
}

export interface CalcolaTotaleInput {
  workshop: string
  battleCategorie: string[]
  paymentMethod: PaymentMethod | ""
  workshopOptions: EventOptionStato[]
  deadline: Date
  pricing: EventPricing
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
  const amountBattle = prezzoBattlePerNumeroCategorie(battleCount, input.pricing)

  // I sovrapprezzi riguardano solo la battle (che ha una scadenza e una
  // gestione dei posti più stringenti): il solo workshop non li paga mai.
  const surchargeLate = isLate && amountBattle > 0 ? input.pricing.maggiorazioneRitardo : 0

  const surchargeOnsite =
    input.paymentMethod === "sul_posto" && amountBattle > 0
      ? input.pricing.maggiorazioneSulPosto
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
