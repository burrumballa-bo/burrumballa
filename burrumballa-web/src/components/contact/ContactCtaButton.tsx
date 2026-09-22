"use client"

import type { ReactNode } from "react"

import type { ContactIntent } from "@/lib/contact/intents"
import { useContactDialog } from "./ContactDialogProvider"

interface ContactCtaButtonProps {
  /** Contesto del contatto: titolo del popup e messaggio già iniziato. */
  intent: ContactIntent
  className?: string
  children: ReactNode
}

// Pulsante che apre il popup contatti. Non porta stile proprio: prende le
// classi di dove sta (hero, banda finale, sezione "iscriviti a un corso"),
// così sostituisce un <Link> senza cambiare l'aspetto della pagina.
export function ContactCtaButton({
  intent,
  className,
  children,
}: ContactCtaButtonProps) {
  const openContactDialog = useContactDialog()

  return (
    <button
      type="button"
      onClick={() => openContactDialog(intent)}
      className={className}
    >
      {children}
    </button>
  )
}
