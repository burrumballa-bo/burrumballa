import { createClient } from "@supabase/supabase-js"

import {
  DEFAULT_CHI_SIAMO_CONTENT,
  DEFAULT_CORSI_CONTENT,
  DEFAULT_EVENTI_CONTENT,
  DEFAULT_FOOTER_CONTENT,
  DEFAULT_HOME_CONTENT,
} from "./defaults"
import { mergeWithDefaults } from "./merge"
import type {
  ChiSiamoContent,
  CorsiContent,
  CourseWithLevels,
  CrewGroup,
  EventItem,
  EventiContent,
  FooterContent,
  HomeContent,
} from "./types"

// Stesso pattern di lib/org-info.ts: client anonimo creato per singola
// chiamata, errori inghiottiti così le pagine restano renderizzabili anche
// se Supabase è irraggiungibile (si vede semplicemente la copy di default).
function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function getPageContent<T>(id: string, defaults: T): Promise<T> {
  try {
    const supabase = getAnonClient()
    const { data, error } = await supabase
      .from("site_pages")
      .select("content")
      .eq("id", id)
      .single()

    if (error || !data) return defaults
    return mergeWithDefaults(defaults, data.content)
  } catch {
    return defaults
  }
}

export const getHomeContent = (): Promise<HomeContent> =>
  getPageContent("home", DEFAULT_HOME_CONTENT)

export const getCorsiContent = (): Promise<CorsiContent> =>
  getPageContent("corsi", DEFAULT_CORSI_CONTENT)

export const getEventiContent = (): Promise<EventiContent> =>
  getPageContent("eventi", DEFAULT_EVENTI_CONTENT)

export const getChiSiamoContent = (): Promise<ChiSiamoContent> =>
  getPageContent("chi-siamo", DEFAULT_CHI_SIAMO_CONTENT)

export const getFooterContent = (): Promise<FooterContent> =>
  getPageContent("footer", DEFAULT_FOOTER_CONTENT)

export async function getCourses(): Promise<CourseWithLevels[]> {
  try {
    const supabase = getAnonClient()
    const { data, error } = await supabase
      .from("courses")
      .select("*, levels:course_levels(*)")
      .eq("published", true)
      .order("order_index", { ascending: true })

    if (error || !data) return []
    return data.map((course) => ({
      ...course,
      levels: [...(course.levels ?? [])].sort(
        (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
      ),
    }))
  } catch {
    return []
  }
}

export async function getEvents(): Promise<EventItem[]> {
  try {
    const supabase = getAnonClient()
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("published", true)
      .order("order_index", { ascending: true })

    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

export async function getCrewGroups(): Promise<CrewGroup[]> {
  try {
    const supabase = getAnonClient()
    const { data, error } = await supabase
      .from("crew_groups")
      .select("*")
      .eq("published", true)
      .order("order_index", { ascending: true })

    if (error || !data) return []
    return data
  } catch {
    return []
  }
}
