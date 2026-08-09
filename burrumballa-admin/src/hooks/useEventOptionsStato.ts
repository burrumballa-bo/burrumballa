import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { EventOptionStato, EventOptionUpdateInput } from "@/types/eventOption"

// Conteggi in tempo reale: aggiornamento periodico + refetch dopo ogni salvataggio.
const LIVE_REFETCH_INTERVAL_MS = 15_000

export function useEventOptionsStato() {
  return useQuery({
    queryKey: ["event-options-stato"],
    queryFn: async (): Promise<EventOptionStato[]> => {
      const { data, error } = await supabase
        .from("event_options_stato")
        .select("*")
        .order("tipo", { ascending: true })
        .order("ordine", { ascending: true })

      if (error) throw error
      return data ?? []
    },
    refetchInterval: LIVE_REFETCH_INTERVAL_MS,
  })
}

export function useUpdateEventOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: EventOptionUpdateInput) => {
      const { id, ...values } = input
      const { error } = await supabase
        .from("event_options")
        .update(values)
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-options-stato"] })
      queryClient.invalidateQueries({ queryKey: ["event_options"] })
    },
  })
}
