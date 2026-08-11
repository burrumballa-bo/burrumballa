import type { Metadata } from "next"

import { formatDeadlineDate, formatEventDate, type EventInfo } from "@/lib/event-info"

export function buildEventMetadata(eventInfo: EventInfo): Metadata {
  const dataEvento = formatEventDate(eventInfo.data_evento)
  const title = dataEvento ? `${eventInfo.titolo} — ${dataEvento}` : eventInfo.titolo
  const description =
    (eventInfo.descrizione ??
      `Iscrizioni entro il ${formatDeadlineDate(eventInfo.scadenza_iscrizioni)}.`) +
    " Iscriviti online: workshop, battle e pagamento in un unico form."

  return {
    title,
    description,
    alternates: {
      canonical: "/eventi/senti-come-suona",
    },
    openGraph: {
      title,
      description,
      url: "/eventi/senti-come-suona",
      siteName: "Burrumballa",
      type: "website",
      locale: "it_IT",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}
