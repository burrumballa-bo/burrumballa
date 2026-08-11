"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FALLBACK_BONIFICO_INFO,
  RegistrationConfirmation,
  type BonificoInfo,
  type RiepilogoIscrizione,
} from "@/components/registration/registration-confirmation"
import { DIAGONAL_CUT, SectionCard } from "@/components/registration/shared"
import { cn } from "@/lib/utils"

const CONFIRMATION_STORAGE_KEY = "scs-registration-confirmation"

interface StoredConfirmation {
  riepilogo: RiepilogoIscrizione
  deadline: string
  bonificoInfo: BonificoInfo
}

export default function ConfermaIscrizionePage() {
  const [stato, setStato] = React.useState<"loading" | "found" | "missing">(
    "loading"
  )
  const [dati, setDati] = React.useState<StoredConfirmation | null>(null)
  // In sviluppo React Strict Mode invoca gli effetti due volte al mount:
  // senza questa guardia, la prima invocazione consuma (legge + rimuove)
  // la sessionStorage, e la seconda la trova già vuota sovrascrivendo lo
  // stato "found" con "missing".
  const consumedRef = React.useRef(false)

  React.useEffect(() => {
    if (consumedRef.current) return
    consumedRef.current = true

    try {
      const raw = sessionStorage.getItem(CONFIRMATION_STORAGE_KEY)
      sessionStorage.removeItem(CONFIRMATION_STORAGE_KEY)
      if (!raw) {
        setStato("missing")
        return
      }
      const parsed = JSON.parse(raw) as StoredConfirmation
      setDati(parsed)
      setStato("found")
    } catch {
      setStato("missing")
    }
  }, [])

  return (
    <div className="bg-[#050505] px-5 py-10 lg:mx-auto lg:max-w-3xl lg:px-10 lg:py-16">
      {stato === "loading" && (
        <SectionCard accent="yellow">
          <CardContent className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
            <p className="text-muted-foreground text-sm">Caricamento…</p>
          </CardContent>
        </SectionCard>
      )}

      {stato === "missing" && (
        <SectionCard accent="yellow">
          <CardHeader className="px-5">
            <CardTitle className="font-[family-name:var(--font-anton)] text-lg uppercase">
              Nessuna iscrizione da mostrare
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-5">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Questa pagina mostra il riepilogo subito dopo l&apos;invio del
              form. Se hai già completato un&apos;iscrizione, controlla la
              tua email di conferma; altrimenti puoi iscriverti dalla pagina
              dell&apos;evento.
            </p>
            <Button
              asChild
              className={cn(
                "w-fit rounded-[2px] bg-[#f5d90a] font-bold text-black uppercase hover:bg-[#f5d90a]/90",
                DIAGONAL_CUT
              )}
            >
              <Link href="/eventi/senti-come-suona#iscrizione">
                Vai all&apos;iscrizione
              </Link>
            </Button>
          </CardContent>
        </SectionCard>
      )}

      {stato === "found" && dati && (
        <RegistrationConfirmation
          riepilogo={dati.riepilogo}
          deadline={new Date(dati.deadline)}
          bonificoInfo={dati.bonificoInfo ?? FALLBACK_BONIFICO_INFO}
        />
      )}
    </div>
  )
}
