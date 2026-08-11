import { Anton, Inter } from "next/font/google"

// Font del redesign "Senti Come Suona" (handoff design): caricati solo in
// questa route per non toccare il font globale del sito.
export const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
})

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
})
