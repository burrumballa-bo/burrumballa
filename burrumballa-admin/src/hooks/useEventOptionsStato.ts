import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type {
  EventOptionInsertInput,
  EventOptionStato,
  EventOptionUpdateInput,
} from "@/types/eventOption"

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

// Sostituisce i componenti di un workshop composto (delete-all + insert):
// non c'è bisogno di un diff, la composizione è sempre riscritta per intero.
async function syncOptionComponents(parentId: string, childIds: string[]) {
  const { error: deleteError } = await supabase
    .from("event_option_components")
    .delete()
    .eq("parent_id", parentId)
  if (deleteError) throw deleteError

  if (childIds.length === 0) return

  const { error: insertError } = await supabase
    .from("event_option_components")
    .insert(childIds.map((childId) => ({ parent_id: parentId, child_id: childId })))
  if (insertError) throw insertError
}

function invalidateEventOptions(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["event-options-stato"] })
  queryClient.invalidateQueries({ queryKey: ["event_options"] })
}

export function useCreateEventOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: EventOptionInsertInput) => {
      const { childIds, ...values } = input
      const { data, error } = await supabase
        .from("event_options")
        .insert(values)
        .select("id")
        .single()
      if (error) throw error

      if (values.tipo === "workshop" && values.composto) {
        await syncOptionComponents(data.id, childIds)
      }
    },
    onSuccess: () => invalidateEventOptions(queryClient),
  })
}

export function useUpdateEventOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: EventOptionUpdateInput) => {
      const { id, childIds, ...values } = input
      const { error } = await supabase.from("event_options").update(values).eq("id", id)
      if (error) throw error

      await syncOptionComponents(id, values.composto ? childIds : [])
    },
    onSuccess: () => invalidateEventOptions(queryClient),
  })
}

export function useDeleteEventOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("event_options")
        .update({ deleted_at: new Date().toISOString(), attivo: false })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => invalidateEventOptions(queryClient),
  })
}
