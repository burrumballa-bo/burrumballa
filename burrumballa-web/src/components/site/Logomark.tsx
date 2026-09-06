interface LogomarkProps {
  size?: number
  borderColor?: string
  className?: string
}

// Monogramma circolare usato come segnaposto del logo finché non ne viene
// caricato uno reale (nessun asset binario da mantenere nel repo).
export function Logomark({ size = 42, borderColor = "#1a1a1a", className = "" }: LogomarkProps) {
  return (
    <span
      className={`font-display bg-bb-purple inline-flex shrink-0 items-center justify-center text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        border: `2px solid ${borderColor}`,
      }}
      aria-hidden="true"
    >
      B
    </span>
  )
}
