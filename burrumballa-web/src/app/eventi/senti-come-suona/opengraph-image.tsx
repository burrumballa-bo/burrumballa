import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Senti Come Suona — 28 Settembre 2025"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#a1a1a1",
          }}
        >
          Burrumballa
        </div>
        <div style={{ fontSize: 88, fontWeight: 700, textAlign: "center" }}>
          Senti Come Suona
        </div>
        <div style={{ fontSize: 36, color: "#d4d4d4" }}>
          28 Settembre 2025 · Workshop &amp; Battle
        </div>
      </div>
    ),
    { ...size }
  )
}
