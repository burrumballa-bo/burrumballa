import type { EventOptionStato } from "@/types/eventOption"

export type OptionAvailability = "disponibile" | "in_esaurimento" | "sold_out"

// Soglia "in esaurimento": ultimo 20% dei posti (min 1 posto rimasto).
const LOW_AVAILABILITY_RATIO = 0.2

export function getOptionAvailability(
  option: Pick<EventOptionStato, "max_posti" | "iscritti" | "sold_out">
): OptionAvailability {
  if (option.sold_out) return "sold_out"
  if (option.max_posti == null) return "disponibile"

  const rimasti = option.max_posti - option.iscritti
  const soglia = Math.max(1, Math.ceil(option.max_posti * LOW_AVAILABILITY_RATIO))
  if (rimasti <= soglia) return "in_esaurimento"
  return "disponibile"
}

export const OPTION_AVAILABILITY_LABELS: Record<OptionAvailability, string> = {
  disponibile: "Disponibile",
  in_esaurimento: "In esaurimento",
  sold_out: "SOLD OUT",
}

export const OPTION_AVAILABILITY_BADGE_CLASSES: Record<OptionAvailability, string> = {
  disponibile:
    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  in_esaurimento:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  sold_out:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
}
