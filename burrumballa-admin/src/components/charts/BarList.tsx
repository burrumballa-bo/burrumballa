import { useState } from "react"

export interface BarListItem {
  key: string
  label: string
  value: number
  /** Testo secondario nel tooltip (es. "su 18 iscritti"). */
  hint?: string
}

interface BarListProps {
  items: BarListItem[]
  formatValue?: (v: number) => string
  /** Colore delle barre: una sola tinta, la misura e' una. */
  color?: string
  ariaLabel: string
}

// Barre orizzontali per confrontare poche categorie: valore in punta a
// ogni barra (sono poche), una sola tinta.
export function BarList({
  items,
  formatValue = (v) => String(v),
  color = "var(--chart-1)",
  ariaLabel,
}: BarListProps) {
  const [active, setActive] = useState<string | null>(null)
  const max = Math.max(...items.map((i) => i.value), 0)

  if (items.length === 0) return <p className="text-muted-foreground text-sm">Nessun dato.</p>

  return (
    <ul className="space-y-2.5" aria-label={ariaLabel}>
      {items.map((item) => (
        <li
          key={item.key}
          tabIndex={0}
          className="grid grid-cols-[minmax(5rem,9rem)_1fr] items-center gap-3 text-sm outline-none"
          onPointerEnter={() => setActive(item.key)}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(item.key)}
          onBlur={() => setActive(null)}
          title={item.hint ? `${item.label}: ${formatValue(item.value)} ${item.hint}` : undefined}
        >
          <span className="truncate" title={item.label}>
            {item.label}
          </span>
          <span className="flex items-center gap-2">
            <span
              className="h-4 rounded-r transition-opacity"
              style={{
                width: max > 0 ? `calc(${(item.value / max) * 100}% - 3rem)` : 0,
                minWidth: item.value > 0 ? 3 : 0,
                backgroundColor: color,
                opacity: active === null || active === item.key ? 1 : 0.55,
              }}
              aria-hidden
            />
            <span className="font-medium tabular-nums">{formatValue(item.value)}</span>
            {active === item.key && item.hint && (
              <span className="text-muted-foreground text-xs">{item.hint}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}
