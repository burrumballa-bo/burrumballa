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
    description: DESCRIPTION,
    url: SITE_URL,
    ...(orgInfo.indirizzo ? { address: orgInfo.indirizzo } : {}),
    ...(orgInfo.email_contatto ? { email: orgInfo.email_contatto } : {}),
  }

  // Applica il tema scuro salvato in localStorage (o la preferenza di
  // sistema se l'utente non ha ancora scelto) prima del primo paint, così
  // la pagina non "lampeggia" chiara per poi scurirsi dopo l'idratazione.
  const themeInitScript = `(function(){try{var t=localStorage.getItem("bb-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})();`

  return (
    // suppressHydrationWarning: lo script inline sotto imposta .dark su
    // <html> prima dell'idratazione (per evitare il flash del tema
    // chiaro), quindi il markup lato server e quello risolto dal browser
    // divergono di proposito solo su questo attributo — stesso pattern
    // documentato da Next.js per i toggle di tema client-side.
    <html lang="it" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
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
