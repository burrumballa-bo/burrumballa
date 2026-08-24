import Link from "next/link"
import type { CSSProperties } from "react"

import type { CalendarDay } from "@/lib/calendar"

const ACCENT_CYCLE = ["#7e3fae", "#f6a323", "#ec1e89", "#8be03c"]
const ROTATIONS = [-1.4, 1.4]

interface WeekGridProps {
  days: CalendarDay[]
  showDates?: boolean
  restLabel?: string
  todayLabel?: string
  eventLabel?: string
}

// Griglia settimanale a 7 colonne (lun–dom) usata sia dal calendario "cosa
// succede" di Home (con date reali) sia dall'orario settimanale di Corsi
// (solo lo schema ricorrente, senza date): la differenza è tutta nei dati
// (`CalendarDay[]`), non nel componente.
export function WeekGrid({
  days,
  showDates = false,
  restLabel = "Nessuna attività",
  todayLabel = "OGGI",
  eventLabel = "EVENTO",
}: WeekGridProps) {
  const weekHasNoActivity = days.every((day) => day.isRest)

  return (
    <div className="overflow-x-auto pb-2 lg:overflow-visible lg:pb-0">
      <div
        className="grid min-w-(--week-grid-min-w) gap-x-2.5 gap-y-4 pt-2 lg:min-w-0"
        style={
          {
            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
            "--week-grid-min-w": `${Math.round((720 * days.length) / 7)}px`,
          } as CSSProperties
        }
      >
        {days.map((day, dayIndex) => {
          const accent = ACCENT_CYCLE[dayIndex % ACCENT_CYCLE.length]
          const rotation = ROTATIONS[dayIndex % 2]

          return (
            <div
              key={dayIndex}
              className="relative min-w-0 rounded-[2px] border-2 px-1 py-2.5 text-center"
              style={{
                borderColor: accent,
                background: day.isRest ? "var(--color-bb-cream)" : "var(--color-bb-ink)",
                color: day.isRest
                  ? "color-mix(in srgb, var(--color-bb-ink) 55%, transparent)"
                  : "var(--color-bb-cream)",
                boxShadow: day.isRest ? "none" : `4px 4px 0 ${accent}`,
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <div className="font-display text-[13px] tracking-wide">{day.weekdayLabel}</div>
              {showDates && day.dayNumber !== null && (
                <div className="mt-0.5 text-[11px] font-semibold opacity-75">{day.dayNumber}</div>
              )}
              {day.isToday && (
                <div
                  className="bg-bb-green font-display absolute -top-2 -right-2 rounded-[2px] px-1.5 py-0.5 text-[8px] tracking-wide text-[#1a1a1a]"
                  style={{ transform: "rotate(6deg)" }}
                >
                  {todayLabel}
                </div>
              )}
            </div>
          )
        })}

        {weekHasNoActivity ? (
          <div
            className="flex items-center justify-center rounded-[2px] border-2 px-2.5 py-8 text-center"
            style={{
              gridColumn: "1 / -1",
              borderColor: "color-mix(in srgb, var(--color-bb-ink) 30%, transparent)",
              background: "color-mix(in srgb, var(--color-bb-ink) 6%, var(--color-bb-cream))",
              boxShadow: "4px 4px 0 color-mix(in srgb, var(--color-bb-ink) 22%, transparent)",
            }}
          >
            <div
              className="text-[12px] leading-tight font-semibold"
              style={{ color: "color-mix(in srgb, var(--color-bb-ink) 50%, transparent)" }}
            >
              {restLabel}
            </div>
          </div>
        ) : (
          days.map((day, dayIndex) => (
            <div key={dayIndex} className="flex min-w-0 flex-col gap-4">
              {day.items.map((item, itemIndex) => {
                const cardStyle = {
                  borderColor: item.color,
                  background: item.isEvent ? item.color : "var(--color-bb-cream)",
                  color: item.isEvent ? "#fff" : "var(--color-bb-ink)",
                  boxShadow: `4px 4px 0 ${item.color}`,
                  transform: `rotate(${(itemIndex % 2 === 0 ? -1 : 1) * 1.2}deg)`,
                }
                const card = (
                  <div className="rounded-[2px] border-2 px-2.5 py-2" style={cardStyle}>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-extrabold tabular-nums"
                        style={{ color: item.isEvent ? "#fff" : item.color }}
                      >
                        {item.time}
                      </span>
                      {item.isEvent && (
                        <span className="ml-auto text-[9px] font-extrabold italic">
                          {eventLabel}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[12px] leading-tight font-extrabold">
                      {item.title}
                    </div>
                  </div>
                )

                return item.href ? (
                  <Link key={itemIndex} href={item.href}>
                    {card}
                  </Link>
                ) : (
                  <div key={itemIndex}>{card}</div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
