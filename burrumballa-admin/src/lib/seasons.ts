import { todayIso } from "@/lib/subscriptions"

// Una stagione e' identificata dall'anno in cui inizia: 2026 = "2026/27".
// Il mese di inizio e' configurabile (app_settings.stagione_mese_inizio).
export function seasonOf(dateIso: string, startMonth: number): number {
  const [y, m] = dateIso.split("-").map(Number)
  return m >= startMonth ? y : y - 1
}

export function currentSeason(startMonth: number): number {
  return seasonOf(todayIso(), startMonth)
}

export function seasonLabel(season: number): string {
  return `${season}/${String((season + 1) % 100).padStart(2, "0")}`
}

/** Primo e ultimo giorno (inclusi) della stagione, "YYYY-MM-DD". */
export function seasonRange(season: number, startMonth: number): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, "0")
  const end = new Date(season + 1, startMonth - 1, 0)
  return {
    from: `${season}-${pad(startMonth)}-01`,
    to: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  }
}
