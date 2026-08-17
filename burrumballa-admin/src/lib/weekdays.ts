// day_of_week segue Date.prototype.getDay(): 0 = domenica ... 6 = sabato
// (stessa convenzione usata dal calendario del sito pubblico).
export const WEEKDAY_OPTIONS = [
  { value: "1", label: "Lunedì" },
  { value: "2", label: "Martedì" },
  { value: "3", label: "Mercoledì" },
  { value: "4", label: "Giovedì" },
  { value: "5", label: "Venerdì" },
  { value: "6", label: "Sabato" },
  { value: "0", label: "Domenica" },
]

export function weekdayLabel(dayOfWeek: number): string {
  return WEEKDAY_OPTIONS.find((option) => Number(option.value) === dayOfWeek)?.label ?? "—"
}
