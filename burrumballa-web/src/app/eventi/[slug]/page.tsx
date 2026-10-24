import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MapPin } from "lucide-react"

import { RegistrationForm } from "@/components/registration/registration-form"
import { PersonAvatar } from "@/components/event-page/person-avatar"
import { TribaleBackground } from "@/components/event-page/tribale-background"
import { TribaleStrip } from "@/components/event-page/tribale-strip"
import { cn } from "@/lib/utils"
import {
  formatEventDate,
  formatEventDayMonthName,
  formatEventTimeRange,
  getEventBySlug,
} from "@/lib/event-info"
import { getEventPeople, getSignedAssetUrls } from "@/lib/event-assets"

import { buildEventMetadata } from "./metadata"

// Renderizzata lato server ad ogni richiesta (App Router = SSR di default).
export const dynamic = "force-dynamic"

// Taglio diagonale ricorrente nel design (tag, pillole, CTA).
const DIAGONAL_CUT = "[clip-path:polygon(0_0,100%_0,94%_100%,0_100%)]"

interface EventPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const eventInfo = await getEventBySlug((await params).slug)
  return eventInfo ? buildEventMetadata(eventInfo) : {}
}

// Pagina evento dal modello unico: testi, immagini (copertina, cornice,
// logo), citta' e colori arrivano da event_info, gestiti dall'admin.
export default async function EventPage({ params }: EventPageProps) {
  const eventInfo = await getEventBySlug((await params).slug)
  if (!eventInfo) notFound()

  const people = await getEventPeople(eventInfo.id)

  const imagePaths = [
    eventInfo.immagine_copertina,
    eventInfo.immagine_cornice,
    eventInfo.immagine_logo,
    ...people.map((persona) => persona.immagine_path),
  ].filter((path): path is string => !!path)
  const assetUrls = await getSignedAssetUrls(imagePaths)
  const urlOf = (path: string | null) => (path ? (assetUrls[path] ?? null) : null)

  const coverUrl = urlOf(eventInfo.immagine_copertina)
  const frameUrl = urlOf(eventInfo.immagine_cornice)
  const logoUrl = urlOf(eventInfo.immagine_logo)

  const dataEvento = formatEventDate(
    eventInfo.data_evento,
    eventInfo.ora_inizio,
    eventInfo.ora_fine
  )
  const dayMonthName = formatEventDayMonthName(eventInfo.data_evento)
  const orario = formatEventTimeRange(eventInfo.ora_inizio, eventInfo.ora_fine)

  const giuria = people.filter((persona) => persona.categoria === "giuria")
  const hostDj = people.filter((persona) => persona.categoria === "host_dj")

  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-[#050505]">
        <div className="2xl:mx-auto 2xl:max-w-6xl">
          <TribaleStrip url={frameUrl} position="top" />

          <div className="relative h-72 overflow-hidden sm:h-80 lg:h-[440px] xl:h-[480px]">
            <h1 className="sr-only">{eventInfo.titolo}</h1>

            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- immagine da signed URL Supabase
              <img
                src={coverUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[repeating-linear-gradient(45deg,rgba(255,255,255,.06)_0_10px,rgba(255,255,255,.02)_10px_20px)] font-mono text-xs tracking-wide text-white/40">
                FOTO COPERTINA EVENTO
              </div>
            )}

            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,.85)_0%,rgba(0,0,0,.2)_35%,transparent_60%)]" />

            {logoUrl && (
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center lg:right-8">
                {/* eslint-disable-next-line @next/next/no-img-element -- immagine da signed URL Supabase */}
                <img
                  src={logoUrl}
                  alt=""
                  aria-hidden
                  className="h-[85%] w-auto drop-shadow-[0_4px_16px_rgba(0,0,0,.55)]"
                />
              </div>
            )}

            {/* Su schermi stretti il logo (grande e centrale) si
                sovrapporrebbe alla data: qui resta nascosta e riappare
                sotto l'immagine (vedi blocco subito dopo lo strip). */}
            <div className="absolute bottom-5 left-5 hidden sm:block lg:bottom-8 lg:left-8">
              {dayMonthName && (
                <p className="font-[family-name:var(--font-anton)] text-4xl leading-none text-white uppercase sm:text-5xl lg:text-6xl xl:text-7xl">
                  {dayMonthName}
                </p>
              )}
              {eventInfo.citta && (
                <p className="mt-2 text-sm font-bold tracking-[0.25em] text-white/70 uppercase sm:text-base lg:text-lg">
                  {eventInfo.citta}
                </p>
              )}
            </div>
          </div>

          <TribaleStrip url={frameUrl} position="bottom" />

          <div className="px-5 py-4 sm:hidden">
            {dayMonthName && (
              <p className="font-[family-name:var(--font-anton)] text-4xl leading-none text-white uppercase">
                {dayMonthName}
              </p>
            )}
            {eventInfo.citta && (
              <p className="mt-2 text-sm font-bold tracking-[0.25em] text-white/70 uppercase">
                {eventInfo.citta}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Descrizione + luogo + info */}
      <section className="bg-black">
        {/* La linea viola segue la stessa larghezza dell'hero (full-bleed,
            boxed solo su monitor grandi), non quella del blocco testo. */}
        <div className="border-t-2 border-[color:var(--event-accent-2)] 2xl:mx-auto 2xl:max-w-6xl" />
        <div className="px-5 py-5 lg:mx-auto lg:max-w-3xl lg:px-10 lg:py-8">
          {eventInfo.descrizione && (
            <p className="mb-3 text-[13px] leading-relaxed text-white/75 lg:text-sm">
              {eventInfo.descrizione}
            </p>
          )}

          {eventInfo.luogo && (
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-[color:var(--event-accent)]" />
              <p className="text-sm font-bold text-white lg:text-base">
                {eventInfo.luogo}
              </p>
            </div>
          )}

          {orario && (
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "bg-[color:var(--event-accent)] px-3 py-2 text-sm font-bold text-black",
                  DIAGONAL_CUT
                )}
              >
                {orario}
              </span>
            </div>
          )}
          {eventInfo.testi_informativi && (
            <p className="mt-4 text-xs leading-relaxed whitespace-pre-wrap text-white/50">
              {eventInfo.testi_informativi}
            </p>
          )}
        </div>
      </section>

      {/* Giuria / Host / DJ */}
      {(giuria.length > 0 || hostDj.length > 0) && (
        <section className="bg-[#050505]">
          <div className="px-5 py-6 lg:mx-auto lg:max-w-3xl lg:px-10 lg:py-10">
            {giuria.length > 0 && (
              <>
                <p className="font-[family-name:var(--font-anton)] mb-1 text-sm tracking-[0.08em] text-white uppercase lg:text-base">
                  Giuria
                </p>
                <p className="mb-3 text-[10px] text-white/40">Judge</p>
                <div className="mb-6 flex flex-wrap justify-center gap-2.5 lg:gap-6">
                  {giuria.map((persona) => (
                    <div
                      key={persona.id}
                      className="flex w-[calc(50%-0.3125rem)] flex-col gap-1.5 lg:w-[calc(33.3333%-1rem)]"
                    >
                      <PersonAvatar
                        persona={persona}
                        url={
                          persona.immagine_path
                            ? (assetUrls[persona.immagine_path] ?? null)
                            : null
                        }
                      />
                      <div>
                        <p className="font-[family-name:var(--font-anton)] text-[15px] text-white lg:text-lg">
                          {persona.nome}
                        </p>
                        {persona.ruolo && (
                          <p className="text-[8px] font-bold tracking-[0.1em] text-[color:var(--event-accent)] uppercase lg:text-[10px]">
                            {persona.ruolo}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {hostDj.length > 0 && (
              <>
                <p className="font-[family-name:var(--font-anton)] mb-2.5 text-xs tracking-[0.08em] text-white uppercase lg:text-sm">
                  Host · DJ
                </p>
                <div className="flex flex-wrap justify-center gap-2.5 lg:gap-6">
                  {hostDj.map((persona) => (
                    <div
                      key={persona.id}
                      className="flex w-[calc(50%-0.3125rem)] flex-col gap-1 lg:w-[calc(33.3333%-1rem)]"
                    >
                      <PersonAvatar
                        persona={persona}
                        square={false}
                        url={
                          persona.immagine_path
                            ? (assetUrls[persona.immagine_path] ?? null)
                            : null
                        }
                      />
                      <div>
                        <p className="font-[family-name:var(--font-anton)] text-[11px] text-white lg:text-sm">
                          {persona.nome}
                        </p>
                        {persona.ruolo && (
                          <p
                            className="text-[7px] font-bold tracking-[0.08em] uppercase lg:text-[9px]"
                            style={{ color: persona.colore ?? "var(--event-accent-2)" }}
                          >
                            {persona.ruolo}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Titolo sezione iscrizione */}
      <section className="relative border-t-2 border-[color:var(--event-accent)] bg-[#111]">
        <TribaleBackground url={frameUrl} />
        <div className="relative px-5 pt-7 pb-7 lg:mx-auto lg:max-w-3xl lg:px-10 lg:pt-12 lg:pb-12">
          <h2 className="font-[family-name:var(--font-anton)] text-[28px] tracking-[0.03em] text-white uppercase sm:text-[30px] lg:text-4xl">
            Iscrizione
          </h2>
          <p className="mt-1 text-[11px] text-white/50">
            {eventInfo.descrizione_iscrizione}
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
          {eventInfo.iscrizioni_aperte ? (
            <RegistrationForm event={eventInfo} />
          ) : (
            <p className="border border-white/15 bg-[#151515] p-5 text-sm text-white/75">
              Le iscrizioni a questo evento sono chiuse.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
