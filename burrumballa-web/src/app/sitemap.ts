import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.burrumballa.it"

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/eventi/senti-come-suona", "/privacy", "/cookie-policy"]

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }))
}
