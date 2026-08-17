import type { CourseWithLevels, EventItem } from "./cms/types"

// Etichette in italiano indicizzate come Date.prototype.getDay() (0 = dom).
const WEEKDAY_LABELS = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"]
const MONTH_LABELS = [
  "gen", "feb", "mar", "apr", "mag", "giu",
  "lug", "ago", "set", "ott", "nov", "dic",
]
const MONDAY_FIRST_WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export interface CalendarItem {
  title: string
  time: string
  isEvent: boolean
  color: string
  href?: string
}

export interface CalendarDay {
  date: Date | null
  weekdayLabel: string
  dayNumber: number | null
  isToday: boolean
  isRest: boolean
  items: CalendarItem[]
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const diffFromMonday = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - diffFromMonday)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function classItemsForWeekday(courses: CourseWithLevels[], weekday: number): CalendarItem[] {
  const items: CalendarItem[] = []
  for (const course of courses) {
    for (const level of course.levels) {
      if (level.day_of_week !== weekday) continue
      items.push({
        title: `${course.name} · ${level.level}`,
        time: level.time,
        isEvent: false,
        color: course.color,
      })
    }
  }
  return items
}

function eventItemsForDate(events: EventItem[], date: Date): CalendarItem[] {
  return events
    .filter((event) => event.show_in_calendar && event.event_date)
    .filter((event) => {
      const start = new Date(`${event.event_date}T00:00:00`)
      const end = event.event_end_date ? new Date(`${event.event_end_date}T00:00:00`) : start
      return date >= start && date <= end
    })
    .map((event) => ({
      title: event.title,
      time: event.event_time ?? "",
      isEvent: true,
      color: event.color,
      href: event.cta_url ?? undefined,
    }))
}

// Vista "cosa succede" di Home: N settimane a partire dal lunedì corrente,
// con lezioni ricorrenti + eventi puntuali che cadono in quei giorni.
export function buildRollingCalendar(
  courses: CourseWithLevels[],
  events: EventItem[],
  weeks: number,
  today: Date = new Date()
): CalendarDay[] {
  const monday = startOfWeekMonday(today)
  const now = new Date(today)
  now.setHours(0, 0, 0, 0)
  const days: CalendarDay[] = []

  for (let i = 0; i < weeks * 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const items = [
      ...classItemsForWeekday(courses, date.getDay()),
      ...eventItemsForDate(events, date),
    ].sort((a, b) => a.time.localeCompare(b.time))

    days.push({
      date,
      weekdayLabel: WEEKDAY_LABELS[date.getDay()],
      dayNumber: date.getDate(),
      isToday: isSameDay(date, now),
      isRest: items.length === 0,
      items,
    })
  }
  return days
}

// Vista "il settimanale" di Corsi: solo lo schema ricorrente lun–dom, senza
// date reali né eventi (gli eventi vivono nella pagina Eventi).
export function buildWeeklySchedule(courses: CourseWithLevels[]): CalendarDay[] {
  return MONDAY_FIRST_WEEKDAY_ORDER.map((weekday) => {
    const items = classItemsForWeekday(courses, weekday).sort((a, b) =>
      a.time.localeCompare(b.time)
    )
    return {
      date: null,
      weekdayLabel: WEEKDAY_LABELS[weekday],
      dayNumber: null,
      isToday: false,
      isRest: items.length === 0,
      items,
    }
  })
}

export function formatDateRangeLabel(start: Date, days: number): string {
  const end = new Date(start)
  end.setDate(start.getDate() + days - 1)
  const fmt = (d: Date) => `${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`
  return `${fmt(start)} – ${fmt(end)}`
}

export function startOfCurrentWeek(today: Date = new Date()): Date {
  return startOfWeekMonday(today)
}
