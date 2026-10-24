import type { CSSProperties } from "react"

import { getEventBySlug } from "@/lib/event-info"
import { cn } from "@/lib/utils"

import { anton, inter } from "./fonts"

// Tema scuro del modello pagina evento (nato dal redesign "Senti Come
// Suona"), isolato a questa route: sovrascrive le CSS custom properties che
// i componenti shadcn/ui (Button, Card, Badge, Input, Checkbox,
// RadioGroup...) già usano, così li riusiamo com'erano senza toccarli né
// influenzare il resto del sito. I due colori dell'evento arrivano da
// event_info (--event-accent / --event-accent-2).
const DEFAULT_ACCENT = "#f5d90a"
const DEFAULT_ACCENT_2 = "#a855f7"

const baseThemeStyle = {
  "--background": "#000000",
  "--foreground": "#ffffff",
  "--card": "#0a0a0a",
  "--card-foreground": "#ffffff",
  "--popover": "#0a0a0a",
  "--popover-foreground": "#ffffff",
  "--primary": "var(--event-accent)",
  "--primary-foreground": "#000000",
  "--secondary": "#151515",
  "--secondary-foreground": "#ffffff",
  "--muted": "#111111",
  "--muted-foreground": "rgba(255,255,255,.55)",
  "--accent": "#1a1a1a",
  "--accent-foreground": "#ffffff",
  "--destructive": "#f87171",
  "--border": "rgba(255,255,255,.12)",
  "--input": "rgba(255,255,255,.12)",
  "--ring": "var(--event-accent)",
  "--radius": "2px",
} as CSSProperties

// Solo colori esadecimali: il valore finisce in uno style inline.
const HEX_COLOR = /^#[0-9a-f]{6}$/i

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const event = await getEventBySlug((await params).slug)
  const accent = event && HEX_COLOR.test(event.colore_primario) ? event.colore_primario : DEFAULT_ACCENT
  const accent2 =
    event && HEX_COLOR.test(event.colore_secondario) ? event.colore_secondario : DEFAULT_ACCENT_2
  const themeStyle = {
    ...baseThemeStyle,
    "--event-accent": accent,
    "--event-accent-2": accent2,
  } as CSSProperties

  return (
    <div
      className={cn(
        anton.variable,
        inter.variable,
        "bg-background text-foreground min-h-screen font-[family-name:var(--font-inter)]"
      )}
      style={themeStyle}
    >
      {children}
    </div>
  )
}
