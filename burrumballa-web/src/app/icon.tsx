import { ImageResponse } from "next/og"

import { IconMark, fontOptions, loadDisplayFont } from "@/lib/icon-mark"

// Icona della tab: prima non esisteva nessun file icona (né /favicon.ico né
// app/icon.*), quindi Next non emetteva alcun <link rel="icon"> e il browser
// ripiegava sul mappamondo generico.
//
// Generata come PNG a build time con next/og invece di tenere un binario nel
// repo, stesso approccio dell'opengraph-image dell'evento. Nessun
// `runtime = "edge"`: cosi' viene prerenderizzata una volta in build e
// servita come file statico, invece di girare a ogni richiesta.

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default async function Icon() {
  const fontData = await loadDisplayFont()

  return new ImageResponse(
    <IconMark fontSize={24} hasDisplayFont={fontData !== null} />,
    { ...size, fonts: fontOptions(fontData) }
  )
}
