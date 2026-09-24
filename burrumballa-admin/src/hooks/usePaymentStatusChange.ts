import { toast } from "sonner"

import {
  useUpdatePaymentStatus,
  type UpdatePaymentStatusResult,
} from "@/hooks/useRegistrationMutations"
import type { PaymentStatus } from "@/types/registration"

// Toast sull'esito dell'invio ricevuta; senza email da segnalare mostra
// successMessage (se presente).
export function notifyReceiptResult(result: UpdatePaymentStatusResult, successMessage?: string) {
  if (result.emailStatus === "sent") {
    toast.success(
      successMessage
        ? `${successMessage} Ricevuta di pagamento inviata via email.`
        : "Ricevuta di pagamento inviata via email."
    )
  } else if (result.emailStatus === "failed") {
    toast.error("Salvato, ma l'invio della ricevuta non è riuscito.", {
      description: result.emailError,
    })
  } else if (successMessage) {
    toast.success(successMessage)
  }
}

// Usata sia dal modale sia dal bottone di conferma in tabella: il
// successMessage serve solo al secondo, dove non c'è il badge di stato
// sott'occhio a fare da conferma visiva.
export function usePaymentStatusChange() {
  const mutation = useUpdatePaymentStatus()

  const changeStatus = (id: string, status: PaymentStatus, successMessage?: string) =>
    mutation.mutate(
      { id, paymentStatus: status },
      {
        onSuccess: (result) => notifyReceiptResult(result, successMessage),
        onError: (error) =>
          toast.error("Aggiornamento stato non riuscito.", {
            description: (error as Error).message,
          }),
      }
    )

  return { changeStatus, mutation }
}
