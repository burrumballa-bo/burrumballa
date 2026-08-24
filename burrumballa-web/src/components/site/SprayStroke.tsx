interface SprayStrokeProps {
  className?: string
}

// Sottolineatura "a bomboletta" per la voce di nav attiva: una singola
// linea larga tracciata a mano, con angoli sempre tondi (mai squadrati) —
// ottenuti disegnando delle linee (non poligoni chiusi) con stroke molto
// spesso e `strokeLinecap`/`strokeLinejoin: round`, che arrotondano
// automaticamente ogni estremità e ogni piega. Una seconda passata più
// sottile lungo il bordo inferiore aggiunge un'irregolarità organica solo
// in basso, sempre con estremità tonde. Chiude con una colata (linea +
// goccia separata), anch'essa a estremità tonde. Onda diversa da SprayBlob
// (hero) così le due non sembrano copiate, anche se costruite allo stesso
// modo.
//
// `className` (posizionamento assoluto + inset) va sul <div> esterno, non
// sull'<svg> — vedi il commento in SprayBlob.tsx per il perché: un <svg> è
// un replaced element e con top+bottom espliciti insieme a un'altezza
// esplicita lo spec CSS ne ignora uno dei due.
export function SprayStroke({ className = "" }: SprayStrokeProps) {
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 200 84" preserveAspectRatio="none" className="h-full w-full">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          {/* Corpo della pennellata */}
          <path d="M20,34 C55,22 95,44 135,28 C152,21 168,30 180,34" strokeWidth="38" />
          {/* Irregolarità del bordo inferiore */}
          <path d="M35,50 C60,57 85,44 110,53 C130,60 150,48 165,51" strokeWidth="18" />
          {/* Colata */}
          <path d="M120,55 L117,76" strokeWidth="13" />
        </g>
        <circle cx="102" cy="80" r="5" fill="currentColor" />
      </svg>
    </div>
  )
}
