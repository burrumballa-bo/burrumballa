import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

const ASSETS_BUCKET = "assets"
const SIGNED_URL_TTL_SECONDS = 60 * 60

// Signed URL per un file del bucket privato "assets" (dashboard esclusa,
// serve sempre una signed URL lato authenticated per mostrarne il contenuto).
export function useAssetSignedUrl(path: string | null) {
  return useQuery({
    queryKey: ["asset-signed-url", path],
    queryFn: async (): Promise<string | null> => {
      if (!path) return null
      const { data, error } = await supabase.storage
        .from(ASSETS_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

      if (error) throw error
      return data.signedUrl
    },
    enabled: !!path,
  })
}
