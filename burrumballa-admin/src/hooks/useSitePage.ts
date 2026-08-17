import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { mergeWithDefaults } from "@/lib/cms/merge"

export type SitePageId = "home" | "corsi" | "eventi" | "chi-siamo" | "footer"

// Una riga `site_pages` per pagina: il contenuto jsonb viene sempre
// unito sopra i default tipizzati, così il form ha sempre tutti i campi
// anche se la riga non esiste ancora o è stata salvata prima di un nuovo
// campo aggiunto in seguito.
export function useSitePage<T>(id: SitePageId, defaults: T) {
  return useQuery({
    queryKey: ["site-page", id],
    queryFn: async (): Promise<T> => {
      const { data, error } = await supabase
        .from("site_pages")
        .select("content")
        .eq("id", id)
        .maybeSingle()

      if (error) throw error
      return mergeWithDefaults(defaults, data?.content)
    },
  })
}

export function useUpdateSitePage(id: SitePageId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (content: unknown) => {
      const { error } = await supabase
        .from("site_pages")
        .upsert({ id, content }, { onConflict: "id" })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-page", id] })
    },
  })
}
