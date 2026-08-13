import type { Metadata } from "next"

import { formatDeadlineDate, formatEventDate, type EventInfo } from "@/lib/event-info"

export function buildEventMetadata(eventInfo: EventInfo): Metadata {
  const dataEvento = formatEventDate(
    eventInfo.data_evento,
    eventInfo.ora_inizio,
    eventInfo.ora_fine
  )
  const title = dataEvento ? `${eventInfo.titolo} — ${dataEvento}` : eventInfo.titolo
  const description =
    (eventInfo.descrizione ??
      `Iscrizioni entro il ${formatDeadlineDate(eventInfo.scadenza_iscrizioni)}.`) +
    " Iscriviti online: workshop, battle e pagamento in un unico form."

  return {
    title,
    description,
    keywords: [
      "Senti Come Suona",
      "Burrumballa",
      "battle hip hop",
      "battle waacking",
      "workshop danza",
      "evento hip hop",
    ],
    alternates: {
      canonical: "/eventi/senti-come-suona",
    },
    robots: {
      index: true,
      follow: true,
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
