import type { MetadataRoute } from "next"

import { listPublishedEvents } from "@/lib/event-info"

// Rigenerata ogni ora: nuovi eventi pubblicati entrano senza un nuovo deploy.
export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.burrumballa.it"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await listPublishedEvents()
  const routes = [
    "/",
    ...events.map((e) => `/eventi/${e.slug}`),
    "/privacy",
    "/cookie-policy",
  ]

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }))
}
