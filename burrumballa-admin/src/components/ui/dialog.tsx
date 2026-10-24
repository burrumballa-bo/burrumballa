import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

// Dialog aperti, dal piu' vecchio al piu' recente: Esc chiude solo l'ultimo
// (es. la ricevuta aperta sopra la scheda iscritto).
const openStack: symbol[] = []

function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return
    const id = Symbol("dialog")
    openStack.push(id)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openStack[openStack.length - 1] === id) onOpenChange(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      openStack.splice(openStack.indexOf(id), 1)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="bg-background relative z-10 my-auto w-full max-w-2xl rounded-lg border p-6 shadow-lg"
      >
        {children}
      </div>
    </div>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("mb-4 flex items-start justify-between gap-4", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Chiudi"
      className="text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 rounded-sm p-1 transition-colors"
    >
      <X className="size-4" />
    </button>
  )
}

export { Dialog, DialogHeader, DialogTitle, DialogCloseButton }
