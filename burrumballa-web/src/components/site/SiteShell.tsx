import type { ReactNode } from "react"

import type { FooterContent } from "@/lib/cms/types"
import { siteFontVariables } from "./fonts"
import { SiteFooter } from "./SiteFooter"
import { SiteNav, type SiteSection } from "./SiteNav"

interface SiteShellProps {
  active: SiteSection
  footer: FooterContent
  children: ReactNode
}

// Involucro comune delle 4 pagine del sito pubblico: font, palette e
// nav/footer condivisi. Isolato dal resto dell'app (pagine legali, form di
// iscrizione) che continuano a usare i token shadcn di globals.css.
export function SiteShell({ active, footer, children }: SiteShellProps) {
  return (
    <div className={`${siteFontVariables} bg-bb-cream text-bb-ink font-site-body min-h-screen overflow-x-hidden`}>
      <SiteNav active={active} />
      {children}
      <SiteFooter content={footer} />
    </div>
  )
}
