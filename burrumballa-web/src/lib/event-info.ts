import { cache } from "react"
import { createClient } from "@supabase/supabase-js"

export interface EventPricing {
  /** Prezzo della battle per numero di categorie: [1 categoria, 2, 3, ...]. */
  battlePrezzi: number[]
  maggiorazioneRitardo: number
  maggiorazioneSulPosto: number
}

export interface EventInfo {
  id: number
  slug: string
  titolo: string
  data_evento: string | null
  ora_inizio: string | null
  ora_fine: string | null
  descrizione_iscrizione: string | null
  descrizione: string | null
  luogo: string | null
  citta: string | null
  testi_informativi: string | null
  scadenza_iscrizioni: string
  nota_battle: string | null
  nota_workshop: string | null
  nota_pagamento: string | null
  bonifico_attivo: boolean
  iscrizioni_aperte: boolean
  colore_primario: string
  colore_secondario: string
  /** Path nel bucket privato "assets" (signed URL lato server). */
  immagine_copertina: string | null
  immagine_cornice: string | null
  immagine_logo: string | null
  pricing: EventPricing
}

const COLUMNS =
  "id, slug, titolo, data_evento, ora_inizio, ora_fine, descrizione_iscrizione, descrizione, luogo, citta, testi_informativi, scadenza_iscrizioni, nota_battle, nota_workshop, nota_pagamento, bonifico_attivo, iscrizioni_aperte, colore_primario, colore_secondario, immagine_copertina, immagine_cornice, immagine_logo, battle_prezzi, maggiorazione_ritardo, maggiorazione_sul_posto"

type EventRow = Omit<EventInfo, "pricing"> & {
  battle_prezzi: (number | string)[]
  maggiorazione_ritardo: number | string
  maggiorazione_sul_posto: number | string
}

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// numeric di Postgres puo' arrivare come stringa: si converte sempre.
function toEventInfo({ battle_prezzi, maggiorazione_ritardo, maggiorazione_sul_posto, ...row }: EventRow): EventInfo {
  return {
    ...row,
    pricing: {
      battlePrezzi: battle_prezzi.map(Number),
      maggiorazioneRitardo: Number(maggiorazione_ritardo),
      maggiorazioneSulPosto: Number(maggiorazione_sul_posto),
    },
  }
}

// Lettura server-side (layout, pagina e generateMetadata condividono la
// stessa richiesta grazie a cache). Anon vede solo gli eventi pubblicati:
// null = evento inesistente o non pubblicato, la pagina risponde 404.
export const getEventBySlug = cache(async (slug: string): Promise<EventInfo | null> => {
  try {
    const { data, error } = await getAnonClient()
      .from("event_info")
      .select(COLUMNS)
      .eq("slug", slug)
      .maybeSingle<EventRow>()
    if (error || !data) return null
    return toEventInfo(data)
  } catch {
    return null
  }
})

/** Eventi pubblicati, dal piu' recente (sitemap). */
export async function listPublishedEvents(): Promise<Pick<EventInfo, "slug" | "data_evento">[]> {
  try {
    const { data, error } = await getAnonClient()
      .from("event_info")
      .select("slug, data_evento")
      .order("data_evento", { ascending: false })
    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

// Formatta orario inizio/fine ("HH:MM:SS", come salvati su Supabase) come
// "15:00–22:00", o solo "15:00" se manca l'orario di fine. Null se manca
// anche l'orario di inizio.
export function formatEventTimeRange(
  oraInizio: string | null,
  oraFine: string | null
): string | null {
  const inizio = oraInizio?.slice(0, 5) // "HH:MM:SS" -> "HH:MM"
  const fine = oraFine?.slice(0, 5)
  if (!inizio) return null
  return fine ? `${inizio}–${fine}` : inizio
}

// Formatta una data "YYYY-MM-DD" (+ opzionale orario inizio/fine
// "HH:MM:SS") come "Domenica 28 Settembre 2025 · ore 21:00–23:30" (o
// "· ore 21:00" se manca l'orario di fine), senza incorrere in scarti di
// fuso orario (parsing come data locale).
export function formatEventDate(
  dateStr: string | null,
  oraInizio?: string | null,
  oraFine?: string | null
): string | null {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m || !d) return null

  const formatted = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d))

  const withCapitals = formatted.replace(/\b\w/g, (c) => c.toUpperCase())

  const orario = formatEventTimeRange(oraInizio ?? null, oraFine ?? null)
  return orario ? `${withCapitals} · ore ${orario}` : withCapitals
}

// Formatta una data "YYYY-MM-DD" come "27 SETTEMBRE", per l'overlay data
// sulla foto di copertina nell'hero della pagina evento.
export function formatEventDayMonthName(dateStr: string | null): string | null {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m || !d) return null

  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long" })
    .format(new Date(y, m - 1, d))
    .toUpperCase()
}

export function formatDeadlineDate(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso))
}
