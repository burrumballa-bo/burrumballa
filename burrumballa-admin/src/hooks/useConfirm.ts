import { createContext, useContext } from "react"

export interface ConfirmOptions {
  title: string
  description?: string
  /** Testo del pulsante di conferma (default "Elimina"). */
  confirmLabel?: string
  /** Pulsante rosso: default true, le conferme sono quasi tutte eliminazioni. */
  destructive?: boolean
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

export const ConfirmContext = createContext<ConfirmFn | null>(null)

// Finestra di conferma dell'admin al posto di window.confirm:
//   if (!(await confirm({ title: "Eliminare ...?" }))) return
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error("useConfirm va usato dentro <ConfirmProvider>")
  return confirm
}
