import type { ReactNode } from "react"

import { getThemeContent } from "@/lib/cms/queries"
import type { FooterContent, ThemeColors } from "@/lib/cms/types"
import { isValidHexColor } from "@/lib/color"
import { siteFontVariables } from "./fonts"
import { SiteFooter } from "./SiteFooter"
import { SiteNav, type SiteSection } from "./SiteNav"
import { WallBackground } from "./WallBackground"

interface SiteShellProps {
  active: SiteSection
  footer: FooterContent
  children: ReactNode
}

const DARK_VAR_BY_KEY: Record<keyof ThemeColors, string> = {
  background: "--bb-cream-value",
  text: "--bb-ink-value",
  purple: "--bb-purple-value",
  pink: "--bb-pink-value",
  green: "--bb-green-value",
  orange: "--bb-orange-value",
}

// Regola inline i CSS var bb-*-value sotto .dark con i colori scelti in
// /admin/contenuti/tema: le utility Tailwind bg-bb-*/text-bb-*/border-bb-*
// leggono --color-bb-* che punta a queste var() (vedi globals.css), quindi
// basta sovrascrivere qui perché tutto il sito (nav, card, bottoni) segua
// il tema scuro senza toccare ogni pagina.
function buildDarkThemeCss(colors: ThemeColors): string {
  const declarations = (Object.keys(DARK_VAR_BY_KEY) as (keyof ThemeColors)[])
    .filter((key) => isValidHexColor(colors[key]))
    .map((key) => `${DARK_VAR_BY_KEY[key]}: ${colors[key]};`)
    .join(" ")
  return `.dark { ${declarations} }`
}

// Involucro comune delle 4 pagine del sito pubblico: font, palette e
// nav/footer condivisi. Isolato dal resto dell'app (pagine legali, form di
// iscrizione) che continuano a usare i token shadcn di globals.css.
//
// Il contenuto (non nav/footer, che restano opachi) vive dentro un
// `relative isolate` con <WallBackground /> come primo figlio: l'`isolate`
// evita il classico bug per cui uno z-index negativo finisce dietro al
// <body> invece che solo dietro al contenuto della pagina.
export async function SiteShell({ active, footer, children }: SiteShellProps) {
  const theme = await getThemeContent()

  return (
    <div className={`${siteFontVariables} bg-bb-cream text-bb-ink font-site-body min-h-screen overflow-x-hidden`}>
      {theme.darkModeEnabled && (
        <style dangerouslySetInnerHTML={{ __html: buildDarkThemeCss(theme.dark) }} />
      )}
      <SiteNav active={active} darkModeEnabled={theme.darkModeEnabled} />
      <div className="relative isolate">
        <WallBackground />
        {children}
      </div>
      <SiteFooter content={footer} />
    </div>
  )
}
