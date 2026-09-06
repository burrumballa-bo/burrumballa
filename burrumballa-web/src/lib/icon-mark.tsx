import type { CSSProperties } from "react"

// Monogramma condiviso da icon.tsx (tab del browser) e apple-icon.tsx
// (schermata Home iOS).
//
// Il murales in /public/decor e' un lettering orizzontale: a 32px sarebbe
// illeggibile, quindi si riusa la "B" del <Logomark>. Squadrata, come tutto
// il resto della UI.

const DISPLAY_FONT_FAMILY = "Archivo Black"

// Satori (il motore dietro ImageResponse) non ha accesso ai font di
// next/font: senza passarglielo esplicitamente ripiegherebbe su Noto Sans
// regular, e la B risulterebbe sottile proprio alla dimensione in cui deve
// leggersi di piu'. Si scarica il solo glifo che serve (`&text=B`) in
// truetype — Satori non legge woff2, ed e' l'UA che decide il formato che
// Google Fonts restituisce.
//
// In caso di errore torna null e il chiamante rende con il font di sistema:
// un'icona un po' meno "brand" e' meglio di una build rotta.
export async function loadDisplayFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Archivo+Black&text=B",
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }
    ).then((response) => response.text())

    const fontUrl = css.match(/src: url\((.+?)\) format\('truetype'\)/)?.[1]
    if (!fontUrl) return null

    return await fetch(fontUrl).then((response) => response.arrayBuffer())
  } catch {
    return null
  }
}

export function IconMark({
  fontSize,
  hasDisplayFont,
}: {
  fontSize: number
  hasDisplayFont: boolean
}) {
  const style: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#7e3fae",
    color: "#ffffff",
    fontSize,
    fontFamily: hasDisplayFont ? DISPLAY_FONT_FAMILY : "sans-serif",
    // Senza Archivo Black si ricade su Noto Sans, che non ha un taglio
    // grasso caricato: il grassetto va chiesto solo quando serve davvero.
    fontWeight: hasDisplayFont ? 400 : 700,
  }

  return <div style={style}>B</div>
}

export function fontOptions(fontData: ArrayBuffer | null) {
  if (!fontData) return undefined
  return [
    { name: DISPLAY_FONT_FAMILY, data: fontData, weight: 400 as const, style: "normal" as const },
  ]
}
