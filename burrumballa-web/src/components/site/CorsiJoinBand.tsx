import Link from "next/link"

import type { CorsiContent } from "@/lib/cms/types"
import { Kicker } from "./Kicker"

interface CorsiJoinBandProps {
  content: CorsiContent["join"]
}

// Banda finale "Iscriviti a un corso": stessa card mostrata in fondo alla
// pagina Corsi e in ogni pagina di dettaglio corso, sempre sourced dal
// contenuto configurabile in Contenuti — Corsi (site_pages "corsi".join).
export function CorsiJoinBand({ content }: CorsiJoinBandProps) {
  return (
    <div className="bg-bb-ink text-bb-cream grid grid-cols-1 items-center gap-8 p-8 md:grid-cols-[1.3fr_1fr] md:p-10">
      <div>
        <Kicker color="#8be03c">{content.kicker}</Kicker>
        <h2 className="font-display mt-2 mb-3 text-[32px] leading-[1] tracking-[-1.5px] md:text-[40px]">
          {content.title}
        </h2>
        <p className="text-bb-cream/75 max-w-[440px] text-[15px] leading-relaxed">{content.body}</p>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/eventi"
          className="bg-bb-green px-5.5 py-4 text-center text-base font-bold text-[#1a1a1a]"
        >
          {content.ctaLabel} →
        </Link>
        <div className="text-bb-cream/55 text-center text-[13px]">{content.note}</div>
      </div>
    </div>
  )
}
