import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { EventOption } from "@/types/registration"

export function useEventOptions(eventId: number) {
  return useQuery({
    queryKey: ["event_options", eventId],
    queryFn: async (): Promise<EventOption[]> => {
      const { data, error } = await supabase
        .from("event_options")
        .select("chiave, label, tipo")
        .eq("event_id", eventId)

      if (error) throw error
      return data ?? []
    },
  })
}
