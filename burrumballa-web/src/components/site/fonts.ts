import { Anton, Archivo_Black, Permanent_Marker, Space_Grotesk } from "next/font/google"

// Font del sito pubblico (Home/Corsi/Eventi/Chi siamo), caricati solo dentro
// <SiteShell> per non toccare il font globale delle pagine legali/iscrizione.
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
  display: "swap",
})

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
})

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-permanent-marker",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
})

export const siteFontVariables = [
  archivoBlack.variable,
  anton.variable,
  permanentMarker.variable,
  spaceGrotesk.variable,
].join(" ")
