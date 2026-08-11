import type { Metadata } from "next"
import Link from "next/link"

import { RegistrationForm } from "@/components/registration/registration-form"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  formatDeadlineDate,
  formatEventDate,
  formatEventDayMonth,
  getEventInfo,
} from "@/lib/event-info"

// Renderizzata lato server ad ogni richiesta (App Router = SSR di default).
export const dynamic = "force-dynamic"

// Taglio diagonale ricorrente nel design (tag, pillole, CTA).
const DIAGONAL_CUT = "[clip-path:polygon(0_0,100%_0,94%_100%,0_100%)]"

const GIURIA = [
  { nome: "SHORTEE", ruolo: "JUDGE" },
  { nome: "FABBREEZY", ruolo: "JUDGE · WORKSHOP" },
  { nome: "NASTYA", ruolo: "JUDGE · WORKSHOP" },
]

const HOST_DJ = [
  { nome: "DULK", ruolo: "HOST", colore: "#d6249f" },
  { nome: "STILL", ruolo: "DJ", colore: "#a855f7" },
  { nome: "GFEAR", ruolo: "LIVE", colore: "#a855f7" },
]

function PlaceholderPhoto({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden [clip-path:polygon(0_0,100%_0,100%_88%,0_100%)]",
        className
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-[repeating-linear-gradient(45deg,rgba(255,255,255,.06)_0_10px,rgba(255,255,255,.02)_10px_20px)] px-1 text-center font-mono text-[8px] leading-tight text-white/40">
        {label}
      </div>
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const eventInfo = await getEventInfo()
  const dataEvento = formatEventDate(eventInfo.data_evento)
  const title = dataEvento ? `${eventInfo.titolo} — ${dataEvento}` : eventInfo.titolo
  const description =
    (eventInfo.descrizione ??
      `Iscrizioni entro il ${formatDeadlineDate(eventInfo.scadenza_iscrizioni)}.`) +
    " Iscriviti online: workshop, battle e pagamento in un unico form."

  return {
    title,
    description,
    alternates: {
      canonical: "/eventi/senti-come-suona",
    },
    openGraph: {
      title,
      description,
      url: "/eventi/senti-come-suona",
      siteName: "Burrumballa",
      type: "website",
      locale: "it_IT",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function SentiComeSuonaPage() {
  const eventInfo = await getEventInfo()
  const dataEvento = formatEventDate(eventInfo.data_evento)
  const dayMonth = formatEventDayMonth(eventInfo.data_evento)

  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-[#050505]">
        <div className="lg:mx-auto lg:flex lg:max-w-6xl lg:items-stretch">
          <div className="relative h-72 overflow-hidden sm:h-80 lg:h-auto lg:min-h-[440px] lg:flex-1">
            <div className="absolute inset-0 flex items-center justify-center bg-[repeating-linear-gradient(45deg,rgba(255,255,255,.06)_0_10px,rgba(255,255,255,.02)_10px_20px)] font-mono text-xs tracking-wide text-white/40">
              FOTO COPERTINA EVENTO
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(0deg,#050505_5%,transparent_55%)]" />
            <svg
              className="absolute top-0 left-0 h-[180px] w-[200px] lg:h-[220px] lg:w-[260px]"
              viewBox="0 0 200 180"
              aria-hidden
            >
              <polygon points="0,0 200,0 0,180" fill="#f5d90a" opacity="0.92" />
            </svg>
            <svg
              className="absolute right-0 bottom-0 h-[140px] w-[140px] lg:h-[170px] lg:w-[170px]"
              viewBox="0 0 140 140"
              aria-hidden
            >
              <polygon points="140,140 40,140 140,20" fill="#d6249f" opacity="0.9" />
            </svg>
            <div className="absolute top-5 left-5 bg-[#f5d90a] px-2 py-1 text-black">
              <span className="font-[family-name:var(--font-anton)] text-xs tracking-[0.1em] uppercase">
                Evento
              </span>
            </div>
            <div className="absolute bottom-4 left-5 lg:bottom-8 lg:left-8">
              <h1 className="font-[family-name:var(--font-anton)] text-3xl leading-[1.05] text-white uppercase sm:text-4xl lg:text-5xl xl:text-6xl">
                {eventInfo.titolo}
              </h1>
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-4 bg-[#111] px-5 py-4 lg:w-72 lg:flex-none lg:flex-col lg:items-start lg:justify-center lg:gap-4 lg:border-l lg:border-white/10 lg:px-8 lg:py-10 xl:w-80">
            <div className="font-[family-name:var(--font-anton)] text-4xl leading-none text-[#f5d90a] sm:text-5xl lg:text-6xl">
              {dayMonth ? dayMonth.giorno : "—"}
              <span className="ml-1 text-base text-white sm:text-lg">
                {dayMonth ? `/${dayMonth.mese}` : ""}
              </span>
            </div>
            <div className="text-right lg:text-left">
              <div className="text-sm font-semibold text-white">BOLOGNA</div>
              <div className="text-xs text-white/50">ITALY</div>
            </div>
          </div>
        </div>
      </section>

      {/* Descrizione + info */}
      <section className="border-t-2 border-[#7c1fd6] bg-black">
        <div className="px-5 py-5 lg:mx-auto lg:max-w-6xl lg:px-10 lg:py-8">
          {eventInfo.descrizione && (
            <p className="mb-3 text-[13px] leading-relaxed text-white/75 lg:max-w-2xl lg:text-sm">
              {eventInfo.descrizione}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "bg-white px-2.5 py-1.5 text-[10px] font-bold text-black",
                DIAGONAL_CUT
              )}
            >
              SPAZIO BELLO SGUARDO
            </span>
            <span
              className={cn(
                "bg-[#f5d90a] px-2.5 py-1.5 text-[10px] font-bold text-black",
                DIAGONAL_CUT
              )}
            >
              15:00–22:00
            </span>
          </div>
          {eventInfo.testi_informativi && (
            <p className="mt-4 text-xs leading-relaxed whitespace-pre-wrap text-white/50 lg:max-w-2xl">
              {eventInfo.testi_informativi}
            </p>
          )}
        </div>
      </section>

      {/* Giuria / Host / DJ */}
      <section className="bg-[#050505]">
        <div className="px-5 py-6 lg:mx-auto lg:max-w-6xl lg:px-10 lg:py-10">
          <p className="font-[family-name:var(--font-anton)] mb-1 text-sm tracking-[0.08em] text-white uppercase lg:text-base">
            Giuria
          </p>
          <p className="mb-3 text-[10px] text-white/40">Judge</p>
          <div className="mb-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-6">
            {GIURIA.map((persona) => (
              <div key={persona.nome} className="flex flex-col gap-1.5">
                <PlaceholderPhoto label={`FOTO\n${persona.nome}`} />
                <div>
                  <p className="font-[family-name:var(--font-anton)] text-[15px] text-white lg:text-lg">
                    {persona.nome}
                  </p>
                  <p className="text-[8px] font-bold tracking-[0.1em] text-[#f5d90a] uppercase lg:text-[10px]">
                    {persona.ruolo}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="font-[family-name:var(--font-anton)] mb-2.5 text-xs tracking-[0.08em] text-white uppercase lg:text-sm">
            Host · DJ
          </p>
          <div className="grid grid-cols-3 gap-2 lg:max-w-2xl lg:gap-4">
            {HOST_DJ.map((persona) => (
              <div key={persona.nome} className="flex flex-col gap-1">
                <PlaceholderPhoto label="FOTO" />
                <div>
                  <p className="font-[family-name:var(--font-anton)] text-[11px] text-white lg:text-sm">
                    {persona.nome}
                  </p>
                  <p
                    className="text-[7px] font-bold tracking-[0.08em] uppercase lg:text-[9px]"
                    style={{ color: persona.colore }}
                  >
                    {persona.ruolo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Titolo sezione iscrizione */}
      <section className="border-t-2 border-[#f5d90a] bg-[#111]">
        <div className="px-5 pt-7 pb-2 lg:mx-auto lg:max-w-3xl lg:px-10 lg:pt-12 lg:pb-4">
          <h2 className="font-[family-name:var(--font-anton)] text-[28px] tracking-[0.03em] text-white uppercase sm:text-[30px] lg:text-4xl">
            Iscrizione
          </h2>
          <p className="mt-1 text-[11px] text-white/50">
            Completa i dati, scegli categorie battle e workshop, paga in un
            unico form
            {dataEvento && (
              <>
                {" "}
                — <span className="italic">{dataEvento}</span>
              </>
            )}
          </p>
        </div>
      </section>

      <div id="iscrizione" className="scroll-mt-8 bg-[#050505]">
        <div className="px-5 py-6 lg:mx-auto lg:max-w-3xl lg:px-10 lg:py-10">
          <RegistrationForm />
        </div>
      </div>
    </main>
  )
}
