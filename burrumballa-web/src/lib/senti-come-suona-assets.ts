import { createClient } from "@supabase/supabase-js"

// Bucket privato 'assets' (stesso del timbro ricevute): la cartella
// 'senti_come_suona/' e' leggibile da anon SOLO tramite signed URL, grazie
// alla policy storage 'assets_select_anon_senti_come_suona' scoped a quel
// prefisso (vedi migrazione 20260811000200). Il resto del bucket (es.
// 'timbro/') resta privato: nessuna policy anon esiste su quei path.
const ASSETS_BUCKET = "assets"
export const SENTI_COME_SUONA_FOLDER = "senti_come_suona"
const SIGNED_URL_TTL_SECONDS = 60 * 60

export function sentiComeSuonaPath(fileName: string): string {
  return `${SENTI_COME_SUONA_FOLDER}/${fileName}`
}

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

// Giuria e Host/DJ mostrati in pagina: gestiti dall'admin in /admin/evento
// (tabella `event_people`), non piu' hardcoded.
export async function getEventPeople(): Promise<EventPerson[]> {
  try {
    const supabase = getAnonClient()
    const { data, error } = await supabase
      .from("event_people")
      .select("id, categoria, nome, ruolo, immagine_path, colore, ordine")
      .order("categoria", { ascending: true })
      .order("ordine", { ascending: true })

    if (error || !data) return []
    return data as EventPerson[]
  } catch {
    return []
  }
}
