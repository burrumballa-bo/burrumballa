import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Registration } from "@/types/registration"

export function useRegistrations(eventId: number) {
  return useQuery({
    queryKey: ["registrations", eventId],
    queryFn: async (): Promise<Registration[]> => {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("event_id", eventId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}
