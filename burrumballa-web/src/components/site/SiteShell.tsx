import type { ReactNode } from "react"

import { getHeaderLogoUrl, getThemeContent } from "@/lib/cms/queries"
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
// <WallBackground /> è `fixed` (vedi il componente) e montato qui una sola
// volta, come primo figlio, così è dietro a nav/contenuto/footer su ogni
// pagina e resta ancorato alla viewport mentre tutto il resto ci scorre
// sopra. Il `relative isolate` sul contenitore radice (non più sul solo
// wrapper del contenuto) evita il classico bug per cui uno z-index
// negativo finisce dietro al <body> invece che solo dietro agli altri
// figli di questo div.
//
// `overflow-x-clip` (non `-hidden`): `hidden` farebbe di questo div uno
// scroll container, e un antenato che è scroll container rompe silenziosamente
// `position: sticky` sui discendenti (qui, la nav) perché lo sticky si
// ancora al SUO scrollport invece che alla viewport reale. `clip` taglia il
// contenuto in overflow orizzontale (es. il trucco `w-screen` della hero)
// senza creare uno scroll container, quindi la nav resta sticky.
export async function SiteShell({ active, footer, children }: SiteShellProps) {
  const theme = await getThemeContent()
  const isDark = theme.mode === "dark"
  const logoUrl = await getHeaderLogoUrl(theme.headerLogo)

  return (
    <div
      className={`${siteFontVariables} ${isDark ? "dark" : ""} bg-bb-cream text-bb-ink font-site-body relative isolate min-h-screen overflow-x-clip`}
    >
      {isDark && <style dangerouslySetInnerHTML={{ __html: buildDarkThemeCss(theme.dark) }} />}
      <WallBackground />
      <SiteNav active={active} logoUrl={logoUrl} />
      <div className="pb-12 md:pb-12.5">{children}</div>
      <SiteFooter content={footer} logoUrl={logoUrl} />
    </div>
  )
}
