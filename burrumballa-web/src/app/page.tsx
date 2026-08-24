import Image from "next/image";
import Link from "next/link";

import { Chip } from "@/components/site/Chip";
import { Kicker } from "@/components/site/Kicker";
import { Marquee } from "@/components/site/Marquee";
import { Media } from "@/components/site/Media";
import { SiteShell } from "@/components/site/SiteShell";
import { WeekGrid } from "@/components/site/WeekGrid";
import {
  buildRollingCalendar,
  formatDateRangeLabel,
  startOfCurrentWeek,
} from "@/lib/calendar";
import {
  getCourses,
  getEvents,
  getFooterContent,
  getHomeContent,
} from "@/lib/cms/queries";
import { textColorFor } from "@/lib/color";

export const revalidate = 60;

export default async function HomePage() {
  const [content, footer, courses, events] = await Promise.all([
    getHomeContent(),
    getFooterContent(),
    getCourses(),
    getEvents(),
  ]);

  const monday = startOfCurrentWeek();
  const rangeLabel = formatDateRangeLabel(monday, 14);
  const calendarDays = buildRollingCalendar(courses, events, 2);
  const previewEvents = events.slice(0, 3);

  return (
    <SiteShell active="home" footer={footer}>
      {/* HERO */}
      <div className="relative">
        {/* Copre la trama di mattoni di WallBackground solo dietro alla hero:
            w-screen + left-1/2 -translate-x-1/2 esce dal contenitore mx-auto
            per coprire l'intera larghezza pagina, non solo la colonna
            centrale. -z-[5] resta sopra ai mattoni (-z-10) ma sotto al
            contenuto della hero. */}
        <div
          className="bg-bb-cream absolute inset-y-0 left-1/2 -z-[5] w-screen -translate-x-1/2"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-300 grid-cols-1 items-center gap-10 px-6 pt-10 pb-6 md:grid-cols-[1.05fr_0.95fr]">
          {content.hero.triangleImageUrl && (
            // Immagine configurabile da admin, ritagliata a triangolo nella
            // parte bassa della hero (apice in basso a sinistra, lato più
            // ampio sul bordo destro): sopra il muro (che sta dietro a tutto,
            // -z-10 in WallBackground) ma dietro a testo, bottoni e blocco
            // immagine — essendo position:absolute (z-index:auto) dipinge
            // sopra a qualunque fratello non posizionato, quindi anche testo
            // e bottoni devono avere "relative" per restare sopra (vedi sotto).
            <div
              className="pointer-events-none absolute inset-0"
              style={{ clipPath: "polygon(0% 100%, 100% 100%, 100% 30%)" }}
              aria-hidden="true"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- URL pubblico da Supabase Storage (bucket "site-media"), non gestibile da next/image senza config remota dedicata */}
              <img
                src={content.hero.triangleImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="relative">
            <Kicker color="#ec1e89" className="-rotate-1">
              {content.hero.kicker}
            </Kicker>
            <h1 className="font-display mt-3.5 text-[46px] leading-[0.9] tracking-[-2px] sm:text-[58px] md:text-[74px] md:tracking-[-3px]">
              {content.hero.titleLine1}
              <br />
              {content.hero.titleLine2}
              <br />
              <span className="relative inline-block">
                {/* Masca */}
                {/* <SprayBlob className="text-bb-purple pointer-events-none absolute -inset-x-6 -top-7 -bottom-3 -z-10 hidden -rotate-1 dark:block" /> */}
                <span
                  className="text-transparent"
                  style={{ WebkitTextStroke: "2.5px var(--hero-stroke-color)" }}
                >
                  {content.hero.titleLine3}
                </span>
              </span>
            </h1>
            <p className="text-bb-ink/75 mt-5 max-w-[430px] text-[16px] leading-relaxed">
              {content.hero.subtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/corsi"
                className="bg-bb-ink text-bb-cream rounded-[3px] px-5 py-3.5 text-[15px] font-bold"
              >
                Iscriviti a un corso →
              </Link>
              <Link
                href="/corsi"
                className="border-bb-ink rounded-[3px] border-[2.5px] px-5 py-3.5 text-[15px] font-bold"
              >
                Lezione di prova
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {courses.map((course, index) => (
                <Chip
                  key={course.id}
                  background={course.color}
                  color={textColorFor(course.color)}
                  rotate={index % 2 === 0 ? -2 : 1.5}
                >
                  {course.name.toUpperCase()}
                </Chip>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className="bg-bb-purple absolute inset-[14px_-10px_-10px_14px]"
              aria-hidden="true"
            />
            <Media
              src={content.hero.imageUrl}
              alt="Burrumballa"
              className="border-bb-ink relative block h-[420px] w-full border-[3px] object-cover"
            />
            <div
              className="bg-bb-green border-bb-ink font-display absolute -top-3.5 -right-2 border-[2.5px] px-3 py-1.5 text-[13px]"
              style={{ transform: "rotate(4deg)" }}
            >
              {content.hero.badgeText}
            </div>
          </div>
        </div>
      </div>

      <Marquee text={content.marquee.text} />

      {/* CHI SIAMO — sezione SEO/AI: testo pieno, leggibile da motori di
          ricerca e assistenti AI, sopra il programma. */}
      <section
        aria-labelledby="chi-siamo-breve-title"
        className="mx-auto max-w-300 px-6 pt-12 pb-2"
      >
        <Kicker color="#8be03c">{content.about.kicker}</Kicker>
        <h2
          id="chi-siamo-breve-title"
          className="font-display mt-1 text-[28px] tracking-[-1.5px] md:text-[36px] text-center"
        >
          {content.about.title}
        </h2>
        <p className="mt-3.5 text-[16px] leading-relaxed text-center">
          {content.about.body}
        </p>

        {/* CHI SIAMO TEASER */}
        <div className="mx-auto mt-12 max-w-300">
          <div className="bg-bb-ink text-bb-cream grid grid-cols-1 overflow-hidden rounded md:grid-cols-2">
            <div className="p-8 md:p-11">
              <Kicker color="#8be03c">{content.aboutTeaser.kicker}</Kicker>
              <h2 className="font-display mt-2 mb-4 text-[30px] leading-none tracking-[-1px] md:text-[38px]">
                {content.aboutTeaser.title}
              </h2>
              <p className="text-bb-cream/75 max-w-105 text-[15px] leading-relaxed">
                {content.aboutTeaser.body}
              </p>
              <Link
                href="/chi-siamo"
                className="bg-bb-green mt-5 inline-block rounded-[3px] px-5 py-3 text-sm font-bold text-[#1a1a1a]"
              >
                Scopri chi siamo →
              </Link>
            </div>
            <div className="relative min-h-55 md:min-h-70">
              <Media
                src={content.aboutTeaser.imageUrl}
                alt=""
                fallbackColor="#7e3fae"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CORSI PREVIEW */}
      {courses.length > 0 && (
        <div className="mx-auto max-w-[1200px] px-6 pt-14 pb-4">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Kicker color="#ec1e89">{content.corsiSection.kicker}</Kicker>
              <h2 className="font-display mt-1 mb-6 text-[32px] tracking-[-1.5px] md:text-[42px]">
                {content.corsiSection.title}
              </h2>
            </div>
            <Link
              href="/corsi"
              className="border-bb-ink border-b-2 pb-0.5 text-sm font-bold"
            >
              Tutti i corsi →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
            {courses.map((course) => {
              const levels = Array.from(
                new Set(course.levels.map((l) => l.level)),
              );
              return (
                <Link
                  key={course.id}
                  href={`/corsi/${course.slug}`}
                  className="border-bb-ink flex min-h-[180px] flex-col justify-between rounded border-[3px] p-5"
                  style={{
                    background: course.color,
                    color: textColorFor(course.color),
                  }}
                >
                  <div className="font-display-alt text-[26px] leading-[0.95] md:text-[30px]">
                    {course.name.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs leading-relaxed opacity-90">
                      {levels.join(" · ")}
                    </div>
                    <div className="font-display mt-2 text-[13px]">→</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* EVENTI PREVIEW */}
      {previewEvents.length > 0 && (
        <div className="mx-auto max-w-[1200px] px-6 pt-12 pb-4">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Kicker>{content.eventsSection.kicker}</Kicker>
              <h2 className="font-display mt-1 text-[32px] tracking-[-1.5px] md:text-[42px]">
                {content.eventsSection.title}
              </h2>
            </div>
            <Link
              href="/eventi"
              className="border-bb-ink border-b-2 pb-0.5 text-sm font-bold"
            >
              Tutti gli eventi →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {previewEvents.map((event) => (
              <Link
                key={event.id}
                href="/eventi"
                className="border-bb-ink bg-bb-surface block overflow-hidden rounded border-[3px]"
              >
                <Media
                  src={event.image_url}
                  alt={event.title}
                  fallbackColor={event.color}
                  className="border-bb-ink block h-[240px] w-full border-b-[3px] object-cover"
                />
                <div className="p-3.5">
                  <div className="font-display text-lg">{event.title}</div>
                  {event.subtitle && (
                    <div className="text-bb-ink/65 mt-1 text-[13px]">
                      {event.subtitle}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CALENDARIO */}
      <div className="relative mx-auto max-w-[1200px] px-6 pt-10 pb-4">
        {/* Sfondo della sezione: il murales "Burrumballa" (asset fornito),
            grande e ben visibile — sopra il muro (dietro solo alle card,
            che restano leggibili sopra) invece che un watermark sbiadito.
            Centrato rispetto alla sezione (non ancorato a un angolo);
            `object-contain` + nessun overflow-hidden sul contenitore così
            resta sempre tutto visibile, mai tagliato. L'etichetta data qui
            sopra ha un text-shadow dedicato (vedi sotto) per restare
            leggibile anche a opacità alta. */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-96 w-96 max-w-[85%] -translate-x-1/2 -translate-y-1/2 rotate-1 opacity-90 sm:h-125 sm:w-125"
          aria-hidden="true"
        >
          <Image
            src="/decor/burrumballa-murales.png"
            alt=""
            fill
            className="object-contain"
            sizes="(min-width: 640px) 500px, 380px"
          />
        </div>

        <div className="mb-2 flex flex-wrap items-end justify-between gap-5">
          <div>
            <Kicker>{content.calendar.kicker}</Kicker>
            <h2 className="font-display mt-1 text-[32px] tracking-[-1.5px] md:text-[42px]">
              {content.calendar.title}
            </h2>
          </div>
          <div className="text-right text-sm font-bold">
            <div className="text-[13px]">{content.calendar.subLabel}</div>
            <div className="font-display mt-0.5 text-[15px]">{rangeLabel}</div>
          </div>
        </div>

        {/* <div className="text-bb-ink/75 my-3.5 flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="border-bb-purple bg-bb-cream inline-block h-3.5 w-3.5 border-2" />
            Lezione
          </span>
          <span className="border-bb-purple bg-bb-purple inline-block h-3.5 w-3.5 border-2" />
          <span>Evento</span>
        </div> */}

        <div className="font-display text-bb-purple mb-3 text-[13px]">
          QUESTA SETTIMANA
        </div>
        <WeekGrid days={calendarDays.slice(0, 7)} showDates />

        <div className="font-display text-bb-purple mt-7 mb-3 text-[13px]">
          LA PROSSIMA
        </div>
        <WeekGrid days={calendarDays.slice(7, 14)} showDates />
      </div>

      {/* CTA BAND */}
      <div className="mx-auto mt-10 max-w-[1200px] px-6">
        <div className="bg-bb-pink border-bb-ink rounded border-[3px] p-8 text-center text-white md:p-10">
          <h2 className="font-display text-[34px] tracking-[-2px] md:text-[46px]">
            {content.ctaBand.title}
          </h2>
          <p className="mt-2.5 mb-5 text-[16px] opacity-95">
            {content.ctaBand.subtitle}
          </p>
          <Link
            href="/corsi"
            className="bg-bb-ink text-bb-cream inline-block rounded-[3px] px-7 py-4 text-base font-bold"
          >
            Iscriviti a un corso →
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
