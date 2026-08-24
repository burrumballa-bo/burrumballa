import Link from "next/link"

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
  restLabel = "riposo",
  todayLabel = "OGGI",
  eventLabel = "EVENTO",
}: WeekGridProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[720px] grid-cols-7 gap-x-2.5 gap-y-5 pt-2">
        {days.map((day, dayIndex) => {
          const accent = ACCENT_CYCLE[dayIndex % ACCENT_CYCLE.length]
          const rotation = ROTATIONS[dayIndex % 2]

          return (
            <div key={dayIndex} className="flex min-w-0 flex-col gap-4">
              <div
                className="relative rounded-[2px] border-2 px-1 py-2.5 text-center"
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

              <div className="flex flex-col gap-4">
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
                {day.isRest && (
                  <div className="text-bb-ink/40 mt-1.5 text-center text-[11px] italic">
                    {restLabel}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
