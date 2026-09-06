import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CorsiJoinBand } from "@/components/site/CorsiJoinBand";
import { Kicker } from "@/components/site/Kicker";
import { Media } from "@/components/site/Media";
import { SiteShell } from "@/components/site/SiteShell";
import { WeekGrid } from "@/components/site/WeekGrid";
import { buildWeeklySchedule, formatCourseDateRange } from "@/lib/calendar";
import {
  getCorsiContent,
  getCourseBySlug,
  getCourses,
  getFooterContent,
} from "@/lib/cms/queries";
import type { CourseTeacher, CourseWithLevels } from "@/lib/cms/types";
import { textColorFor } from "@/lib/color";
import { rowNeedsCentering } from "@/lib/gridWrap";
import { cn } from "@/lib/utils";

export const revalidate = 60;

export async function generateStaticParams() {
  const courses = await getCourses();
  return courses.map((course) => ({ slug: course.slug }));
}

interface CorsoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CorsoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {};

  return {
    title: course.name,
    description:
      course.body ?? `Corso di ${course.name} al Circolo La Fattoria, Bologna.`,
  };
}

function CourseHero({ course }: { course: CourseWithLevels }) {
  const dateRange = formatCourseDateRange(course.start_date, course.end_date);
  const textColor = textColorFor(course.color);

  return (
    <div className="border-bb-ink grid grid-cols-1 overflow-hidden border-[3px] md:grid-cols-[1fr_1.1fr]">
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
        {course.teachers && (
          <div className="font-marker mt-2.5 text-lg opacity-90">
            {course.teachers}
          </div>
        )}
        {course.body && (
          <p className="mt-3.5 max-w-[440px] text-[15px] leading-relaxed opacity-90">
            {course.body}
          </p>
        )}
        {dateRange && (
          <div className="mt-3 text-xs font-bold opacity-80">{dateRange}</div>
        )}
      </div>
    </div>
  );
}

function teachersGridClass(count: number) {
  if (count === 1) return "grid grid-cols-1 gap-5";
  if (count === 2) return "grid grid-cols-1 gap-5 sm:grid-cols-2";
  const smFix = rowNeedsCentering(count, 2);
  const lgFix = rowNeedsCentering(count, 3);
  return cn(
    "grid grid-cols-1 gap-5",
    smFix ? "sm:flex sm:flex-wrap sm:justify-center" : "sm:grid sm:grid-cols-2",
    lgFix ? "lg:flex lg:flex-wrap lg:justify-center" : "lg:grid lg:grid-cols-3",
  );
}

function teacherCardClass(count: number) {
  if (count <= 2) return undefined;
  const smFix = rowNeedsCentering(count, 2);
  const lgFix = rowNeedsCentering(count, 3);
  return cn(
    smFix && "sm:shrink-0 sm:basis-[calc(50%-0.625rem)]",
    lgFix && "lg:shrink-0 lg:basis-[calc(33.3333%-0.8333rem)]",
  );
}

function TeacherCard({
  teacher,
  fallbackColor,
  className,
}: {
  teacher: CourseTeacher;
  fallbackColor: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-bb-ink bg-bb-surface overflow-hidden border-[3px]",
        className,
      )}
    >
      <Media
        src={teacher.photo_url}
        alt={teacher.name}
        fallbackColor={fallbackColor}
        className="border-bb-ink block h-[300px] w-full border-b-[3px] object-cover object-top"
      />
      <div className="p-4.5">
        <div className="font-display text-[17px]">{teacher.name}</div>
        {teacher.bio && (
          <p className="mt-1.5 text-[13px] leading-relaxed">{teacher.bio}</p>
        )}
      </div>
    </div>
  );
}

export default async function CorsoPage({ params }: CorsoPageProps) {
  const { slug } = await params;
  const [course, footer, corsiContent] = await Promise.all([
    getCourseBySlug(slug),
    getFooterContent(),
    getCorsiContent(),
  ]);

  if (!course) notFound();

  const weekDays = buildWeeklySchedule([course]);

  return (
    <SiteShell active="corsi" footer={footer}>
      <div className="mx-auto max-w-[1200px] px-6 pt-8">
        <Link href="/corsi" className="hover:text-bb-ink text-xs font-semibold">
          ← Tutti i corsi
        </Link>
      </div>

      {/* HERO */}
      <div className="mx-auto max-w-[1200px] px-6 pt-4">
        <CourseHero course={course} />
      </div>

      {/* INSEGNANTI */}
      {course.teacherProfiles.length > 0 && (
        <div className="mx-auto max-w-[1200px] px-6 pt-14">
          <Kicker color="#ec1e89">chi ti insegna</Kicker>
          <h2 className="font-display mt-1 mb-6 text-[30px] tracking-[-1.5px] md:text-[40px]">
            {course.teacherProfiles.length === 1
              ? "L'insegnante"
              : "Gli insegnanti"}
          </h2>
          <div className={teachersGridClass(course.teacherProfiles.length)}>
            {course.teacherProfiles.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                fallbackColor={course.color}
                className={teacherCardClass(course.teacherProfiles.length)}
              />
            ))}
          </div>
        </div>
      )}

      {/* CLASSI */}
      <div className="mx-auto max-w-[1200px] px-6 pt-14">
        <Kicker color={course.color}>le classi</Kicker>
        <h2 className="font-display mt-1 mb-4 text-[30px] tracking-[-1.5px] md:text-[40px]">
          Lezioni
        </h2>
        {course.classes_info && (
          <p className="mb-6 max-w-[680px] text-[15px] leading-relaxed">
            {course.classes_info}
          </p>
        )}
        {course.levels.length > 0 && <WeekGrid days={weekDays} />}
      </div>

      {/* ISCRIVITI */}
      <div className="mx-auto mt-14 max-w-[1200px] px-6">
        <CorsiJoinBand content={corsiContent.join} />
      </div>
    </SiteShell>
  );
}
