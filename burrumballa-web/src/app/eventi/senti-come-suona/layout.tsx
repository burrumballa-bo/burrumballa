import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

import { anton, inter } from "./fonts"

// Tema scuro/giallo del redesign "Senti Come Suona", isolato a questa
// route: sovrascrive le CSS custom properties che i componenti shadcn/ui
// (Button, Card, Badge, Input, Checkbox, RadioGroup...) già usano, così
// li riusiamo com'erano senza toccarli né influenzare il resto del sito.
const themeStyle = {
  "--background": "#000000",
  "--foreground": "#ffffff",
  "--card": "#0a0a0a",
  "--card-foreground": "#ffffff",
  "--popover": "#0a0a0a",
  "--popover-foreground": "#ffffff",
  "--primary": "#f5d90a",
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
  "--ring": "#f5d90a",
  "--radius": "2px",
} as CSSProperties

export default function SentiComeSuonaLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
