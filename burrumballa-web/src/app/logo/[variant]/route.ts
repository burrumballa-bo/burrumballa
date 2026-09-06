import { NextResponse } from "next/server"

import { getHeaderLogoSignedUrl } from "@/lib/cms/queries"
import type { ThemeContent } from "@/lib/cms/types"

// Proxy del logo header dal bucket privato "assets".
//
// Serve a dare all'<img> di header e footer un URL stabile: la signed URL
// di Supabase scade, e finendo dentro l'HTML delle pagine ISR
// (`revalidate = 60`, ma servite stale mentre si rigenerano) capitava di
// consegnare al browser una firma gia' morta — da cui il logo che "a volte"
// non si carica. Qui la firma viene generata al volo a ogni richiesta e
// consumata subito server-side, quindi non puo' invecchiare.
//
// Se un giorno i due file venissero spostati nel bucket pubblico
// "site-media" (dove stanno gia' le immagini del CMS), questa route si puo'
// cancellare e usare direttamente getPublicUrl(): il logo dell'header non ha
// nulla da proteggere, sta su ogni pagina del sito.

const VARIANTS: ThemeContent["headerLogo"][] = ["black", "white"]

function isVariant(value: string): value is ThemeContent["headerLogo"] {
  return (VARIANTS as string[]).includes(value)
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ variant: string }> }
) {
  const { variant } = await params
  if (!isVariant(variant)) {
    return new NextResponse("Not found", { status: 404 })
  }

  const signedUrl = await getHeaderLogoSignedUrl(variant)
  if (!signedUrl) {
    return new NextResponse("Logo non disponibile", { status: 502 })
  }

  const upstream = await fetch(signedUrl, { cache: "no-store" })
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Logo non disponibile", { status: 502 })
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/png",
      // Cachato dalla CDN per un'ora, poi servito stale mentre si aggiorna:
      // una ri-upload del logo dall'admin si propaga entro l'ora senza che
      // nessun visitatore veda un buco.
      "Cache-Control":
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
