import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CorsiJoinBand } from "@/components/site/CorsiJoinBand"
import { Kicker } from "@/components/site/Kicker"
import { Media } from "@/components/site/Media"
import { SiteShell } from "@/components/site/SiteShell"
import { WeekGrid } from "@/components/site/WeekGrid"
import { buildWeeklySchedule, formatCourseDateRange } from "@/lib/calendar"
import { getCorsiContent, getCourseBySlug, getFooterContent } from "@/lib/cms/queries"
import type { CourseTeacher, CourseWithLevels } from "@/lib/cms/types"
import { textColorFor } from "@/lib/color"

export const revalidate = 60

interface CorsoPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CorsoPageProps): Promise<Metadata> {
  const { slug } = await params
  const course = await getCourseBySlug(slug)
  if (!course) return {}

  return {
    title: course.name,
    description: course.body ?? `Corso di ${course.name} al Circolo La Fattoria, Bologna.`,
  }
}

function CourseHero({ course }: { course: CourseWithLevels }) {
  const dateRange = formatCourseDateRange(course.start_date, course.end_date)
  const textColor = textColorFor(course.color)

  return (
    <div className="border-bb-ink grid grid-cols-1 overflow-hidden rounded-[5px] border-[3px] md:grid-cols-[1fr_1.1fr]">
      <Media
        src={course.image_url}
        alt={course.name}
        fallbackColor={course.color}
        className="block h-full min-h-[280px] w-full object-cover md:border-r-[3px] md:border-bb-ink"
      />
      <div
        className="flex flex-col justify-center p-8 md:p-10"
        style={{ background: course.color, color: textColor }}
      >
        <div className="font-display-alt text-[42px] leading-[0.9] md:text-[56px]">
          {course.name.toUpperCase()}
        </div>
        {course.teachers && <div className="font-marker mt-2.5 text-lg opacity-90">{course.teachers}</div>}
        {course.body && (
          <p className="mt-3.5 max-w-[440px] text-[15px] leading-relaxed opacity-90">{course.body}</p>
        )}
        {dateRange && <div className="mt-3 text-xs font-bold opacity-80">{dateRange}</div>}
      </div>
    </div>
  )
}

function TeacherCard({ teacher, fallbackColor }: { teacher: CourseTeacher; fallbackColor: string }) {
  return (
    <div className="border-bb-ink bg-bb-surface overflow-hidden rounded-[5px] border-[3px]">
      <Media
        src={teacher.photo_url}
        alt={teacher.name}
        fallbackColor={fallbackColor}
        className="border-bb-ink block h-[300px] w-full border-b-[3px] object-cover"
      />
      <div className="p-4.5">
        <div className="font-display text-[17px]">{teacher.name}</div>
        {teacher.bio && <p className="text-bb-ink/65 mt-1.5 text-[13px] leading-relaxed">{teacher.bio}</p>}
      </div>
    </div>
  )
}

export default async function CorsoPage({ params }: CorsoPageProps) {
  const { slug } = await params
  const [course, footer, corsiContent] = await Promise.all([
    getCourseBySlug(slug),
    getFooterContent(),
    getCorsiContent(),
  ])

  if (!course) notFound()

  const weekDays = buildWeeklySchedule([course])

  return (
    <SiteShell active="corsi" footer={footer}>
      <div className="mx-auto max-w-[1200px] px-6 pt-8">
        <Link href="/corsi" className="text-bb-ink/65 hover:text-bb-ink text-xs font-semibold">
          ← Tutti i corsi
        </Link>
      </div>

      {/* HERO */}
      <div className="mx-auto max-w-[1200px] px-6 pt-4">
        <CourseHero course={course} />
      </div>

      {/* CLASSI */}
      <div className="mx-auto max-w-[1200px] px-6 pt-14">
        <Kicker color={course.color}>le classi</Kicker>
        <h2 className="font-display mt-1 mb-4 text-[30px] tracking-[-1.5px] md:text-[40px]">
          Come funzionano le lezioni
        </h2>
        {course.classes_info && (
          <p className="text-bb-ink/75 mb-6 max-w-[680px] text-[15px] leading-relaxed">
            {course.classes_info}
          </p>
        )}
        {course.levels.length > 0 && <WeekGrid days={weekDays} />}
      </div>

      {/* INSEGNANTI */}
      {course.teacherProfiles.length > 0 && (
        <div className="mx-auto max-w-[1200px] px-6 pt-14">
          <Kicker color="#ec1e89">chi ti insegna</Kicker>
          <h2 className="font-display mt-1 mb-6 text-[30px] tracking-[-1.5px] md:text-[40px]">
            {course.teacherProfiles.length === 1 ? "L'insegnante" : "Gli insegnanti"}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {course.teacherProfiles.map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} fallbackColor={course.color} />
            ))}
          </div>
        </div>
      )}

      {/* ISCRIVITI */}
      <div className="mx-auto mt-14 max-w-[1200px] px-6">
        <CorsiJoinBand content={corsiContent.join} />
      </div>
    </SiteShell>
  )
}
