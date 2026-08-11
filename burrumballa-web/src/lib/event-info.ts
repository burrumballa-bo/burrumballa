import { createClient } from "@supabase/supabase-js"

export interface EventInfo {
  titolo: string
  data_evento: string | null
  descrizione: string | null
  luogo: string | null
  testi_informativi: string | null
  scadenza_iscrizioni: string
}

// Usato solo se `event_info` non è raggiungibile: riflette i valori
// originali della pagina, così l'evento resta consultabile anche in caso
// di errore di rete/config verso Supabase.
const FALLBACK_EVENT_INFO: EventInfo = {
  titolo: "Senti Come Suona",
  data_evento: "2025-09-28",
  descrizione:
    "Workshop di Waacking con Rada, battle Hip Hop & Allstyle (1vs1 e 2vs2) con giuria Spider, Zurek e Rada.",
  luogo: null,
  testi_informativi: null,
  scadenza_iscrizioni: "2025-09-21T23:59:59+02:00",
}

// Lettura server-side (Server Component / generateMetadata): la tabella
// `event_info` è leggibile da anon, quindi basta il client con anon key.
export async function getEventInfo(): Promise<EventInfo> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .from("event_info")
      .select(
        "titolo, data_evento, descrizione, luogo, testi_informativi, scadenza_iscrizioni"
      )
      .eq("id", 1)
      .single()

    if (error || !data) return FALLBACK_EVENT_INFO
    return data
  } catch {
    return FALLBACK_EVENT_INFO
  }
}

// Formatta una data "YYYY-MM-DD" come "Domenica 28 Settembre 2025",
// senza incorrere in scarti di fuso orario (parsing come data locale).
export function formatEventDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m || !d) return null

  const formatted = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d))

  return formatted.replace(/\b\w/g, (c) => c.toUpperCase())
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
