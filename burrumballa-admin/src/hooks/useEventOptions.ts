import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { EventOption } from "@/types/registration"

export function useEventOptions() {
  return useQuery({
    queryKey: ["event_options"],
    queryFn: async (): Promise<EventOption[]> => {
      const { data, error } = await supabase
        .from("event_options")
        .select("chiave, label, tipo")

      if (error) throw error
      return data ?? []
    },
  })
}
