import { NextResponse, type NextRequest } from "next/server"

// Sito ancora non pubblico: ogni pagina viene sostituita da /coming-soon
// finché non arriva il parametro di sblocco, tranne le rotte in
// PUBLIC_PREFIXES (l'evento "Senti Come Suona" deve restare raggiungibile
// da chiunque, anche senza il parametro).
const PREVIEW_COOKIE = "bb_preview"
const PREVIEW_PARAM = "masca"
const PREVIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 90 // 90 giorni

const PUBLIC_PREFIXES = ["/eventi/senti-come-suona", "/coming-soon"]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Link di sblocco per il cliente: ?masca in coda a qualunque URL. Setta
  // un cookie e ripulisce l'URL, così il link puo' essere ricondiviso senza
  // trascinarsi il parametro in giro.
  if (searchParams.has(PREVIEW_PARAM)) {
    const cleanUrl = request.nextUrl.clone()
    cleanUrl.searchParams.delete(PREVIEW_PARAM)
    const response = NextResponse.redirect(cleanUrl)
    response.cookies.set(PREVIEW_COOKIE, "1", {
      path: "/",
      maxAge: PREVIEW_COOKIE_MAX_AGE,
      sameSite: "lax",
    })
    return response
  }

  if (request.cookies.get(PREVIEW_COOKIE)?.value === "1") {
    return NextResponse.next()
  }

  const comingSoonUrl = request.nextUrl.clone()
  comingSoonUrl.pathname = "/coming-soon"
  comingSoonUrl.search = ""
  return NextResponse.rewrite(comingSoonUrl)
}

export const config = {
  // Esclude asset statici (qualunque path con estensione), _next e i file
  // speciali di metadata: nessuno di questi deve passare dal gate.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
}
