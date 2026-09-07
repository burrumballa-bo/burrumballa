"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Logomark } from "./Logomark"
import { SprayStroke } from "./SprayStroke"

const NAV_ITEMS = [
  { key: "home", href: "/", label: "Home" },
  { key: "corsi", href: "/corsi", label: "Corsi" },
  { key: "eventi", href: "/eventi", label: "Eventi" },
  { key: "chi-siamo", href: "/chi-siamo", label: "Chi siamo" },
] as const

export type SiteSection = (typeof NAV_ITEMS)[number]["key"]

interface SiteNavProps {
  active: SiteSection
  logoUrl?: string | null
}

// Voce di nav in font Permanent Marker (lo stesso del Kicker): quella
// attiva prende come sfondo una SprayStroke grande quanto la scritta, stile
// bomboletta, con il testo che passa a bianco per restare leggibile sul
// rosa pieno sotto (bianco fisso, non un token bb-*, perché il rosa del
// brand non cambia con il tema mentre i token sì).
//
// `leading-none` sul testo riduce il line-box di Permanent Marker (molto
// più alto del disegno visibile dei glifi) così la SprayStroke, stirata
// con inset asimmetrici tarati a occhio sul rendering reale, copre bene i
// glifi senza sembrare più alta del necessario.
//
// L'ancora `relative` (+ padding) per lo SprayStroke sta su uno <span>
// interno dimensionato al contenuto, non sul <Link>: nel menu mobile
// `block` fa sì che il <Link>, dentro il `flex flex-col` del dropdown,
// venga stirato a larghezza piena (stretch di default sul cross-axis).
// Se l'ancora fosse sul Link, lo SprayStroke — che si allarga col
// `-inset-x-3` al box del genitore — coprirebbe l'intera riga invece che
// il solo testo. Lo span interno resta invece dimensionato al contenuto
// (main-axis del Link, non stirato), quindi il Link esterno può restare
// a tutta larghezza per un'area di tap comoda senza deformare
// l'evidenziazione.
function NavLink({
  href,
  label,
  isActive,
  onClick,
  block = false,
}: {
  href: string
  label: string
  isActive: boolean
  onClick?: () => void
  block?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "font-marker items-center text-[16px] leading-none tracking-wide transition-colors",
        block ? "flex" : "inline-flex",
        isActive ? "text-white" : "text-bb-ink hover:text-bb-pink",
      )}
    >
      <span className="relative inline-flex items-center px-1.5 py-2">
        {isActive && (
          <SprayStroke className="text-bb-pink pointer-events-none absolute -inset-x-3 -top-2 -bottom-3.5 -z-10 -rotate-1" />
        )}
        <span className="relative">{label}</span>
      </span>
    </Link>
  )
}

export function SiteNav({ active, logoUrl }: SiteNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-bb-ink bg-bb-cream sticky top-0 z-50 border-b-[3px]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- immagine da signed URL Supabase
            <img src={logoUrl} alt="Burrumballa" className="h-[42px] w-auto" />
          ) : (
            <Logomark />
          )}
          <span className="font-display text-[19px] tracking-[-1px]">BURRUMBALLA</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.key} href={item.href} label={item.label} isActive={item.key === active} />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="site-mobile-nav"
          aria-label={open ? "Chiudi il menu" : "Apri il menu"}
          className="border-bb-ink flex h-10 w-10 items-center justify-center border-[2.5px] md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* `isolate` è necessario: senza uno stacking context proprio, questo
          dropdown è solo un discendente posizionato con z-index auto, e nel
          painting order il suo `bg-bb-cream` finisce *sopra* lo SprayStroke
          della voce attiva (che sta a `-z-10`), nascondendolo. Con `isolate`
          il -z-10 viene risolto dentro il dropdown, quindi lo stroke si
          dipinge sopra il suo sfondo, come già accade in desktop grazie al
          wrapper `sticky z-50`. */}
      {open && (
        <div
          id="site-mobile-nav"
          className="border-bb-ink bg-bb-cream absolute top-full right-0 left-0 isolate flex flex-col gap-1 border-t-[2.5px] px-6 py-4 md:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              href={item.href}
              label={item.label}
              isActive={item.key === active}
              onClick={() => setOpen(false)}
              block
            />
          ))}
        </div>
      )}
    </div>
  )
}
