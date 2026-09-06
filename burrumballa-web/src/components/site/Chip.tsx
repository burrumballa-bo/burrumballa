interface ChipProps {
  children: string
  background?: string
  color?: string
  rotate?: number
  className?: string
}

// Etichetta ad "adesivo" (bordo nero spesso, leggera rotazione) usata per i
// tag di disciplina/evento in tutto il sito.
export function Chip({
  children,
  background = "#fff",
  color = "#1a1a1a",
  rotate = 0,
  className = "",
}: ChipProps) {
  return (
    <span
      className={`font-display border-bb-ink inline-block border-2 px-3 py-1.5 text-xs ${className}`}
      style={{ background, color, transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  )
}
