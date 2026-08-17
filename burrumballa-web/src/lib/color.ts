// Sceglie testo chiaro o scuro in base alla luminanza percepita di un colore
// esadecimale: usato per i blocchi colorati "a corso" (colore libero dal
// CMS) così il testo resta leggibile qualunque tinta scelga l'admin.
export function isLightColor(hex: string): boolean {
  const clean = hex.replace("#", "")
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some((value) => Number.isNaN(value))) return false
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6
}

export function textColorFor(hex: string): string {
  return isLightColor(hex) ? "#1a1a1a" : "#ffffff"
}
