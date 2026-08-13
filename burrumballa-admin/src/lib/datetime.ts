// Conversioni tra timestamp ISO (con timezone, come salvato su Supabase)
// e il formato richiesto da <input type="datetime-local"> (senza timezone,
// interpretato nel fuso orario locale del browser).

export function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function datetimeLocalToIso(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

// Formatta una data "YYYY-MM-DD" come "27 settembre 2026", senza
// incorrere in scarti di fuso orario (parsing come data locale, non UTC).
export function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m || !d) return ""
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d))
}
