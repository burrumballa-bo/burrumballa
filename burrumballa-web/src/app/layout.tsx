import type { Metadata } from "next"
import "./globals.css"

import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.burrumballa.it"
  ),
  title: "Burrumballa",
  description: "Burrumballa",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it">
      <body>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
