interface KickerProps {
  children: string
  color?: string
  className?: string
}

// Etichetta manoscritta (font Permanent Marker) usata sopra i titoli di
// sezione in tutto il sito.
export function Kicker({ children, color = "#7e3fae", className = "" }: KickerProps) {
  return (
    <div className={`font-marker text-[17px] ${className}`} style={{ color }}>
      {children}
    </div>
  )
}
