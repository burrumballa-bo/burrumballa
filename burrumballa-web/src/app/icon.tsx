import { ImageResponse } from "next/og"

import {
  IconMark,
  LogoMark,
  fontOptions,
  loadDisplayFont,
  loadIconLogo,
} from "@/lib/icon-mark"

// Icona della tab: prima non esisteva nessun file icona (né /favicon.ico né
// app/icon.*), quindi Next non emetteva alcun <link rel="icon"> e il browser
// ripiegava sul mappamondo generico.
//
// Generata come PNG a build time con next/og invece di tenere un binario nel
// repo, stesso approccio dell'opengraph-image dell'evento. Nessun
// `runtime = "edge"`: cosi' viene prerenderizzata una volta in build e
// servita come file statico, invece di girare a ogni richiesta.
//
// 64 e non 32: il logo ha contorni sottili, e su schermo 2x il browser
// disegna la favicon a 32 fisici — a 32 li sgranerebbe.

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default async function Icon() {
  const logo = await loadIconLogo()

  // Fondo trasparente: il logo bianco-bordato regge sia la barra chiara sia
  // quella scura, e un riquadro colorato a 16px si mangerebbe il disegno.
  if (logo) {
    return new ImageResponse(
      <LogoMark logo={logo} boxSize={size.width} padding={2} />,
      size
    )
  }

  const fontData = await loadDisplayFont()

  return new ImageResponse(<IconMark fontSize={48} hasDisplayFont={fontData !== null} />, {
    ...size,
    fonts: fontOptions(fontData),
  })
}
