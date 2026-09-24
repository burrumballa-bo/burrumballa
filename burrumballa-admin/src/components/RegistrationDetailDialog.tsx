import { useMemo } from "react"
import { toast } from "sonner"

import { useEventOptionsStato } from "@/hooks/useEventOptionsStato"
import { usePaymentStatusChange } from "@/hooks/usePaymentStatusChange"
import {
  useDeleteRegistration,
  useResendReceipt,
  useUpdateNoteAdmin,
  useUpdatePrezzoAdmin,
  useUpdateRegistration,
} from "@/hooks/useRegistrationMutations"
import { RegistrationDetailModal } from "@/components/RegistrationDetailModal"
import type { Registration } from "@/types/registration"

interface RegistrationDetailDialogProps {
  registration: Registration
  onClose: () => void
}

// Modale di dettaglio iscritto già collegato alle mutation: usato da ogni
// pagina che apre un iscritto (Iscritti, Si balla).
export function RegistrationDetailDialog({ registration, onClose }: RegistrationDetailDialogProps) {
  const optionsQuery = useEventOptionsStato()
  const { changeStatus, mutation: updateStatus } = usePaymentStatusChange()
  const updateNote = useUpdateNoteAdmin()
  const updateRegistration = useUpdateRegistration()
  const deleteRegistration = useDeleteRegistration()
  const updatePrezzoAdmin = useUpdatePrezzoAdmin()
  const resendReceipt = useResendReceipt()

  const options = useMemo(() => optionsQuery.data ?? [], [optionsQuery.data])
  const workshopOptions = useMemo(() => options.filter((o) => o.tipo === "workshop"), [options])
  const battleOptions = useMemo(() => options.filter((o) => o.tipo === "battle"), [options])

  return (
    <RegistrationDetailModal
      registration={registration}
      workshopOptions={workshopOptions}
      battleOptions={battleOptions}
      onClose={onClose}
      isSaving={updateRegistration.isPending}
      isStatusSaving={updateStatus.isPending}
      isPrezzoAdminSaving={updatePrezzoAdmin.isPending}
      isResending={resendReceipt.isPending}
      isDeleting={deleteRegistration.isPending}
      onSave={(input) =>
        updateRegistration.mutate(input, {
          onSuccess: () => {
            toast.success("Iscritto aggiornato.")
            onClose()
          },
          onError: (error) =>
            toast.error("Salvataggio non riuscito.", {
              description: (error as Error).message,
            }),
        })
      }
      onStatusChange={(status) => changeStatus(registration.id, status)}
      onNoteChange={(note) => updateNote.mutate({ id: registration.id, noteAdmin: note })}
      onPrezzoAdminChange={(prezzoAdmin) =>
        updatePrezzoAdmin.mutate(
          { id: registration.id, prezzoAdmin },
          {
            onSuccess: () =>
              toast.success(
                prezzoAdmin === null
                  ? "Prezzo amministratore rimosso."
                  : "Prezzo amministratore salvato."
              ),
            onError: (error) =>
              toast.error("Salvataggio prezzo non riuscito.", {
                description: (error as Error).message,
              }),
          }
        )
      }
      onResendReceipt={() =>
        resendReceipt.mutate(registration.id, {
          onSuccess: () => toast.success(`Ricevuta reinviata a ${registration.email}.`),
          onError: (error) =>
            toast.error("Invio ricevuta non riuscito.", {
              description: (error as Error).message,
            }),
        })
      }
      onDelete={() =>
        deleteRegistration.mutate(registration.id, {
          onSuccess: () => {
            toast.success("Iscritto eliminato.")
            onClose()
          },
          onError: (error) =>
            toast.error("Eliminazione non riuscita.", {
              description: (error as Error).message,
            }),
        })
      }
    />
  )
}
