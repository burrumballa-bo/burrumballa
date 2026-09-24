import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FunctionsHttpError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { Importi } from "@/lib/pricing"
import type { PaymentMethod, PaymentStatus } from "@/types/registration"

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

// La ricevuta va inviata alla transizione verso uno stato "pagato"
// (bonifico o in loco): lo stato e' gia' stato salvato, quindi invochiamo
// la function che si occupa anche della guardia anti-doppio-invio lato
// server (email_conferma_bonifico_inviata_at).
async function sendPaymentConfirmation(
  id: string,
  paymentStatus: PaymentStatus
): Promise<UpdatePaymentStatusResult> {
  if (paymentStatus === "da_pagare") {
    return { emailStatus: "not_applicable" }
  }

  const { data, error } = await supabase.functions.invoke("send-payment-confirmation", {
    body: { registrationId: id },
  })

  if (error) {
    return { emailStatus: "failed", emailError: await describeFunctionsError(error) }
  }

  return {
    emailStatus: data?.skipped ? "skipped" : "sent",
  }
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

      return sendPaymentConfirmation(id, paymentStatus)
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

// null = nessun prezzo amministratore: vale di nuovo il totale di listino.
export function useUpdatePrezzoAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, prezzoAdmin }: { id: string; prezzoAdmin: number | null }) => {
      const { error } = await supabase
        .from("registrations")
        .update({ prezzo_admin: prezzoAdmin })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] })
    },
  })
}

// Reinvia la ricevuta di pagamento ignorando la guardia anti-doppio-invio
// (vedi `resend` in supabase/functions/send-payment-confirmation).
export function useResendReceipt() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke("send-payment-confirmation", {
        body: { registrationId: id, resend: true },
      })
      if (error) throw new Error(await describeFunctionsError(error))
      // Una function che non conosce `resend` applica la guardia
      // anti-doppio-invio e risponde "skipped" senza inviare nulla: non va
      // spacciato per un reinvio riuscito.
      if (data?.skipped) {
        throw new Error(
          "Il server non ha inviato la ricevuta: verifica che la Edge Function send-payment-confirmation sia aggiornata."
        )
      }
    },
  })
}

export interface RegistrationValues {
  nome: string
  cognome: string
  aka: string | null
  aka_partner_2vs2: string | null
  email: string
  telefono: string | null
  data_nascita: string | null
  workshop: string | null
  battle_categories: string[]
  payment_method: PaymentMethod
}

export interface UpdateRegistrationInput extends RegistrationValues {
  id: string
}

export interface CreateRegistrationInput extends RegistrationValues, Importi {
  payment_status: PaymentStatus
  prezzo_admin: number | null
  note_admin: string | null
}

// Iscrizione inserita a mano dall'admin. Gli importi arrivano dal calcolo
// lato client (stessa regola del form pubblico); se lo stato e' gia'
// "pagato" parte subito la ricevuta, come al cambio stato.
export function useCreateRegistration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRegistrationInput): Promise<UpdatePaymentStatusResult> => {
      const { data, error } = await supabase
        .from("registrations")
        .insert(input)
        .select("id")
        .single()

      if (error) throw error

      return sendPaymentConfirmation(data.id, input.payment_status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] })
      queryClient.invalidateQueries({ queryKey: ["event-options-stato"] })
    },
  })
}

// Aggiorna i dati anagrafici/scelte dell'iscrizione (modificabili
// dall'admin nel modale di dettaglio). Stato pagamento e note hanno le
// loro mutation dedicate qui sopra (con effetti collaterali propri, es.
// invio ricevuta): questa copre il resto dei campi "scritti dall'utente".
export function useUpdateRegistration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateRegistrationInput) => {
      const { id, ...values } = input
      const { error } = await supabase.from("registrations").update(values).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] })
    },
  })
}

// Soft delete: imposta deleted_at invece di cancellare la riga. La
// persona sparisce da liste/statistiche/conteggio posti (vedi
// conta_iscritti_opzione in supabase/migrations), ma resta in tabella —
// se aveva già pagato, il rimborso va effettuato fuori app.
export function useDeleteRegistration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("registrations")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] })
    },
  })
}
