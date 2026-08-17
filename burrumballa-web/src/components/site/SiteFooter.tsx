import type { FooterContent } from "@/lib/cms/types"
import { Logomark } from "./Logomark"

interface SiteFooterProps {
  content: FooterContent
}

export function SiteFooter({ content }: SiteFooterProps) {
  return (
    <div className="bg-bb-ink text-bb-cream mt-12 md:mt-[50px]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-6 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Logomark borderColor="#ffffff" />
            <span className="font-display text-[19px]">BURRUMBALLA</span>
          </div>
          <p className="mt-3.5 max-w-[300px] text-[13px] leading-normal text-neutral-300">
            {content.tagline}
          </p>
        </div>

        <div>
          <div className="text-bb-green font-display mb-3 text-[13px]">DOVE</div>
          <div className="text-[13px] leading-loose text-neutral-200">
            {content.locationName}
            <br />
            {content.addressLine1}
            <br />
            {content.addressLine2}
          </div>
        </div>

        <div>
          <div className="text-bb-green font-display mb-3 text-[13px]">CONTATTI</div>
          <div className="text-[13px] leading-loose text-neutral-200">
            Instagram @{content.instagramHandle}
            <br />
            {content.contactNote}
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-700 px-6 py-4 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Burrumballa · {content.rightsNote}
      </div>
    </div>
  )
}
