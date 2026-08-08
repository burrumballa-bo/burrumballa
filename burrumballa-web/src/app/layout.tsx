import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
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
      <body>{children}</body>
    </html>
  )
}
