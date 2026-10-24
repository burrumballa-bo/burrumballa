import { ImageResponse } from "next/og";

import { formatEventDate, getEventBySlug } from "@/lib/event-info";

export const alt = "Evento Burrumballa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const event = await getEventBySlug((await params).slug);
  const titolo = event?.titolo ?? "Burrumballa";
  const data = event ? formatEventDate(event.data_evento) : null;

  return new ImageResponse(
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
      <div style={{ fontSize: 88, fontWeight: 700, textAlign: "center", padding: "0 60px" }}>
        {titolo}
      </div>
      {data && <div style={{ fontSize: 36, color: "#d4d4d4" }}>{data}</div>}
    </div>,
    { ...size },
  );
}
