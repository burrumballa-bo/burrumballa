import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

const QUERY_KEY = ["si-balla-ordinamenti"]

// Ordine salvato delle liste di /admin/evento/si-balla, per sezione
// (tabella `si_balla_ordinamenti`, vedi supabase/migrations).
export function useSiBallaOrdinamenti() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Map<string, string[]>> => {
      const { data, error } = await supabase
        .from("si_balla_ordinamenti")
        .select("sezione, ordine")

      if (error) throw error
      return new Map((data ?? []).map((row) => [row.sezione as string, row.ordine as string[]]))
    },
  })
}

export function useSaveSiBallaOrdinamento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sezione, ordine }: { sezione: string; ordine: string[] }) => {
      const { error } = await supabase
        .from("si_balla_ordinamenti")
        .upsert({ sezione, ordine }, { onConflict: "sezione" })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
