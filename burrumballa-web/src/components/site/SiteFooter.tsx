import type { FooterContent } from "@/lib/cms/types"
import { Logomark } from "./Logomark"

interface SiteFooterProps {
  content: FooterContent
  logoUrl?: string | null
}

// Il footer resta sempre scuro (colori letterali, non i token bb-ink/
// bb-cream che si invertono in tema scuro): è una barra di chiusura fissa
// su ogni pagina, non un blocco "a comparsa" come il teaser chi-siamo o i
// bottoni, quindi deve restare visivamente ancorato invece di diventare
// una fascia chiara in fondo a una pagina scura.
export function SiteFooter({ content, logoUrl }: SiteFooterProps) {
  return (
    <div className="mt-12 bg-[#1a1a1a] text-[#f4f1ea] md:mt-[50px]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-6 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- immagine da signed URL Supabase
              <img src={logoUrl} alt="Burrumballa" className="h-[42px] w-auto" />
            ) : (
              <Logomark borderColor="#ffffff" />
            )}
            <span className="font-display text-[19px]">BURRUMBALLA</span>
          </div>
          <p className="mt-3.5 max-w-[300px] text-[13px] leading-normal text-[#f4f1ea]/75">
            {content.tagline}
          </p>
        </div>

        <div>
          <div className="text-bb-green font-display mb-3 text-[13px]">DOVE</div>
          <div className="text-[13px] leading-loose text-[#f4f1ea]/85">
            {content.locationName}
            <br />
            {content.addressLine1}
            <br />
            {content.addressLine2}
          </div>
        </div>

        <div>
          <div className="text-bb-green font-display mb-3 text-[13px]">CONTATTI</div>
          <div className="text-[13px] leading-loose text-[#f4f1ea]/85">
            Instagram @{content.instagramHandle}
            <br />
            {content.contactNote}
          </div>
        </div>
      </div>
      <div className="border-t border-[#f4f1ea]/20 px-6 py-4 text-center text-xs text-[#f4f1ea]/50">
        © {new Date().getFullYear()} Burrumballa · {content.rightsNote}
      </div>
    </div>
  )
}
