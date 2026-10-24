import { createClient } from "@supabase/supabase-js"

// Bucket privato 'assets' (stesso del timbro ricevute): le immagini degli
// eventi sono leggibili da anon SOLO tramite signed URL, grazie alle policy
// storage scoped alle cartelle 'senti_come_suona/' (primo evento) ed
// 'eventi/' (vedi supabase/migrations). Il resto del bucket (es.
// 'timbro/') resta privato: nessuna policy anon esiste su quei path.
const ASSETS_BUCKET = "assets"
const SIGNED_URL_TTL_SECONDS = 60 * 60

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Genera signed URL server-side per una lista di path (relativi alla root
// del bucket 'assets'): il client pubblico non ha mai bisogno di parlare
// direttamente con Storage. Fallisce in modo silenzioso (mappa vuota) cosi'
// la pagina resta renderizzabile anche se Storage e' irraggiungibile.
export async function getSignedAssetUrls(
  paths: string[]
): Promise<Record<string, string>> {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)))
  if (uniquePaths.length === 0) return {}

  try {
    const supabase = getAnonClient()
    const { data, error } = await supabase.storage
      .from(ASSETS_BUCKET)
      .createSignedUrls(uniquePaths, SIGNED_URL_TTL_SECONDS)

    if (error || !data) return {}

    const result: Record<string, string> = {}
    data.forEach((entry, index) => {
      if (entry.signedUrl) {
        result[uniquePaths[index]] = entry.signedUrl
      }
    })
    return result
  } catch {
    return {}
  }
}

export interface EventPerson {
  id: string
  categoria: "giuria" | "host_dj"
  nome: string
  ruolo: string | null
  immagine_path: string | null
  colore: string | null
  ordine: number
}

// Giuria e Host/DJ dell'evento: gestiti dall'admin nella pagina evento
// (tabella `event_people`).
export async function getEventPeople(eventId: number): Promise<EventPerson[]> {
  try {
    const supabase = getAnonClient()
    const { data, error } = await supabase
      .from("event_people")
      .select("id, categoria, nome, ruolo, immagine_path, colore, ordine")
      .eq("event_id", eventId)
      .order("categoria", { ascending: true })
      .order("ordine", { ascending: true })

    if (error || !data) return []
    return data as EventPerson[]
  } catch {
    return []
  }
}
