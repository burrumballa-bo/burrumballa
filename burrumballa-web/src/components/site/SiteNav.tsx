import Link from "next/link"

import { Logomark } from "./Logomark"

const NAV_ITEMS = [
  { key: "home", href: "/", label: "Home" },
  { key: "corsi", href: "/corsi", label: "Corsi" },
  { key: "eventi", href: "/eventi", label: "Eventi" },
  { key: "chi-siamo", href: "/chi-siamo", label: "Chi siamo" },
] as const

export type SiteSection = (typeof NAV_ITEMS)[number]["key"]

interface SiteNavProps {
  active: SiteSection
}

export function SiteNav({ active }: SiteNavProps) {
  return (
    <div className="border-bb-ink bg-bb-cream sticky top-0 z-50 border-b-[3px]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Logomark />
          <span className="font-display text-[19px] tracking-[-1px]">BURRUMBALLA</span>
        </Link>

        <div className="flex items-center gap-5 text-[13px] font-semibold tracking-[.3px]">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`hidden md:inline ${item.key === active ? "border-bb-ink border-b-2 pb-0.5" : ""}`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/corsi"
            className="bg-bb-ink text-bb-cream rounded-[3px] px-4 py-2 font-bold whitespace-nowrap"
          >
            Iscriviti →
          </Link>
        </div>
      </div>
    </div>
  )
}
