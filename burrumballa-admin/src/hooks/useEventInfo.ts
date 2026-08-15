import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { EventInfo } from "@/types/eventInfo"

export function useEventInfo() {
  return useQuery({
    queryKey: ["event-info"],
    queryFn: async (): Promise<EventInfo> => {
      const { data, error } = await supabase
        .from("event_info")
        .select("*")
        .eq("id", 1)
        .single()

      if (error) throw error
      return data
    },
  })
}

export interface UpdateEventInfoInput {
  titolo: string
  data_evento: string | null
  ora_inizio: string | null
  ora_fine: string | null
  descrizione_iscrizione: string | null
  descrizione: string | null
  luogo: string | null
  testi_informativi: string | null
  scadenza_iscrizioni: string
  nota_battle: string | null
  nota_workshop: string | null
  nota_pagamento: string | null
}

export function useUpdateEventInfo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: UpdateEventInfoInput) => {
      const { error } = await supabase
        .from("event_info")
        .update(values)
        .eq("id", 1)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-info"] })
    },
  })
}
