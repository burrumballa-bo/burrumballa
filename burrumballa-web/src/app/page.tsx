import Link from "next/link"

import { Chip } from "@/components/site/Chip"
import { Kicker } from "@/components/site/Kicker"
import { Marquee } from "@/components/site/Marquee"
import { Media } from "@/components/site/Media"
import { SiteShell } from "@/components/site/SiteShell"
import { WeekGrid } from "@/components/site/WeekGrid"
import { buildRollingCalendar, formatDateRangeLabel, startOfCurrentWeek } from "@/lib/calendar"
import { getCourses, getEvents, getFooterContent, getHomeContent } from "@/lib/cms/queries"
import { textColorFor } from "@/lib/color"

export const revalidate = 60

export default async function HomePage() {
  const [content, footer, courses, events] = await Promise.all([
    getHomeContent(),
    getFooterContent(),
    getCourses(),
    getEvents(),
  ])

  const monday = startOfCurrentWeek()
  const rangeLabel = formatDateRangeLabel(monday, 14)
  const calendarDays = buildRollingCalendar(courses, events, 2)
  const previewEvents = events.slice(0, 3)

  return (
    <SiteShell active="home" footer={footer}>
      {/* HERO */}
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-6 pt-10 pb-6 md:grid-cols-[1.05fr_0.95fr] md:pt-12">
        <div>
          <Kicker color="#ec1e89" className="-rotate-1">
            {content.hero.kicker}
          </Kicker>
          <h1 className="font-display mt-3.5 text-[46px] leading-[0.9] tracking-[-2px] sm:text-[58px] md:text-[74px] md:tracking-[-3px]">
            {content.hero.titleLine1}
            <br />
            {content.hero.titleLine2}
            <br />
            <span className="text-transparent" style={{ WebkitTextStroke: "2.5px #1a1a1a" }}>
              {content.hero.titleLine3}
            </span>
          </h1>
          <p className="mt-5 max-w-[430px] text-[16px] leading-relaxed text-neutral-700">
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
          <div className="bg-bb-purple absolute inset-[14px_-10px_-10px_14px]" aria-hidden="true" />
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

      <Marquee text={content.marquee.text} />

      {/* CALENDARIO */}
      <div className="mx-auto max-w-[1200px] px-6 pt-14 pb-4">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-5">
          <div>
            <Kicker>{content.calendar.kicker}</Kicker>
            <h2 className="font-display mt-1 text-[32px] tracking-[-1.5px] md:text-[42px]">
              {content.calendar.title}
            </h2>
          </div>
          <div className="text-right">
            <div className="text-[13px] text-neutral-600">{content.calendar.subLabel}</div>
            <div className="font-display mt-0.5 text-[15px]">{rangeLabel}</div>
          </div>
        </div>

        <div className="my-3.5 flex items-center gap-4 text-xs font-semibold text-neutral-700">
          <span className="flex items-center gap-1.5">
            <span className="border-bb-purple bg-bb-cream inline-block h-3.5 w-3.5 border-2" />
            Lezione
          </span>
          <span className="border-bb-purple bg-bb-purple inline-block h-3.5 w-3.5 border-2" />
          <span>Evento</span>
        </div>

        <div className="font-display text-bb-purple mb-3 text-[13px]">QUESTA SETTIMANA</div>
        <WeekGrid days={calendarDays.slice(0, 7)} showDates />

        <div className="font-display text-bb-purple mt-7 mb-3 text-[13px]">LA PROSSIMA</div>
        <WeekGrid days={calendarDays.slice(7, 14)} showDates />
      </div>

      {/* CORSI PREVIEW */}
      {courses.length > 0 && (
        <div className="mx-auto max-w-[1200px] px-6 pt-14 pb-4">
          <Kicker color="#ec1e89">{content.corsiSection.kicker}</Kicker>
          <h2 className="font-display mt-1 mb-6 text-[32px] tracking-[-1.5px] md:text-[42px]">
            {content.corsiSection.title}
          </h2>
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
            {courses.map((course) => {
              const levels = Array.from(new Set(course.levels.map((l) => l.level)))
              return (
                <Link
                  key={course.id}
                  href="/corsi"
                  className="border-bb-ink flex min-h-[180px] flex-col justify-between rounded border-[3px] p-5"
                  style={{ background: course.color, color: textColorFor(course.color) }}
                >
                  <div className="font-display-alt text-[26px] leading-[0.95] md:text-[30px]">
                    {course.name.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs leading-relaxed opacity-90">{levels.join(" · ")}</div>
                    <div className="font-display mt-2 text-[13px]">→</div>
                  </div>
                </Link>
              )
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
            <Link href="/eventi" className="border-bb-ink border-b-2 pb-0.5 text-sm font-bold">
              Tutti gli eventi →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {previewEvents.map((event) => (
              <Link
                key={event.id}
                href="/eventi"
                className="border-bb-ink block overflow-hidden rounded border-[3px] bg-white"
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
                    <div className="mt-1 text-[13px] text-neutral-600">{event.subtitle}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CHI SIAMO TEASER */}
      <div className="mx-auto mt-12 max-w-[1200px] px-6">
        <div className="bg-bb-ink text-bb-cream grid grid-cols-1 overflow-hidden rounded md:grid-cols-2">
          <div className="p-8 md:p-11">
            <Kicker color="#8be03c">{content.aboutTeaser.kicker}</Kicker>
            <h2 className="font-display mt-2 mb-4 text-[30px] leading-[1] tracking-[-1px] md:text-[38px]">
              {content.aboutTeaser.title}
            </h2>
            <p className="max-w-[420px] text-[15px] leading-relaxed text-neutral-300">
              {content.aboutTeaser.body}
            </p>
            <Link
              href="/chi-siamo"
              className="bg-bb-green text-bb-ink mt-5 inline-block rounded-[3px] px-5 py-3 text-sm font-bold"
            >
              Scopri chi siamo →
            </Link>
          </div>
          <div className="relative min-h-[220px] md:min-h-[280px]">
            <Media
              src={content.aboutTeaser.imageUrl}
              alt=""
              fallbackColor="#7e3fae"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* CTA BAND */}
      <div className="mx-auto mt-10 max-w-[1200px] px-6">
        <div className="bg-bb-pink border-bb-ink rounded border-[3px] p-8 text-center text-white md:p-10">
          <h2 className="font-display text-[34px] tracking-[-2px] md:text-[46px]">
            {content.ctaBand.title}
          </h2>
          <p className="mt-2.5 mb-5 text-[16px] opacity-95">{content.ctaBand.subtitle}</p>
          <Link
            href="/corsi"
            className="bg-bb-ink inline-block rounded-[3px] px-7 py-4 text-base font-bold text-white"
          >
            Iscriviti a un corso →
          </Link>
        </div>
      </div>
    </SiteShell>
  )
}
