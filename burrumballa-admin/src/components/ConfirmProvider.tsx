import { useCallback, useRef, useState, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmContext, type ConfirmOptions } from "@/hooks/useConfirm"

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((ok: boolean) => void) | null>(null)

  const confirm = useCallback(
    (next: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        // Una conferma ancora aperta viene considerata annullata.
        resolveRef.current?.(false)
        resolveRef.current = resolve
        setOptions(next)
      }),
    []
  )

  const close = useCallback((ok: boolean) => {
    resolveRef.current?.(ok)
    resolveRef.current = null
    setOptions(null)
  }, [])

  const destructive = options?.destructive ?? true

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={!!options} onOpenChange={(open) => !open && close(false)} className="max-w-md">
        {options && (
          <div>
            <DialogHeader className="justify-start">
              {destructive && (
                <AlertTriangle className="text-destructive size-5 shrink-0" aria-hidden />
              )}
              <DialogTitle className="leading-snug">{options.title}</DialogTitle>
            </DialogHeader>
            {options.description && (
              <p className="text-muted-foreground text-sm whitespace-pre-line">{options.description}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => close(false)}>
                Annulla
              </Button>
              <Button
                type="button"
                variant={destructive ? "destructive" : "default"}
                autoFocus
                onClick={() => close(true)}
              >
                {options.confirmLabel ?? "Elimina"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  )
}
