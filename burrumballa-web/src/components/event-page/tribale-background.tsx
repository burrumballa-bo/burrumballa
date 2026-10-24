import { cn } from "@/lib/utils"

// Texture "tribale" a tutta sezione: pattern denso ripetuto in piccolo (non
// a piena copertura come in TribaleStrip) e opacità ridotta, cosi' resta un
// dettaglio leggibile sotto testo/form invece di rumore visivo. Richiede un
// antenato con position relative (usa position:absolute + inset-0).
export function TribaleBackground({
  url,
  className,
}: {
  url: string | null
  className?: string
}) {
  if (!url) return null

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 opacity-[0.12]", className)}
      style={{
        backgroundImage: `url(${url})`,
        backgroundRepeat: "repeat",
        backgroundSize: "280px 280px",
      }}
      aria-hidden
    />
  )
}
