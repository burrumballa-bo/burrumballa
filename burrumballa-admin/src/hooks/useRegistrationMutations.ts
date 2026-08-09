import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FunctionsHttpError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { PaymentStatus } from "@/types/registration"

async function describeFunctionsError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      if (typeof body?.error === "string") {
        return body.detail ? `${body.error}: ${body.detail}` : body.error
      }
    } catch {
      // corpo non-JSON: usa il messaggio generico qui sotto
    }
  }
  return error instanceof Error ? error.message : "Errore sconosciuto"
}

export type PaymentConfirmationEmailStatus =
  | "not_applicable"
  | "sent"
  | "skipped"
  | "failed"

export interface UpdatePaymentStatusResult {
  emailStatus: PaymentConfirmationEmailStatus
  emailError?: string
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      paymentStatus,
    }: {
      id: string
      paymentStatus: PaymentStatus
    }): Promise<UpdatePaymentStatusResult> => {
      const { error } = await supabase
        .from("registrations")
        .update({ payment_status: paymentStatus })
        .eq("id", id)

      if (error) throw error

      if (paymentStatus !== "pagato_bonifico") {
        return { emailStatus: "not_applicable" }
      }

      // La ricevuta va inviata solo alla transizione verso
      // "pagato_bonifico": qui lo stato e' appena stato salvato, quindi
      // invochiamo la function che si occupa anche della guardia
      // anti-doppio-invio lato server (email_conferma_bonifico_inviata_at).
      const { data, error: emailError } = await supabase.functions.invoke(
        "send-payment-confirmation",
        { body: { registrationId: id } }
      )

      if (emailError) {
        return { emailStatus: "failed", emailError: await describeFunctionsError(emailError) }
      }

      return {
        emailStatus: data?.skipped ? "skipped" : "sent",
      }
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
