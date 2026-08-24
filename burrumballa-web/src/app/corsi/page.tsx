import Link from "next/link"

import { CorsiJoinBand } from "@/components/site/CorsiJoinBand"
import { Kicker } from "@/components/site/Kicker"
import { Media } from "@/components/site/Media"
import { SiteShell } from "@/components/site/SiteShell"
import { WeekGrid } from "@/components/site/WeekGrid"
import { buildWeeklySchedule, formatCourseDateRange } from "@/lib/calendar"
import { textColorFor } from "@/lib/color"
import { getCorsiContent, getCourses, getFooterContent } from "@/lib/cms/queries"
import type { CourseWithLevels } from "@/lib/cms/types"

export const revalidate = 60

export const metadata = {
  title: "Corsi",
  description:
    "Breaking, hip hop, house e popping: i corsi di danza urbana di Burrumballa al Circolo La Fattoria, Bologna.",
}

function LevelBadges({ course }: { course: CourseWithLevels }) {
  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(${Math.min(course.levels.length, 3) || 1}, minmax(0, 1fr))` }}
    >
      {course.levels.map((level) => (
        <div key={level.id} className="border-bb-ink bg-bb-surface rounded border-2 p-3">
          <div className="font-display text-sm">{level.level}</div>
          <div className="text-bb-ink/65 mt-1 text-xs">{level.time}</div>
        </div>
      ))}
    </div>
  )
}

function FeaturedDiscipline({ course, reversed }: { course: CourseWithLevels; reversed: boolean }) {
  const dateRange = formatCourseDateRange(course.start_date, course.end_date)

  return (
    <div id={course.slug} className="mx-auto max-w-[1200px] px-6 pt-14 scroll-mt-20">
      <div className="grid grid-cols-1 items-center gap-9 md:grid-cols-[1fr_1.3fr]">
        <div className={`relative ${reversed ? "md:order-2" : ""}`}>
          <div className="absolute inset-[12px_-10px_-10px_12px]" style={{ background: course.color }} aria-hidden="true" />
          <Media
            src={course.image_url}
            alt={course.name}
            fallbackColor={course.color}
            className="border-bb-ink relative block h-[300px] w-full border-[3px] object-cover md:h-[340px]"
          />
        </div>
        <div className={reversed ? "md:order-1" : ""}>
          <div
            className="font-display-alt text-[46px] leading-[0.9] md:text-[62px]"
            style={{ color: course.color, WebkitTextStroke: "1.5px var(--color-bb-ink)" }}
          >
            {course.name.toUpperCase()}
          </div>
          {course.body && (
            <p className="text-bb-ink/75 mt-3.5 max-w-[440px] text-[15px] leading-relaxed">
              {course.body}
            </p>
          )}
          {dateRange && (
            <div className="text-bb-ink/65 mt-2 text-xs font-semibold">{dateRange}</div>
          )}
          {course.teachers && <Kicker className="mb-4">{course.teachers}</Kicker>}
          <div className={course.teachers ? "" : "mt-5"}>
            <LevelBadges course={course} />
          </div>
          <Link
            href={`/corsi/${course.slug}`}
            className="border-bb-ink font-display mt-5 inline-block rounded-[3px] border-2 px-4 py-2.5 text-[13px]"
            style={{ background: course.color, color: textColorFor(course.color) }}
          >
            Scopri il corso →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function CorsiPage() {
  const [content, footer, courses] = await Promise.all([
    getCorsiContent(),
    getFooterContent(),
    getCourses(),
  ])

  const weekDays = buildWeeklySchedule(courses)

  return (
    <SiteShell active="corsi" footer={footer}>
      {/* HERO */}
      <div className="mx-auto max-w-[1200px] px-6 pt-12 pb-6">
        <Kicker color="#ec1e89" className="-rotate-1">
          {content.hero.kicker}
        </Kicker>
        <h1 className="font-display mt-2.5 text-[46px] leading-[0.92] tracking-[-2px] sm:text-[58px] md:text-[70px] md:tracking-[-3px]">
          {content.hero.title}
        </h1>
        <p className="text-bb-ink/75 mt-4.5 max-w-[560px] text-[17px] leading-relaxed">
          {content.hero.subtitle}
        </p>
        {courses.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {courses.map((course) => (
              <a
                key={course.id}
                href={`#${course.slug}`}
                className="border-bb-ink font-display rounded-[2px] border-2 px-3.5 py-2 text-[13px]"
                style={{ background: course.color, color: textColorFor(course.color) }}
              >
                {course.name.toUpperCase()}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* CALENDARIO SETTIMANALE */}
      <div className="mx-auto max-w-[1200px] px-6 pt-5 pb-2.5">
        <div className="mb-4.5 flex flex-wrap items-end justify-between gap-5">
          <div>
            <Kicker>{content.calendar.kicker}</Kicker>
            <h2 className="font-display mt-1 text-[28px] tracking-[-1.5px] md:text-[38px]">
              {content.calendar.title}
            </h2>
          </div>
          <div className="text-bb-ink/65 max-w-[300px] text-right text-[13px]">
            {content.calendar.subtitle}
          </div>
        </div>
        <WeekGrid days={weekDays} />
      </div>

      {/* DISCIPLINE */}
      {courses.map((course, index) => (
        <FeaturedDiscipline key={course.id} course={course} reversed={index % 2 === 1} />
      ))}

      {/* ISCRIVITI */}
      <div className="mx-auto mt-14 max-w-[1200px] px-6">
        <CorsiJoinBand content={content.join} />
      </div>
    </SiteShell>
  )
}
