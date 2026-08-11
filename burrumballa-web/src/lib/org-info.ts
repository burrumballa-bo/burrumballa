import { createClient } from "@supabase/supabase-js"

export interface OrgInfo {
  intestazione: string | null
  indirizzo: string | null
  piva_cf: string | null
  email_contatto: string | null
}

// Usato solo se `org_info` non è raggiungibile: mantiene la pagina privacy
// consultabile anche in caso di errore verso Supabase.
const FALLBACK_ORG_INFO: OrgInfo = {
  intestazione: "Burrumballa APS",
  indirizzo: null,
  piva_cf: null,
  email_contatto: null,
}

// Legge la view pubblica `org_info` (sottoinsieme non sensibile di
// app_settings, gestito dall'admin in Impostazioni): stessa fonte di
// verità usata per la ricevuta PDF, così la pagina privacy resta sempre
// coerente con i dati reali dell'associazione senza doverli duplicare.
export async function getOrgInfo(): Promise<OrgInfo> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .from("org_info")
      .select("intestazione, indirizzo, piva_cf, email_contatto")
      .single()

    if (error || !data) return FALLBACK_ORG_INFO
    return data
  } catch {
    return FALLBACK_ORG_INFO
  }
}
