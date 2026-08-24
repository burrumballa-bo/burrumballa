import Image from "next/image"

interface WindowHoleProps {
  className: string
}

// Finestrella "sfondata" nel muro: interrompe la trama di mattoni con un
// riquadro a croce, come le finestre industriali dei palazzi da cui prende
// ispirazione lo sfondo.
function WindowHole({ className }: WindowHoleProps) {
  return (
    <svg viewBox="0 0 48 64" className={`fill-bb-cream stroke-bb-ink/25 ${className}`} aria-hidden="true">
      <rect x="1.5" y="1.5" width="45" height="61" rx="1" strokeWidth="2.5" />
      <line x1="24" y1="1.5" x2="24" y2="62.5" className="stroke-bb-ink/20" strokeWidth="1.5" />
      <line x1="1.5" y1="32" x2="46.5" y2="32" className="stroke-bb-ink/20" strokeWidth="1.5" />
    </svg>
  )
}

interface WallTagProps {
  text: string
  className: string
  colorClassName: string
  rotate: number
}

// Tag scritta a mano (font Permanent Marker, come il Kicker) in un colore
// del brand: la firma da writer sul muro.
function WallTag({ text, className, colorClassName, rotate }: WallTagProps) {
  return (
    <span
      className={`font-marker whitespace-nowrap ${colorClassName} ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {text}
    </span>
  )
}

const TAGS: Array<{ text: string; className: string; colorClassName: string; rotate: number }> = [
  { text: "HIP HOP", className: "top-[5%] right-[6%] text-lg", colorClassName: "text-bb-pink/70", rotate: -6 },
  { text: "BREAKING", className: "top-[15%] left-[3%] text-base", colorClassName: "text-bb-orange/70", rotate: 8 },
  { text: "FUNK", className: "top-[27%] right-[2%] text-base", colorClassName: "text-bb-purple/70", rotate: -4 },
  { text: "CREW", className: "top-[38%] left-[5%] text-xl", colorClassName: "text-bb-green/65", rotate: -9 },
  { text: "HOUSE", className: "top-[50%] right-[4%] text-lg", colorClassName: "text-bb-purple/70", rotate: 5 },
  { text: "POPPING", className: "top-[61%] left-[2%] text-base", colorClassName: "text-bb-pink/65", rotate: 6 },
  { text: "808", className: "top-[73%] right-[5%] text-base", colorClassName: "text-bb-orange/70", rotate: 7 },
  { text: "VIBES", className: "top-[84%] left-[4%] text-lg", colorClassName: "text-bb-green/65", rotate: -5 },
  { text: "CIPHER", className: "top-[94%] right-[3%] text-base", colorClassName: "text-bb-pink/70", rotate: -7 },
]

// Decorazioni "centrali": stanno dentro la colonna dei contenuti (non solo
// nei margini laterali), quindi in gran parte dei viewport finiscono dietro
// a card/sezioni opache — è voluto: sbucano solo nei varchi (padding tra
// sezioni, spazi vuoti), a bassa opacità, per non competere col contenuto.
// Niente qui nel primo ~20% di altezza (hero + header) per lasciarlo pulito.
const CENTRAL_TAGS: Array<{ text: string; className: string; colorClassName: string; rotate: number }> = [
  { text: "STYLE", className: "top-[24%] left-[68%] text-base", colorClassName: "text-bb-pink/35", rotate: 6 },
  { text: "GRAFFITI", className: "top-[36%] left-[45%] text-base", colorClassName: "text-bb-purple/40", rotate: 4 },
  { text: "SKATERS", className: "top-[47%] left-[20%] text-base", colorClassName: "text-bb-green/35", rotate: -4 },
  { text: "RESPECT", className: "top-[59%] left-[75%] text-base", colorClassName: "text-bb-orange/35", rotate: -6 },
  { text: "COOL", className: "top-[71%] left-[35%] text-base", colorClassName: "text-bb-pink/30", rotate: -8 },
  { text: "BROOKLYN", className: "top-[85%] left-[58%] text-base", colorClassName: "text-bb-purple/35", rotate: 14 },
]

// Sfondo decorativo delle 4 pagine del sito pubblico (montato una volta in
// SiteShell, non per pagina): una trama di mattoni ripetuta (stile
// muratura da vicolo/underground), con finestre e tag colorate — alcune
// nei margini laterali, altre dentro la colonna dei contenuti — più un
// "adesivo" fotografico incollato al muro. Va sempre dentro un contenitore
// `relative isolate` che ne determini l'altezza (vedi SiteShell) — usa i
// token bb-ink/bb-cream/bb-*, quindi si adatta da solo al tema scuro senza
// bisogno di varianti `dark:`.
export function WallBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="bb-wall-bricks" width="88" height="44" patternUnits="userSpaceOnUse">
            <g className="stroke-bb-ink/22" strokeWidth="1.25">
              <line x1="0" y1="0" x2="88" y2="0" />
              <line x1="0" y1="22" x2="88" y2="22" />
              <line x1="0" y1="0" x2="0" y2="22" />
              <line x1="44" y1="22" x2="44" y2="44" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bb-wall-bricks)" />
      </svg>

      {/* Finestre e tag di margine vivono fuori dal container centrale
          (max-w-1200px): quel margine esiste solo quando il viewport
          supera i 1200px, quindi sotto quella soglia (tablet, mobile, e
          anche molti laptop) il contenuto è full-width e questi dettagli
          finirebbero sopra a testo o barre opache (es. la marquee).
          Restano nascosti finché non c'è margine reale (~120px per lato)
          per contenerli. Solo la trama di mattoni, sicura a ogni
          larghezza, resta visibile anche sotto soglia. */}
      <div className="hidden min-[1440px]:contents">
        <WindowHole className="absolute top-[14%] right-[5%] h-28 w-21" />
        <WindowHole className="absolute top-[52%] left-[3%] h-24 w-18" />
        <WindowHole className="absolute top-[86%] right-[4%] h-24 w-18" />

        {TAGS.map((tag) => (
          <WallTag key={tag.text} {...tag} className={`absolute ${tag.className}`} />
        ))}

        {/* "Adesivo" incollato al muro: leggermente ruotato, con un bordo
            chiaro e un'ombra per staccare dalla trama di mattoni, come una
            foto/flyer attaccata. Altezza scelta per stare nel muro libero
            della sezione "chi siamo", lontano dalle card sotto. */}
        <div className="absolute top-[20%] right-[2%] h-40 w-31 -rotate-6 overflow-hidden rounded-sm border-2 border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
          <Image
            src="/decor/wall-sticker.png"
            alt=""
            fill
            className="object-cover"
            sizes="200px"
          />
        </div>
      </div>

      {/* Decorazioni centrali: nessun gate di viewport, sono pensate per
          sbucare nei varchi del contenuto a qualunque larghezza. */}
      {CENTRAL_TAGS.map((tag) => (
        <WallTag key={tag.text} {...tag} className={`absolute ${tag.className}`} />
      ))}
    </div>
  )
}
