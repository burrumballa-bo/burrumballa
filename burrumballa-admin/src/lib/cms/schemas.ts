import { z } from "zod"

const intString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} è obbligatorio.`)
    .refine((v) => Number.isInteger(Number(v)), `${label} deve essere un numero intero.`)

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Inserisci un colore esadecimale valido (es. #7e3fae).")

const slug = z
  .string()
  .trim()
  .min(1, "Lo slug è obbligatorio.")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Usa solo minuscole, numeri e trattini (es. hip-hop).")

export const courseSchema = z
  .object({
    slug,
    name: z.string().trim().min(1, "Il nome è obbligatorio."),
    color: hexColor,
    body: z.string().trim(),
    teachers: z.string().trim(),
    classes_info: z.string().trim(),
    image_url: z.string().trim(),
    start_date: z.string().trim(),
    end_date: z.string().trim(),
    order_index: intString("L'ordine"),
    published: z.boolean(),
  })
  .refine(
    (values) => !values.start_date || !values.end_date || values.end_date >= values.start_date,
    { message: "La data di fine non può essere prima della data di inizio.", path: ["end_date"] }
  )
export type CourseFormValues = z.infer<typeof courseSchema>
export const emptyCourseFormValues: CourseFormValues = {
  slug: "",
  name: "",
  color: "#7e3fae",
  body: "",
  teachers: "",
  classes_info: "",
  image_url: "",
  start_date: "",
  end_date: "",
  order_index: "0",
  published: true,
}

export const courseLevelSchema = z.object({
  level: z.string().trim().min(1, "Il livello è obbligatorio."),
  day_of_week: z.string().trim().min(1, "Il giorno è obbligatorio."),
  time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usa il formato HH:MM (es. 18:30)."),
  order_index: intString("L'ordine"),
})
export type CourseLevelFormValues = z.infer<typeof courseLevelSchema>
export const emptyCourseLevelFormValues: CourseLevelFormValues = {
  level: "",
  day_of_week: "1",
  time: "18:00",
  order_index: "0",
}

export const courseTeacherSchema = z.object({
  name: z.string().trim().min(1, "Il nome è obbligatorio."),
  photo_url: z.string().trim(),
  bio: z.string().trim(),
  order_index: intString("L'ordine"),
})
export type CourseTeacherFormValues = z.infer<typeof courseTeacherSchema>
export const emptyCourseTeacherFormValues: CourseTeacherFormValues = {
  name: "",
  photo_url: "",
  bio: "",
  order_index: "0",
}

export const eventSchema = z.object({
  slug,
  title: z.string().trim().min(1, "Il titolo è obbligatorio."),
  subtitle: z.string().trim(),
  body: z.string().trim(),
  image_url: z.string().trim(),
  tagsText: z.string().trim(),
  event_date: z.string().trim(),
  event_end_date: z.string().trim(),
  event_time: z.string().trim(),
  note: z.string().trim(),
  color: hexColor,
  featured: z.boolean(),
  show_in_calendar: z.boolean(),
  cta_label: z.string().trim(),
  cta_url: z.string().trim(),
  order_index: intString("L'ordine"),
  published: z.boolean(),
})
export type EventFormValues = z.infer<typeof eventSchema>
export const emptyEventFormValues: EventFormValues = {
  slug: "",
  title: "",
  subtitle: "",
  body: "",
  image_url: "",
  tagsText: "",
  event_date: "",
  event_end_date: "",
  event_time: "",
  note: "",
  color: "#7e3fae",
  featured: false,
  show_in_calendar: true,
  cta_label: "",
  cta_url: "",
  order_index: "0",
  published: true,
}

export const crewGroupSchema = z.object({
  title: z.string().trim().min(1, "Il titolo è obbligatorio."),
  body: z.string().trim(),
  image_url: z.string().trim(),
  order_index: intString("L'ordine"),
  published: z.boolean(),
})
export type CrewGroupFormValues = z.infer<typeof crewGroupSchema>
export const emptyCrewGroupFormValues: CrewGroupFormValues = {
  title: "",
  body: "",
  image_url: "",
  order_index: "0",
  published: true,
}

// ---- Contenuti di pagina (site_pages.content) -----------------------------
// Validazione leggera: i titoli/kicker principali sono obbligatori, il
// resto è testo libero (può essere lasciato vuoto senza rompere il layout).

const required = (label: string) => z.string().trim().min(1, `${label} è obbligatorio.`)
const optionalText = z.string()
const nullableImageUrl = z.string().nullable()

export const homeContentSchema = z.object({
  hero: z.object({
    kicker: required("Il kicker"),
    titleLine1: required("La prima riga del titolo"),
    titleLine2: required("La seconda riga del titolo"),
    titleLine3: required("La terza riga del titolo"),
    subtitle: optionalText,
    badgeText: optionalText,
    imageUrl: nullableImageUrl,
  }),
  marquee: z.object({ text: optionalText }),
  about: z.object({
    kicker: optionalText,
    title: required("Il titolo della sezione chi siamo"),
    body: optionalText,
  }),
  calendar: z.object({ kicker: optionalText, title: required("Il titolo del calendario"), subLabel: optionalText }),
  corsiSection: z.object({ kicker: optionalText, title: required("Il titolo della sezione corsi") }),
  eventsSection: z.object({ kicker: optionalText, title: required("Il titolo della sezione eventi") }),
  aboutTeaser: z.object({
    kicker: optionalText,
    title: required("Il titolo del teaser chi siamo"),
    body: optionalText,
    imageUrl: nullableImageUrl,
  }),
  ctaBand: z.object({ title: required("Il titolo della cta finale"), subtitle: optionalText }),
})
export type HomeContentFormValues = z.infer<typeof homeContentSchema>

export const corsiContentSchema = z.object({
  hero: z.object({ kicker: optionalText, title: required("Il titolo"), subtitle: optionalText }),
  calendar: z.object({ kicker: optionalText, title: required("Il titolo del calendario"), subtitle: optionalText }),
  join: z.object({
    kicker: optionalText,
    title: required("Il titolo della sezione iscriviti"),
    body: optionalText,
    ctaLabel: required("L'etichetta del pulsante"),
    note: optionalText,
  }),
})
export type CorsiContentFormValues = z.infer<typeof corsiContentSchema>

export const eventiContentSchema = z.object({
  hero: z.object({ kicker: optionalText, title: required("Il titolo"), subtitle: optionalText }),
  ctaBand: z.object({ title: required("Il titolo della cta finale"), subtitle: optionalText }),
})
export type EventiContentFormValues = z.infer<typeof eventiContentSchema>

const valoreItemSchema = z.object({
  title: required("Il titolo del valore"),
  body: optionalText,
})

export const chiSiamoContentSchema = z.object({
  hero: z.object({ kicker: optionalText, title: required("Il titolo"), subtitle: optionalText }),
  story: z.object({
    title: required("Il titolo della storia"),
    paragraph1: optionalText,
    paragraph2: optionalText,
    imageUrl: nullableImageUrl,
  }),
  valori: z.object({
    kicker: optionalText,
    title: required("Il titolo della sezione valori"),
    items: z.array(valoreItemSchema).length(4, "Servono esattamente 4 valori."),
  }),
  crew: z.object({ kicker: optionalText, title: required("Il titolo della sezione crew"), subtitle: optionalText }),
  kids: z.object({
    kicker: optionalText,
    title: required("Il titolo della sezione kids"),
    body: optionalText,
    imageUrl: nullableImageUrl,
  }),
  place: z.object({
    title: required("Il titolo della sede"),
    body: optionalText,
    imageUrl: nullableImageUrl,
    locationName: required("Il nome del luogo"),
    addressLine1: optionalText,
    addressLine2: optionalText,
  }),
  ctaBand: z.object({ title: required("Il titolo della cta finale"), subtitle: optionalText }),
})
export type ChiSiamoContentFormValues = z.infer<typeof chiSiamoContentSchema>

export const footerContentSchema = z.object({
  tagline: optionalText,
  locationName: required("Il nome del luogo"),
  addressLine1: optionalText,
  addressLine2: optionalText,
  instagramHandle: optionalText,
  contactNote: optionalText,
  rightsNote: optionalText,
})
export type FooterContentFormValues = z.infer<typeof footerContentSchema>

export const themeContentSchema = z.object({
  darkModeEnabled: z.boolean(),
  dark: z.object({
    background: hexColor,
    text: hexColor,
    purple: hexColor,
    pink: hexColor,
    green: hexColor,
    orange: hexColor,
  }),
})
export type ThemeContentFormValues = z.infer<typeof themeContentSchema>
