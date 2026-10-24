import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FunctionsHttpError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { Receipt, ReceiptDraftInput } from "@/types/receipt"

const KEY = ["receipts"]

export function formatReceiptNumber(r: { year: number; number: number }): string {
  return `${r.year}/${String(r.number).padStart(4, "0")}`
}

async function describeError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      if (typeof body?.error === "string") {
        return body.detail ? `${body.error}: ${body.detail}` : body.error
      }
    } catch {
      // corpo non-JSON: messaggio generico qui sotto
    }
  }
  return error instanceof Error ? error.message : "Errore sconosciuto"
}

// Tutte le azioni passano dalla Edge Function issue-receipt (numerazione e
// PDF sono lato server).
async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("issue-receipt", { body })
  if (error) throw new Error(await describeError(error))
  return data as T
}

export function base64ToPdfBlob(base64: string): Blob {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: "application/pdf" })
}

export function useReceipts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Receipt[]> => {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .order("year", { ascending: false })
        .order("number", { ascending: false })
      if (error) throw error
      return (data ?? []).map((r) => ({ ...r, total: Number(r.total) }))
    },
  })
}

export function usePreviewReceipt() {
  return useMutation({
    mutationFn: async (receipt: ReceiptDraftInput) => {
      const data = await invoke<{ pdf: string }>({ action: "preview", receipt })
      return base64ToPdfBlob(data.pdf)
    },
  })
}

export interface IssueReceiptResult {
  receipt: { id: string; year: number; number: number }
  pdf: Blob
  email: "sent" | "failed" | "not_requested"
  emailError: string | null
}

export function useIssueReceipt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      receipt,
      send,
    }: {
      receipt: ReceiptDraftInput
      send: boolean
    }): Promise<IssueReceiptResult> => {
      const data = await invoke<Omit<IssueReceiptResult, "pdf"> & { pdf: string }>({
        action: "issue",
        receipt,
        send,
      })
      return { ...data, pdf: base64ToPdfBlob(data.pdf) }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useSendReceipt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, to }: { id: string; to: string }) => {
      await invoke({ action: "send", receiptId: id, to })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDownloadReceipt() {
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await invoke<{ pdf: string; filename: string }>({ action: "download", receiptId: id })
      return { blob: base64ToPdfBlob(data.pdf), filename: data.filename }
    },
  })
}

// Una ricevuta emessa non si cancella: si annulla (vedi supabase/migrations).
export function useCancelReceipt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("receipts")
        .update({ cancelled_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
