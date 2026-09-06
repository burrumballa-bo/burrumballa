import type { Metadata } from "next"
import Link from "next/link"

import { Logomark } from "@/components/site/Logomark"
import { siteFontVariables } from "@/components/site/fonts"
import { WallBackground } from "@/components/site/WallBackground"

export const metadata: Metadata = {
  title: "Sito in arrivo · Burrumballa",
  robots: {
    index: false,
    follow: false,
  },
}

// Pagina di cortesia mostrata (via rewrite in middleware.ts) su ogni rotta
// finché il sito non è pronto per il pubblico. Non dipende da CMS/Supabase
// così resta in piedi anche se quei servizi sono giù.
export default function ComingSoonPage() {
  return (
    <div
      className={`${siteFontVariables} bg-bb-cream text-bb-ink font-site-body relative isolate flex min-h-screen items-center justify-center overflow-x-clip px-6`}
    >
      <WallBackground />
      <div className="bg-bb-cream/90 border-bb-ink relative flex max-w-md flex-col items-center border-[3px] p-10 text-center backdrop-blur-sm">
        <Logomark size={56} />
        <h1 className="font-display mt-6 text-[32px] leading-[0.95] tracking-[-1.5px] sm:text-[38px]">
          STIAMO
          <br />
          PREPARANDO
          <br />
          QUALCOSA.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed">
          Il sito di Burrumballa è in costruzione. Torna a trovarci presto.
        </p>
        <Link
          href="/eventi/senti-come-suona"
          className="bg-bb-ink text-bb-cream mt-6 inline-block px-5 py-3 text-[15px] font-bold"
        >
          Intanto, scopri Senti Come Suona →
        </Link>
      </div>
    </div>
  )
}
