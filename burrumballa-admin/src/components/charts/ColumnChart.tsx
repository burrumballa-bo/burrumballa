import { useEffect, useRef, useState } from "react"

export interface ChartSeries {
  name: string
  /** Colore CSS (es. "var(--chart-1)"). */
  color: string
}

export interface ColumnDatum {
  /** Etichetta breve sull'asse (es. "ott"). */
  label: string
  /** Etichetta completa nel tooltip (es. "ottobre 2026"). */
  tooltipLabel: string
  /** Un valore per serie, nello stesso ordine di `series`. */
  values: number[]
}

interface ColumnChartProps {
  data: ColumnDatum[]
  series: ChartSeries[]
  formatValue?: (v: number) => string
  /** Formato compatto per l'asse y (default formatValue). */
  formatTick?: (v: number) => string
  height?: number
  ariaLabel: string
}

const AXIS_W = 44
const LABEL_H = 22
const TOP = 18
const MAX_BAR = 24
const RADIUS = 4
const GAP = 2

// Tick "puliti" (1, 2, 5 x 10^n) per l'asse y.
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1]
  const raw = max / count
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? pow * 10
  const ticks: number[] = []
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 100) / 100)
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

// Rettangolo con solo gli angoli in alto arrotondati (base quadrata).
function topRoundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

export function ColumnChart({
  data,
  series,
  formatValue = (v) => String(v),
  formatTick,
  height = 200,
  ariaLabel,
}: ColumnChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)

  const totals = data.map((d) => d.values.reduce((a, b) => a + b, 0))
  const ticks = niceTicks(Math.max(...totals, 0))
  const maxTick = ticks[ticks.length - 1]
  const plotW = Math.max(width - AXIS_W, 0)
  const plotH = height - TOP - LABEL_H
  const band = data.length > 0 ? plotW / data.length : 0
  const barW = Math.min(MAX_BAR, band * 0.6)
  const y = (v: number) => TOP + plotH - (v / maxTick) * plotH
  const tick = formatTick ?? formatValue
  const lastIndex = data.length - 1
  // Con colonne strette un'etichetta ogni due (contando dall'ultima); il tooltip ha sempre il mese.
  const labelEvery = band < 34 ? 2 : 1

  return (
    <div ref={ref} className="relative w-full min-w-0">
      {series.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-4 text-xs">
          {series.map((s) => (
            <span key={s.name} className="text-muted-foreground flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: s.color }} aria-hidden />
              {s.name}
            </span>
          ))}
        </div>
      )}
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={AXIS_W}
                x2={width}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--border)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={AXIS_W - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {tick(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const cx = AXIS_W + band * i + band / 2
            let acc = 0
            const segments = d.values.map((v, si) => {
              const top = y(acc + v)
              const bottom = y(acc)
              acc += v
              return { v, si, top, bottom }
            })
            const visible = segments.filter((s) => s.v > 0)
            return (
              <g key={d.label + i} opacity={active === null || active === i ? 1 : 0.55}>
                {visible.map((s, idx) => {
                  const isTop = idx === visible.length - 1
                  // 2px di superficie tra i segmenti impilati.
                  const h = Math.max(s.bottom - s.top - (idx > 0 ? GAP : 0), 0)
                  return isTop ? (
                    <path
                      key={s.si}
                      d={topRoundedRect(cx - barW / 2, s.top, barW, h, RADIUS)}
                      fill={series[s.si].color}
                    />
                  ) : (
                    <rect key={s.si} x={cx - barW / 2} y={s.top} width={barW} height={h} fill={series[s.si].color} />
                  )
                })}
                {((lastIndex - i) % labelEvery === 0 || active === i) && (
                <text
                  x={cx}
                  y={height - 6}
                  textAnchor="middle"
                  className={
                    active === i
                      ? "fill-foreground text-[10px] font-medium"
                      : "fill-muted-foreground text-[10px]"
                  }
                >
                  {d.label}
                </text>
                )}
                {/* Etichetta diretta solo sul periodo corrente; il resto e' nel tooltip e nella tabella. */}
                {i === lastIndex && totals[i] > 0 && (
                  <text
                    x={cx + barW / 2}
                    y={y(totals[i]) - 5}
                    textAnchor="end"
                    className="fill-foreground text-[10px] font-medium tabular-nums"
                  >
                    {formatValue(totals[i])}
                  </text>
                )}
                <rect
                  x={AXIS_W + band * i}
                  y={TOP}
                  width={band}
                  height={plotH + LABEL_H}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${d.tooltipLabel}: ${formatValue(totals[i])}`}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="cursor-default outline-none"
                />
              </g>
            )
          })}
        </svg>
      )}

      {active !== null && data[active] && (
        // Accanto alla colonna (a destra, o a sinistra nella meta' destra) per non coprirla.
        <div
          className="bg-popover text-popover-foreground pointer-events-none absolute z-10 rounded-md border px-3 py-2 text-xs whitespace-nowrap shadow-md"
          style={{
            left: AXIS_W + band * active + band / 2 + (active < data.length / 2 ? barW / 2 + 8 : -barW / 2 - 8),
            transform: active < data.length / 2 ? undefined : "translateX(-100%)",
            top: TOP + (series.length > 1 ? 24 : 0),
          }}
        >
          <p className="text-muted-foreground mb-1">{data[active].tooltipLabel}</p>
          {series.map((s, si) => (
            <p key={s.name} className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded" style={{ backgroundColor: s.color }} aria-hidden />
              <span className="font-semibold tabular-nums">{formatValue(data[active].values[si])}</span>
              {series.length > 1 && <span className="text-muted-foreground">{s.name}</span>}
            </p>
          ))}
          {series.length > 1 && (
            <p className="mt-1 border-t pt-1">
              <span className="font-semibold tabular-nums">{formatValue(totals[active])}</span>{" "}
              <span className="text-muted-foreground">totale</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
