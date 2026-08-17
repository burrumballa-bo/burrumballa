import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { CrewGroup, CrewGroupInsertInput, CrewGroupUpdateInput } from "@/types/cms"

export function useCrewGroups() {
  return useQuery({
    queryKey: ["crew-groups"],
    queryFn: async (): Promise<CrewGroup[]> => {
      const { data, error } = await supabase
        .from("crew_groups")
        .select("*")
        .order("order_index", { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateCrewGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CrewGroupInsertInput) => {
      const { error } = await supabase.from("crew_groups").insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crew-groups"] }),
  })
}

export function useUpdateCrewGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: CrewGroupUpdateInput) => {
      const { error } = await supabase.from("crew_groups").update(values).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crew-groups"] }),
  })
}

export function useDeleteCrewGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crew_groups").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crew-groups"] }),
  })
}
