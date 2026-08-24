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

interface PlasterPatchProps {
  className: string
}

// Toppa di intonaco: una macchia organica dello stesso colore dello sfondo
// che "cancella" la muratura in quel punto, con un paio di crepe sottili.
function PlasterPatch({ className }: PlasterPatchProps) {
  return (
    <svg viewBox="0 0 160 110" className={`fill-bb-cream ${className}`} aria-hidden="true">
      <path d="M16 20 C 42 2, 92 -4, 124 14 C 152 28, 158 58, 138 80 C 116 102, 68 108, 38 96 C 8 84, -6 46, 16 20 Z" />
      <g className="stroke-bb-ink/15" strokeWidth="1.5" fill="none">
        <path d="M32 42 L62 32 L58 62" />
        <path d="M92 26 L112 54 L96 80" />
      </g>
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
  { text: "HIP HOP", className: "top-[6%] right-[5%] text-lg", colorClassName: "text-bb-pink/60", rotate: -6 },
  { text: "BREAKING", className: "top-[22%] left-[2%] text-base", colorClassName: "text-bb-orange/60", rotate: 8 },
  { text: "CREW", className: "top-[45%] right-[3%] text-xl", colorClassName: "text-bb-green/55", rotate: -9 },
  { text: "HOUSE", className: "top-[63%] left-[3%] text-lg", colorClassName: "text-bb-purple/60", rotate: 5 },
  { text: "808", className: "top-[88%] right-[4%] text-base", colorClassName: "text-bb-pink/55", rotate: 7 },
]

// Sfondo decorativo delle 4 pagine del sito pubblico (montato una volta in
// SiteShell, non per pagina): una trama di mattoni ripetuta (stile
// muratura da vicolo/underground), con qualche finestra, una toppa
// d'intonaco e delle tag colorate ai lati. Va sempre dentro un contenitore
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

      {/* Finestre, intonaco e tag vivono nei margini laterali fuori dal
          container centrale (max-w-1200px): quel margine esiste solo
          quando il viewport supera i 1200px, quindi sotto quella soglia
          (tablet, mobile, e anche molti laptop) il contenuto è full-width
          e questi dettagli finirebbero sopra a testo o barre opache (es.
          la marquee). Restano nascosti finché non c'è margine reale (~120px
          per lato) per contenerli. Solo la trama di mattoni, sicura a ogni
          larghezza, resta visibile anche sotto soglia. */}
      <div className="hidden min-[1440px]:contents">
        <WindowHole className="absolute top-[14%] left-[5%] h-16 w-12" />
        <WindowHole className="absolute top-[72%] right-[6%] h-16 w-12" />

        <PlasterPatch className="absolute top-[53%] right-[1%] h-24 w-32" />

        {TAGS.map((tag) => (
          <WallTag key={tag.text} {...tag} className={`absolute ${tag.className}`} />
        ))}
      </div>
    </div>
  )
}
