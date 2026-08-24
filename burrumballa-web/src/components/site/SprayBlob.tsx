interface SprayBlobProps {
  className?: string
}

// Linea "a bomboletta" larga, come una passata di spray tracciata a mano da
// un writer: usata come sfondo dietro a un testo per farlo staccare da
// texture affollate (es. il muro di mattoni) restando "sporca" /
// underground invece che un rettangolo perfetto. Angoli sempre tondi (mai
// squadrati) — ottenuti disegnando delle linee (non poligoni chiusi) con
// stroke molto spesso e `strokeLinecap`/`strokeLinejoin: round`, che
// arrotondano automaticamente ogni estremità e ogni piega, invece di un
// path chiuso a mano libera (rischia cuspidi/angoli se le tangenti dei
// bezier non sono ben allineate). Una seconda passata più sottile lungo il
// bordo inferiore aggiunge un'irregolarità organica solo in basso, sempre
// con estremità tonde. Chiude con una colata (linea + goccia separata).
// Onda diversa da SprayStroke (nav) così le due non sembrano copiate,
// anche se costruite allo stesso modo.
//
// `className` (posizionamento assoluto + inset, es. `-inset-x-6 -top-7
// -bottom-3`) va sul <div> esterno, NON sull'<svg>: un <svg> è un
// "replaced element", e per un replaced element assolutamente posizionato
// con `top`/`bottom` ENTRAMBI specificati insieme a un'altezza esplicita
// (anche `height:100%`), lo spec CSS usa l'altezza specificata e IGNORA
// uno dei due offset — risultato: lo sfondo non si stira mai su entrambi i
// lati, ne resta sempre uno "corto". Un <div> non è un replaced element,
// quindi con `inset-*` si stira correttamente; l'<svg> dentro poi riempie
// quel box già risolto con un semplice `h-full w-full` (percentuale non
// ambigua, perché il box del div è ormai un valore concreto).
export function SprayBlob({ className = "" }: SprayBlobProps) {
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 300 118" preserveAspectRatio="none" className="h-full w-full">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          {/* Corpo della pennellata */}
          <path d="M22,46 C70,25 130,62 190,36 C225,20 255,32 278,42" strokeWidth="56" />
          {/* Irregolarità del bordo inferiore */}
          <path d="M45,72 C90,82 140,62 190,76 C220,84 250,66 268,70" strokeWidth="26" />
          {/* Colata */}
          <path d="M160,79 L155,104" strokeWidth="18" />
        </g>
        <circle cx="133" cy="110" r="7" fill="currentColor" />
      </svg>
    </div>
  )
}
