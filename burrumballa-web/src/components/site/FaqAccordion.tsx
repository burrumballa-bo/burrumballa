import { textColorFor } from "@/lib/color"
import type { FaqItem } from "@/lib/cms/types"

interface FaqAccordionProps {
  items: FaqItem[]
}

// Stessa rotazione di colori delle card "valori" in Chi siamo: ogni domanda
// prende il colore successivo della palette, così l'elenco resta leggibile
// anche quando è lungo.
const FAQ_PALETTE = ["#ec1e89", "#8be03c", "#7e3fae", "#f6a323"]

// Accordion senza JavaScript: <details>/<summary> nativi. Oltre a stare in
// un Server Component senza "use client", significa che le risposte sono nel
// markup anche a JS spento — quindi leggibili da motori di ricerca e
// assistenti AI, che è metà del senso di questa sezione (vedi il blocco
// "chi siamo" in home). Lo stato aperto/chiuso viene dal browser: lo stile
// ci si aggancia con la variante `group-open:`.
export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <div className="flex flex-col gap-3.5">
      {items.map((item, index) => {
        const color = FAQ_PALETTE[index % FAQ_PALETTE.length]
        return (
          <details
            key={`${index}-${item.question}`}
            name="faq"
            className="group border-bb-ink bg-bb-purple/25 open:bg-bb-purple/40 border-[3px] backdrop-blur-md transition-colors"
            style={{ borderLeft: `10px solid ${color}` }}
          >
            {/* `list-none` + la regola ::-webkit-details-marker tolgono il
                triangolino di default (WebKit lo disegna anche con
                list-style: none), sostituito dal "+" quadrato a destra. */}
            <summary className="flex cursor-pointer list-none items-start gap-4 p-5 [&::-webkit-details-marker]:hidden md:p-6">
              {/* Numero su pastiglia piena invece che testo colorato: il
                  colore del brand resta lo stesso in tema chiaro e scuro,
                  mentre il testo sopra si adatta con textColorFor (stessa
                  logica delle chip e delle card corso). */}
              <span
                className="font-display grid size-7 shrink-0 place-items-center text-[13px] leading-none"
                style={{ background: color, color: textColorFor(color) }}
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display-alt flex-1 text-[19px] leading-[1.15] tracking-[-0.3px] md:text-[23px]">
                {item.question}
              </h3>
              {/* Il riquadro resta fermo e ruota solo il glifo: il "+"
                  diventa una "×" quando la domanda è aperta. */}
              <span
                className="border-bb-ink grid size-7 shrink-0 place-items-center border-[2.5px]"
                aria-hidden="true"
              >
                <span className="font-display text-[15px] leading-none transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <div className="px-5 pb-5 md:px-6 md:pb-6">
              {/* Rientro allineato al numero + gap del summary (2.25rem su
                  desktop) così la risposta parte sotto alla domanda, non
                  sotto al numero. */}
              <p className="max-w-[70ch] text-[15px] leading-relaxed opacity-90 md:pl-[2.25rem]">
                {item.answer}
              </p>
            </div>
          </details>
        )
      })}
    </div>
  )
}
