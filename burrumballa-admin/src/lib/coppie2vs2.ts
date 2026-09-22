import type { Registration } from "@/types/registration"

// Categoria 2vs2: il campo `aka_partner_2vs2` del form ("Crew / partner
// 2vs2") contiene il nome della crew OPPURE il nome/aka del partner.
export const HIPHOP_2VS2_OPEN_KEY = "hiphop_2vs2_open"

export interface Coppia2vs2 {
  /** "idA|idB" con gli id ordinati: stabile a prescindere da chi è A o B. */
  id: string
  a: Registration
  b: Registration
  /** Nome della crew condivisa, null se accoppiati tramite partner reciproco. */
  crew: string | null
}

export interface Accoppiamento2vs2 {
  coppie: Coppia2vs2[]
  /** Iscritti alla 2vs2 senza crew né partner corrispondente. */
  singoli: Registration[]
}

function normalizza(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^@+\s*/, "")
}

// Modi in cui un iscritto può essere indicato come partner da un altro.
function identita(r: Registration): Set<string> {
  const nomi = [
    r.aka,
    `${r.nome} ${r.cognome}`,
    `${r.cognome} ${r.nome}`,
  ].map(normalizza)
  return new Set(nomi.filter(Boolean))
}

function coppia(a: Registration, b: Registration, crew: string | null): Coppia2vs2 {
  const [x, y] = a.id < b.id ? [a, b] : [b, a]
  return { id: `${x.id}|${y.id}`, a: x, b: y, crew }
}

export function isIscrittoA2vs2(r: Registration): boolean {
  return r.battle_categories.includes(HIPHOP_2VS2_OPEN_KEY)
}

/**
 * Accoppia gli iscritti alla 2vs2 Open: prima i partner reciproci (A indica
 * B e B indica A), poi chi ha indicato lo stesso nome di crew. A parità,
 * vince chi si è iscritto prima; ognuno finisce in al massimo una coppia.
 */
export function accoppia2vs2(registrations: Registration[]): Accoppiamento2vs2 {
  const iscritti = registrations
    .filter(isIscrittoA2vs2)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  const accoppiati = new Set<string>()
  const coppie: Coppia2vs2[] = []

  const identitaById = new Map(iscritti.map((r) => [r.id, identita(r)]))
  const partner = (r: Registration) => normalizza(r.aka_partner_2vs2)

  for (const a of iscritti) {
    if (accoppiati.has(a.id) || !partner(a)) continue
    const b = iscritti.find(
      (c) =>
        c.id !== a.id &&
        !accoppiati.has(c.id) &&
        identitaById.get(c.id)!.has(partner(a)) &&
        identitaById.get(a.id)!.has(partner(c))
    )
    if (b) {
      accoppiati.add(a.id).add(b.id)
      coppie.push(coppia(a, b, null))
    }
  }

  for (const a of iscritti) {
    if (accoppiati.has(a.id) || !partner(a)) continue
    const b = iscritti.find(
      (c) => c.id !== a.id && !accoppiati.has(c.id) && partner(c) === partner(a)
    )
    if (b) {
      accoppiati.add(a.id).add(b.id)
      coppie.push(coppia(a, b, a.aka_partner_2vs2?.trim() ?? null))
    }
  }

  return {
    coppie,
    singoli: iscritti.filter((r) => !accoppiati.has(r.id)),
  }
}
