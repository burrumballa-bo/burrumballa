import Image from "next/image"

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
  { text: "CREW", className: "top-[38%] left-[5%] text-xl", colorClassName: "text-bb-green/65", rotate: -9 },
  { text: "CIPHER", className: "top-[94%] right-[3%] text-base", colorClassName: "text-bb-pink/70", rotate: -7 },
]

// Decorazioni "centrali": stanno dentro la colonna dei contenuti (non solo
// nei margini laterali), quindi in gran parte dei viewport finiscono dietro
// a card/sezioni opache — è voluto: sbucano solo nei varchi (padding tra
// sezioni, spazi vuoti), a bassa opacità, per non competere col contenuto.
const CENTRAL_TAGS: Array<{ text: string; className: string; colorClassName: string; rotate: number }> = [
  { text: "STYLE", className: "top-[24%] left-[68%] text-base", colorClassName: "text-bb-pink/35", rotate: 6 },
  { text: "GRAFFITI", className: "top-[36%] left-[45%] text-base", colorClassName: "text-bb-purple/40", rotate: 4 },
  { text: "SKATERS", className: "top-[47%] left-[20%] text-base", colorClassName: "text-bb-green/35", rotate: -4 },
  { text: "RESPECT", className: "top-[59%] left-[75%] text-base", colorClassName: "text-bb-orange/35", rotate: -6 },
  { text: "COOL", className: "top-[71%] left-[35%] text-base", colorClassName: "text-bb-pink/30", rotate: -8 },
  { text: "BROOKLYN", className: "top-[85%] left-[58%] text-base", colorClassName: "text-bb-purple/35", rotate: 14 },
]

// Sfondo delle 4 pagine del sito pubblico: montato una volta in SiteShell
// (non per pagina), `fixed inset-0` così resta ancorato alla viewport —
// dimensione e posizione fisse — mentre il contenuto ci scorre sopra
// (invece di scorrere insieme, come prima con `absolute`). Nero, muro di
// mattoni, il murales "Burrumballa" al centro e poche tag sparse nei
// margini: un vicolo underground/ostile, non l'architettura pulita delle
// vecchie finestre. Usa i token bb-ink/bb-cream/bb-*, quindi
// segue da solo il tema del sito (vedi tema scuro in
// /admin/contenuti/impostazioni-generali — di default il sito ora parte in
// scuro con sfondo nero, vedi DEFAULT_THEME_CONTENT).
export function WallBackground() {
  return (
    <div aria-hidden="true" className="bg-bb-cream fixed inset-0 -z-10 overflow-hidden">
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

      {/* Vignetta: scurisce i bordi per dare profondità al muro, sempre
          visibile a ogni larghezza. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.6)_100%)]" />

      {/* Murales al centro della viewport: il pezzo forte del muro. */}
      <div className="absolute top-1/2 left-1/2 h-96 w-96 max-w-[85%] -translate-x-1/2 -translate-y-1/2 rotate-1 opacity-90 sm:h-125 sm:w-125">
        <Image
          src="/decor/burrumballa-murales.png"
          alt=""
          fill
          className="object-contain"
          sizes="(min-width: 640px) 500px, 380px"
          priority
        />
      </div>

      {/* Decorazioni di margine (tag): vivono fuori dal container centrale
          (max-w-1200px), quindi hanno senso solo dove quel margine esiste
          davvero (~120px per lato, oltre i 1440px). Sotto quella soglia il
          contenuto è full-width e finirebbero sopra a testo o barre opache. */}
      <div className="hidden min-[1440px]:contents">
        {TAGS.map((tag) => (
          <WallTag key={tag.text} {...tag} className={`absolute ${tag.className}`} />
        ))}
      </div>

      {/* Decorazioni centrali: nessun gate di viewport, sono pensate per
          sbucare nei varchi del contenuto a qualunque larghezza. */}
      {CENTRAL_TAGS.map((tag) => (
        <WallTag key={tag.text} {...tag} className={`absolute ${tag.className}`} />
      ))}
    </div>
  )
}
