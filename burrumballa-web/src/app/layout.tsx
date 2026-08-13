import type { Metadata } from "next"
import "./globals.css"

import { Toaster } from "@/components/ui/sonner"
import { getOrgInfo } from "@/lib/org-info"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.burrumballa.it"

const TITLE_DEFAULT = "Burrumballa — Scuola di Ballo"
const DESCRIPTION =
  "Burrumballa è una scuola di ballo: corsi, workshop ed eventi hip hop, waacking e danze urbane. Scopri i prossimi eventi e iscriviti online."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE_DEFAULT,
    template: "%s · Burrumballa",
  },
  description: DESCRIPTION,
  keywords: [
    "Burrumballa",
    "scuola di ballo",
    "corsi di ballo",
    "hip hop",
    "waacking",
    "danze urbane",
    "battle",
    "workshop danza",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: TITLE_DEFAULT,
    description: DESCRIPTION,
    url: "/",
    siteName: "Burrumballa",
    type: "website",
    locale: "it_IT",
  },
  twitter: {
    card: "summary",
    title: TITLE_DEFAULT,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const orgInfo = await getOrgInfo()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DanceSchool",
    name: orgInfo.intestazione ?? "Burrumballa",
    url: SITE_URL,
    ...(orgInfo.indirizzo ? { address: orgInfo.indirizzo } : {}),
    ...(orgInfo.email_contatto ? { email: orgInfo.email_contatto } : {}),
  }

  return (
    <html lang="it">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
