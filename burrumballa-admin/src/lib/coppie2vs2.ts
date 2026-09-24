import type { Registration } from "@/types/registration"

// Categoria 2vs2: il campo `aka_partner_2vs2` del form ("Crew / partner
// 2vs2") contiene il nome della crew OPPURE l'aka del partner.
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

// Solo lettere e numeri: "Crew-X / Toni B" → "crewxtonib". Serve a trovare
// l'aka dentro il campo partner a prescindere da spazi, trattini e barre.
function compatta(value: string | null | undefined): string {
  return normalizza(value).replace(/[^a-z0-9]/g, "")
}

function coppia(a: Registration, b: Registration, crew: string | null): Coppia2vs2 {
  const [x, y] = a.id < b.id ? [a, b] : [b, a]
  return { id: `${x.id}|${y.id}`, a: x, b: y, crew }
}

export function isIscrittoA2vs2(r: Registration): boolean {
  return r.battle_categories.includes(HIPHOP_2VS2_OPEN_KEY)
}

/**
 * Accoppia gli iscritti alla 2vs2 Open: prima i partner reciproci (il campo
 * partner di A contiene l'aka di B e viceversa, senza ambiguità), poi chi ha
 * indicato lo stesso nome di crew. A parità,
 * vince chi si è iscritto prima; ognuno finisce in al massimo una coppia.
 */
export function accoppia2vs2(registrations: Registration[]): Accoppiamento2vs2 {
  const iscritti = registrations
    .filter(isIscrittoA2vs2)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  const accoppiati = new Set<string>()
  const coppie: Coppia2vs2[] = []

  const partner = (r: Registration) => normalizza(r.aka_partner_2vs2)

  // Per ogni iscritto, l'unico altro iscritto il cui aka compare nel suo
  // campo partner. Se ne compaiono più di uno (es. aka corti contenuti in
  // altri nomi) il match è ambiguo e non si accoppia.
  const partnerUnico = new Map<string, Registration>()
  for (const a of iscritti) {
    const testo = compatta(a.aka_partner_2vs2)
    if (!testo) continue
    const candidati = iscritti.filter((c) => {
      const akaC = compatta(c.aka)
      return c.id !== a.id && akaC !== "" && testo.includes(akaC)
    })
    if (candidati.length === 1) partnerUnico.set(a.id, candidati[0])
  }

  for (const a of iscritti) {
    if (accoppiati.has(a.id)) continue
    const b = partnerUnico.get(a.id)
    if (b && !accoppiati.has(b.id) && partnerUnico.get(b.id)?.id === a.id) {
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
