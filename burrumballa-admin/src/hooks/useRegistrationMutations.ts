import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { PaymentStatus } from "@/types/registration"

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      paymentStatus,
    }: {
      id: string
      paymentStatus: PaymentStatus
    }) => {
      const { error } = await supabase
        .from("registrations")
        .update({ payment_status: paymentStatus })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] })
    },
  })
}

export function useUpdateNoteAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      noteAdmin,
    }: {
      id: string
      noteAdmin: string
    }) => {
      const { error } = await supabase
        .from("registrations")
        .update({ note_admin: noteAdmin || null })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] })
    },
  })
}
