import { cn } from "@/lib/utils"

// Striscia decorativa "cornice tribale": il file sorgente è un pattern
// quadrato molto denso (tante piccole icone), quindi rimpicciolirlo intero
// in una striscia sottile e ripeterlo lo rende illeggibile (rumore). Qui
// invece ne mostriamo un RITAGLIO a piena larghezza (background-size:
// cover, senza repeat): resta una sola immagine, le forme restano
// leggibili alla dimensione della striscia. Fallback CSS se Storage non è
// raggiungibile.
export function TribaleStrip({
  url,
  position,
  className,
}: {
  url: string | null
  position: "top" | "bottom"
  className?: string
}) {
  if (!url) {
    return (
      <div
        className={cn(
          "h-8 w-full bg-[repeating-linear-gradient(135deg,#7c1fd6_0_10px,#f5d90a_10px_20px,#d6249f_20px_30px)] sm:h-10 lg:h-12",
          className
        )}
        aria-hidden
      />
    )
  }

  return (
    <div
      className={cn("h-8 w-full bg-no-repeat sm:h-10 lg:h-12", className)}
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: "cover",
        backgroundPosition: position === "top" ? "center 15%" : "center 85%",
      }}
      aria-hidden
    />
  )
}
