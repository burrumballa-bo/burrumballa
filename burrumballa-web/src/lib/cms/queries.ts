import { createClient } from "@supabase/supabase-js";

import {
  DEFAULT_CHI_SIAMO_CONTENT,
  DEFAULT_CORSI_CONTENT,
  DEFAULT_EVENTI_CONTENT,
  DEFAULT_FOOTER_CONTENT,
  DEFAULT_HOME_CONTENT,
  DEFAULT_THEME_CONTENT,
} from "./defaults";
import { mergeWithDefaults } from "./merge";
import type {
  ChiSiamoContent,
  CorsiContent,
  CourseWithLevels,
  CrewGroup,
  EventItem,
  EventiContent,
  FooterContent,
  HomeContent,
  ThemeContent,
} from "./types";

// Stesso pattern di lib/org-info.ts: client anonimo creato per singola
// chiamata, errori inghiottiti così le pagine restano renderizzabili anche
// se Supabase è irraggiungibile (si vede semplicemente la copy di default).
function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

async function getPageContent<T>(id: string, defaults: T): Promise<T> {
  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from("site_pages")
      .select("content")
      .eq("id", id)
      .single();

    if (error || !data) return defaults;
    return mergeWithDefaults(defaults, data.content);
  } catch {
    return defaults;
  }
}

export const getHomeContent = (): Promise<HomeContent> =>
  getPageContent("home", DEFAULT_HOME_CONTENT);

export const getCorsiContent = (): Promise<CorsiContent> =>
  getPageContent("corsi", DEFAULT_CORSI_CONTENT);

export const getEventiContent = (): Promise<EventiContent> =>
  getPageContent("eventi", DEFAULT_EVENTI_CONTENT);

export const getChiSiamoContent = (): Promise<ChiSiamoContent> =>
  getPageContent("chi-siamo", DEFAULT_CHI_SIAMO_CONTENT);

export const getFooterContent = (): Promise<FooterContent> =>
  getPageContent("footer", DEFAULT_FOOTER_CONTENT);

export const getThemeContent = (): Promise<ThemeContent> =>
  getPageContent("theme", DEFAULT_THEME_CONTENT);

const ASSETS_BUCKET = "assets";
// TTL corto di proposito: la signed URL non finisce piu' nell'HTML (vedi
// getHeaderLogoSrc), viene consumata subito server-side dalla route
// /logo/[variant], quindi non deve sopravvivere alla richiesta.
const HEADER_LOGO_SIGNED_URL_TTL_SECONDS = 60;
const HEADER_LOGO_FILE_BY_VARIANT: Record<ThemeContent["headerLogo"], string> =
  {
    black: "logo_black.png",
    white: "logo_white.png",
  };

// Il bucket "assets" e' privato: la select anonima e' permessa solo per
// questi due file grazie alla policy "assets_select_anon_header_logo" (vedi
// supabase/migrations), stesso pattern della cartella 'senti_come_suona/'
// in lib/senti-come-suona-assets.ts. Fallisce in modo silenzioso come le
// altre query CMS: senza logo, l'header ricade sul placeholder.
export async function getHeaderLogoSignedUrl(
  variant: ThemeContent["headerLogo"],
): Promise<string | null> {
  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase.storage
      .from(ASSETS_BUCKET)
      .createSignedUrl(
        HEADER_LOGO_FILE_BY_VARIANT[variant],
        HEADER_LOGO_SIGNED_URL_TTL_SECONDS,
      );

    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

export async function getHeaderLogoSrc(
  variant: ThemeContent["headerLogo"],
): Promise<string | null> {
  const signedUrl = await getHeaderLogoSignedUrl(variant);
  return signedUrl ? `/logo/${variant}` : null;
}

const COURSE_WITH_RELATIONS_SELECT =
  "*, levels:course_levels(*), teacherProfiles:course_teachers(*)";

function sortByOrderIndex<T extends { order_index: number }>(
  items: T[] | null | undefined,
): T[] {
  return [...(items ?? [])].sort((a, b) => a.order_index - b.order_index);
}

export async function getCourses(): Promise<CourseWithLevels[]> {
  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from("courses")
      .select(COURSE_WITH_RELATIONS_SELECT)
      .eq("published", true)
      .order("order_index", { ascending: true });

    if (error || !data) return [];
    return data.map((course) => ({
      ...course,
      levels: sortByOrderIndex(course.levels),
      teacherProfiles: sortByOrderIndex(course.teacherProfiles),
    }));
  } catch {
    return [];
  }
}

export async function getCourseBySlug(
  slug: string,
): Promise<CourseWithLevels | null> {
  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from("courses")
      .select(COURSE_WITH_RELATIONS_SELECT)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      levels: sortByOrderIndex(data.levels),
      teacherProfiles: sortByOrderIndex(data.teacherProfiles),
    };
  } catch {
    return null;
  }
}

export async function getEvents(): Promise<EventItem[]> {
  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("published", true)
      .order("order_index", { ascending: true });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function getCrewGroups(): Promise<CrewGroup[]> {
  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from("crew_groups")
      .select("*")
      .eq("published", true)
      .order("order_index", { ascending: true });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
