import { ImageResponse } from "next/og"

import {
  IconMark,
  LogoMark,
  fontOptions,
  loadDisplayFont,
  loadIconLogo,
} from "@/lib/icon-mark"

// Icona per "Aggiungi a schermata Home" su iOS (rel="apple-touch-icon"):
// iOS ignora il <link rel="icon"> e senza questa userebbe uno screenshot
// della pagina. Stesso logo di icon.tsx, alla dimensione richiesta.

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

// iOS appiattisce la trasparenza su nero, quindi qui il fondo va messo: il
// crema del sito, lo stesso su cui il logo sta nell'header.
const APPLE_ICON_BACKGROUND = "#f4f1ea"

export default async function AppleIcon() {
  const logo = await loadIconLogo()

  if (logo) {
    return new ImageResponse(
      <LogoMark
        logo={logo}
        boxSize={size.width}
        backgroundColor={APPLE_ICON_BACKGROUND}
        padding={22}
      />,
      size
    )
  }

  const fontData = await loadDisplayFont()

  return new ImageResponse(<IconMark fontSize={128} hasDisplayFont={fontData !== null} />, {
    ...size,
    fonts: fontOptions(fontData),
  })
}
