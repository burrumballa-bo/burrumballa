"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { X } from "lucide-react"

import type { ContactIntent } from "@/lib/contact/intents"
import { ContactForm } from "./ContactForm"

type OpenContactDialog = (intent: ContactIntent) => void

const ContactDialogContext = createContext<OpenContactDialog | null>(null)

/** Apre il popup contatti con un messaggio già iniziato. */
export function useContactDialog(): OpenContactDialog {
  const open = useContext(ContactDialogContext)
  if (!open) {
    throw new Error(
      "useContactDialog richiede <ContactDialogProvider> (montato in SiteShell)."
    )
  }
  return open
}

// Un solo popup per tutto il sito pubblico, montato da <SiteShell>: i
// pulsanti sparsi nelle pagine (hero, banda finale, "iscriviti a un corso")
// lo aprono passando il proprio intent, invece di portarsi dietro ognuno la
// propria copia del form.
//
// È un <dialog> nativo aperto con showModal(): top layer, backdrop, chiusura
// con Esc e focus trattenuto nel popup arrivano dal browser, senza libreria
// né gestione manuale del focus.
export function ContactDialogProvider({ children }: { children: ReactNode }) {
  const [intent, setIntent] = useState<ContactIntent | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const open = useCallback<OpenContactDialog>((next) => setIntent(next), [])
  const close = useCallback(() => setIntent(null), [])

  // showModal()/close() non si pilotano da JSX: vanno chiamati sul nodo.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (intent && !dialog.open) dialog.showModal()
    if (!intent && dialog.open) dialog.close()
  }, [intent])

  // Il top layer non blocca lo scroll della pagina sotto: lo blocchiamo qui
  // per non far scorrere via il contenuto mentre si compila il form.
  useEffect(() => {
    if (!intent) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [intent])

  return (
    <ContactDialogContext.Provider value={open}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby="contact-dialog-title"
        // onClose copre sia Esc sia la chiusura programmatica: tiene lo
        // stato React allineato a quello del <dialog>.
        onClose={close}
        // Click sul backdrop: l'evento arriva al <dialog> stesso, mentre
        // quelli sul contenuto hanno come target un discendente.
        onClick={(event) => {
          if (event.target === dialogRef.current) close()
        }}
        className="bg-bb-cream text-bb-ink border-bb-ink m-auto max-h-[min(calc(100dvh-3rem),46rem)] w-[min(34rem,calc(100vw-2rem))] max-w-none overflow-y-auto border-[3px] p-0 backdrop:bg-black/70"
      >
        {intent && (
          <>
            <div className="border-bb-ink bg-bb-cream sticky top-0 z-10 flex items-start justify-between gap-4 border-b-[3px] p-5 md:p-6">
              <div>
                <h2
                  id="contact-dialog-title"
                  className="font-display text-[24px] leading-[1] tracking-[-1px] md:text-[28px]"
                >
                  {intent.title}
                </h2>
                <p className="mt-2 max-w-[38ch] text-[13px] leading-relaxed opacity-75">
                  {intent.description}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Chiudi"
                className="border-bb-ink flex size-9 shrink-0 items-center justify-center border-[2.5px]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 md:p-6">
              <ContactForm
                topic={intent.topic}
                defaultMessage={intent.message}
              />
            </div>
          </>
        )}
      </dialog>
    </ContactDialogContext.Provider>
  )
}
