// Forma dei contenuti CMS. `content` delle righe `site_pages` è jsonb libero
// lato database: queste interfacce sono l'unico punto in cui la forma è
// definita, sia per il fetch (web) che per i form admin (burrumballa-admin
// mantiene una copia equivalente in src/types/cms.ts).

export interface HeroContent {
  kicker: string
  title: string
  subtitle: string
}

export interface HomeHeroContent {
  kicker: string
  titleLine1: string
  titleLine2: string
  titleLine3: string
  subtitle: string
  badgeText: string
  imageUrl: string | null
}

export interface HomeContent {
  hero: HomeHeroContent
  marquee: { text: string }
  about: { kicker: string; title: string; body: string }
  calendar: { kicker: string; title: string; subLabel: string }
  corsiSection: { kicker: string; title: string }
  eventsSection: { kicker: string; title: string }
  aboutTeaser: { kicker: string; title: string; body: string; imageUrl: string | null }
  ctaBand: { title: string; subtitle: string }
}

export interface ThemeColors {
  background: string
  text: string
  purple: string
  pink: string
  green: string
  orange: string
}

export interface ThemeContent {
  darkModeEnabled: boolean
  dark: ThemeColors
}

export interface CorsiContent {
  hero: HeroContent
  calendar: { kicker: string; title: string; subtitle: string }
  join: { kicker: string; title: string; body: string; ctaLabel: string; note: string }
}

export interface EventiContent {
  hero: HeroContent
  ctaBand: { title: string; subtitle: string }
}

export interface ValoreItem {
  title: string
  body: string
}

export interface ChiSiamoContent {
  hero: HeroContent
  story: { title: string; paragraph1: string; paragraph2: string; imageUrl: string | null }
  valori: { kicker: string; title: string; items: ValoreItem[] }
  crew: { kicker: string; title: string; subtitle: string }
  kids: { kicker: string; title: string; body: string; imageUrl: string | null }
  place: {
    title: string
    body: string
    imageUrl: string | null
    locationName: string
    addressLine1: string
    addressLine2: string
  }
  ctaBand: { title: string; subtitle: string }
}

export interface FooterContent {
  tagline: string
  locationName: string
  addressLine1: string
  addressLine2: string
  instagramHandle: string
  contactNote: string
  rightsNote: string
}

export interface Course {
  id: string
  slug: string
  name: string
  color: string
  body: string | null
  teachers: string | null
  classes_info: string | null
  image_url: string | null
  start_date: string | null
  end_date: string | null
  order_index: number
  published: boolean
}

export interface CourseLevel {
  id: string
  course_id: string
  level: string
  day_of_week: number
  time: string
  order_index: number
}

export interface CourseTeacher {
  id: string
  course_id: string
  name: string
  photo_url: string | null
  bio: string | null
  order_index: number
}

export interface CourseWithLevels extends Course {
  levels: CourseLevel[]
  teacherProfiles: CourseTeacher[]
}

export interface EventItem {
  id: string
  slug: string
  title: string
  subtitle: string | null
  body: string | null
  image_url: string | null
  tags: string[]
  event_date: string | null
  event_end_date: string | null
  event_time: string | null
  note: string | null
  color: string
  featured: boolean
  show_in_calendar: boolean
  cta_label: string | null
  cta_url: string | null
  order_index: number
  published: boolean
}

export interface CrewGroup {
  id: string
  title: string
  body: string | null
  image_url: string | null
  order_index: number
  published: boolean
}
