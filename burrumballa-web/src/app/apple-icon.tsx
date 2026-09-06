import { ImageResponse } from "next/og"

import { IconMark, fontOptions, loadDisplayFont } from "@/lib/icon-mark"

// Icona per "Aggiungi a schermata Home" su iOS (rel="apple-touch-icon"):
// iOS ignora il <link rel="icon"> e senza questa userebbe uno screenshot
// della pagina. Stesso monogramma di icon.tsx, alla dimensione richiesta.

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default async function AppleIcon() {
  const fontData = await loadDisplayFont()

  return new ImageResponse(
    <IconMark fontSize={128} hasDisplayFont={fontData !== null} />,
    { ...size, fonts: fontOptions(fontData) }
  )
}
