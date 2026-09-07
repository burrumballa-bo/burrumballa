import type { CSSProperties } from "react"

import { getHeaderLogoDataUri } from "@/lib/cms/queries"

// Marchio condiviso da icon.tsx (tab del browser) e apple-icon.tsx
// (schermata Home iOS).
//
// L'icona e' il logo vero, logo_white.png su Supabase Storage: lo stesso
// file che l'admin puo' scegliere per l'header. La variante "white" e'
// fissata qui apposta e non segue la scelta dell'header: e' la "b" con il
// contorno bianco, l'unica delle due che si stacca sia da una barra chiara
// sia da una scura, ed e' quasi quadrata (961x922), quindi entra in un
// riquadro da 64px senza tagli.
//
// Il fetch avviene a build time (vedi icon.tsx: nessun runtime edge, il PNG
// viene prerenderizzato una volta e servito come file statico), quindi
// ricaricare il logo dall'admin si vede in tab dopo il deploy successivo.

const DISPLAY_FONT_FAMILY = "Archivo Black"

export type IconLogo = { src: string; width: number; height: number }

// null se il bucket non risponde: il chiamante ricade sul monogramma.
//
// Un tentativo in piu' perche' qui il singolo fetch decide l'icona di tutto
// il deploy: in una build e' gia' capitato che ripiegasse /icon e non
// /apple-icon, cioe' un buco di rete su una delle due chiamate. E se non
// riesce nemmeno il secondo giro lo scrive nel log, cosi' un deploy con
// l'icona di ripiego non passa inosservato.
export async function loadIconLogo(): Promise<IconLogo | null> {
  const src =
    (await getHeaderLogoDataUri("white")) ?? (await getHeaderLogoDataUri("white"))
  const intrinsicSize = src ? readPngSize(src) : null

  if (!src || !intrinsicSize) {
    console.warn("[icon] logo_white.png non caricato: icone generate dal monogramma")
    return null
  }

  return { src, ...intrinsicSize }
}

// Satori disegna un'immagine solo alle misure che gli si passano: ignora
// sia `object-fit` sia `background-size: contain` (provato — rendeva il PNG
// a grandezza naturale, cioe' un dettaglio del logo ingrandito). Le
// proporzioni vanno quindi lette dai bytes, e per un PNG stanno nell'header
// IHDR: width e height sono i due interi big-endian a offset 16 e 20.
//
// Se il file non fosse un PNG (logo ricaricato in un altro formato) qui
// torna null e l'icona ripiega sul monogramma, invece di uscire deformata.
function readPngSize(dataUri: string): { width: number; height: number } | null {
  const base64 = dataUri.split(",")[1]
  if (!base64) return null

  const header = Buffer.from(base64.slice(0, 64), "base64")
  if (header.length < 24 || header.toString("ascii", 12, 16) !== "IHDR") return null

  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) }
}

// Logo centrato e rimpicciolito dentro il riquadro dell'icona, proporzioni
// intatte (il "contain" che Satori non sa fare da solo).
export function LogoMark({
  logo,
  boxSize,
  backgroundColor = "transparent",
  padding,
}: {
  logo: IconLogo
  boxSize: number
  backgroundColor?: string
  padding: number
}) {
  const inner = boxSize - padding * 2
  const scale = Math.min(inner / logo.width, inner / logo.height)

  const style: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor,
  }

  return (
    <div style={style}>
      {/* Qui non si renderizza HTML per un browser ma un albero per Satori,
          che conosce solo <img>: next/image non ha nulla da ottimizzare. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo.src}
        width={Math.round(logo.width * scale)}
        height={Math.round(logo.height * scale)}
        alt=""
      />
    </div>
  )
}

// Satori non ha accesso ai font di next/font: senza passarglielo
// esplicitamente ripiegherebbe su Noto Sans regular, e la B risulterebbe
// sottile proprio alla dimensione in cui deve leggersi di piu'. Si scarica
// il solo glifo che serve (`&text=B`) in truetype — Satori non legge woff2,
// ed e' l'UA che decide il formato che Google Fonts restituisce.
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

// Ripiego quando il logo non e' scaricabile: la "B" squadrata su viola
// brand, meglio del mappamondo generico del browser.
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
