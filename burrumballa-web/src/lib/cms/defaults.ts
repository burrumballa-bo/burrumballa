import type {
  ChiSiamoContent,
  CorsiContent,
  EventiContent,
  FooterContent,
  HomeContent,
  ThemeContent,
} from "./types"

// Copy di default (allineata al mockup e al seed della migrazione): usata
// come fallback quando `site_pages` non è raggiungibile o una riga non
// esiste ancora, così le pagine restano sempre renderizzabili.

export const DEFAULT_HOME_CONTENT: HomeContent = {
  hero: {
    kicker: "scuola di danza urbana · bologna",
    titleLine1: "L'HIP HOP",
    titleLine2: "NON È SPORT.",
    titleLine3: "È CASA.",
    subtitle:
      "Breaking, hip hop, house e popping. Dal principiante all'avanzato, in una crew vera al Circolo La Fattoria.",
    badgeText: "EST. BOLOGNA",
    imageUrl: null,
    triangleImageUrl: null,
  },
  marquee: {
    text: "ISCRIZIONI APERTE ✦ OPEN CLASS ✦ BATTLE NIGHT ✦ APERICREATIVO ✦ FREEDAY TRAINING ✦ ",
  },
  about: {
    kicker: "chi siamo",
    title: "Burrumballa, scuola di danza hip hop a Bologna",
    body: "Burrumballa è una scuola di danza urbana e collettivo hip hop nato al Circolo La Fattoria di Bologna. Corsi di breaking, hip hop, house e popping per bambini, ragazzi e adulti di ogni livello, più eventi, battle e serate aperte a tutto il quartiere: non una palestra, una crew vera.",
  },
  calendar: { kicker: "il programma", title: "Cosa succede", subLabel: "Lezioni ed eventi" },
  corsiSection: { kicker: "quattro discipline, tutti i livelli", title: "I corsi" },
  eventsSection: { kicker: "non solo lezioni", title: "Eventi" },
  aboutTeaser: {
    kicker: "chi siamo",
    title: "Una scuola che è anche casa.",
    body: "Burrumballa nasce a Bologna come scuola e collettivo hip hop. Insegnanti che vengono dalla scena, una community che balla, organizza eventi e si prende cura del quartiere.",
    imageUrl: null,
  },
  ctaBand: {
    title: "Entra nella crew.",
    subtitle: "Prima lezione di prova gratuita. Tessera ARCI obbligatoria.",
  },
}

export const DEFAULT_CORSI_CONTENT: CorsiContent = {
  hero: {
    kicker: "quattro discipline · tutti i livelli",
    title: "I corsi",
    subtitle:
      "Breaking, hip hop, house e popping. Lezioni settimanali al Circolo La Fattoria, dal principiante all'avanzato. Scegli la tua disciplina e il tuo livello.",
  },
  calendar: {
    kicker: "orari settimanali",
    title: "Il settimanale",
    subtitle: "Le lezioni dei corsi, lun–dom. Gli eventi li trovi nella pagina Eventi.",
  },
  join: {
    kicker: "pronti?",
    title: "Iscriviti a un corso",
    body: "Prima lezione di prova gratuita. Scrivici su Instagram o passa al Circolo per fissare il tuo posto. Tessera ARCI obbligatoria.",
    ctaLabel: "Prenota la prova",
    note: "o scrivi a @burrumballa",
  },
}

export const DEFAULT_EVENTI_CONTENT: EventiContent = {
  hero: {
    kicker: "battle, party, workshop & community",
    title: "Eventi",
    subtitle:
      "La scuola è anche un collettivo: battle, spettacoli, open class e serate aperte a tutto il quartiere. Tessera ARCI obbligatoria.",
  },
  ctaBand: {
    title: "Vieni a ballare con noi.",
    subtitle: "Iscriviti a un corso o passa a un evento. La porta è aperta.",
  },
}

export const DEFAULT_CHI_SIAMO_CONTENT: ChiSiamoContent = {
  hero: {
    kicker: "chi siamo",
    title: "Non una scuola e basta. Una casa dove l'hip hop si vive.",
    subtitle:
      "Burrumballa è una scuola di danza urbana e un collettivo nato a Bologna, al Circolo La Fattoria. Crediamo che ballare sia un modo di stare insieme, prendersi cura del quartiere e dare spazio ai giovani.",
  },
  story: {
    title: "Come è nata",
    paragraph1:
      "Tutto parte da un gruppo di ballerini e ballerine che volevano un posto vero dove allenarsi, condividere e crescere. Non una palestra, ma una crew: con i suoi insegnanti, i suoi eventi, la sua musica alta a porte aperte.",
    paragraph2:
      "Oggi Burrumballa porta avanti corsi per tutti i livelli, battle, open class e serate aperte a tutto il quartiere — sempre con lo stesso spirito: energia, passione e divertimento.",
    imageUrl: null,
  },
  valori: {
    kicker: "in cosa crediamo",
    title: "I nostri valori",
    items: [
      { title: "CULTURA", body: "L'hip hop è una cultura, non solo passi. Foundation, storia e rispetto vengono prima di tutto." },
      { title: "COMMUNITY", body: "Qui nessuno balla da solo. La crew si sostiene, dentro e fuori dalla sala." },
      { title: "QUARTIERE", body: "Diamo spazio ai giovani del quartiere. La porta è sempre aperta." },
      { title: "DIVERTIMENTO", body: "Si fa sul serio, ma ci si diverte. Lo dicono anche i nostri insegnanti." },
    ],
  },
  crew: {
    kicker: "questi chi sono?",
    title: "La crew",
    subtitle:
      "Insegnanti che vengono dalla scena, ognuno con il suo stile. Energia, passione, esperienza — e quelle cose che dicono servano a un insegnante.",
  },
  kids: {
    kicker: "le nuove leve",
    title: "Anche i più piccoli ballano",
    body: "Corsi kids per crescere con la cultura hip hop dal primo passo. Disciplina, gioco e tanta energia — perché il futuro della crew comincia da loro.",
    imageUrl: null,
  },
  place: {
    title: "La nostra casa",
    body: "Ci alleniamo al Circolo La Fattoria, uno spazio che i ragazzi del quartiere stanno facendo rivivere a colpi di murales, dj set e danza.",
    imageUrl: null,
    locationName: "Circolo La Fattoria",
    addressLine1: "Via Pirandello 6",
    addressLine2: "Bologna",
  },
  ctaBand: {
    title: "Fai parte di tutto questo.",
    subtitle: "Prima lezione di prova gratuita. Tessera ARCI obbligatoria.",
  },
}

export const DEFAULT_FOOTER_CONTENT: FooterContent = {
  tagline: "Scuola di danza urbana e collettivo hip hop al Circolo La Fattoria.",
  locationName: "Circolo La Fattoria",
  addressLine1: "Via Pirandello 6",
  addressLine2: "Bologna",
  instagramHandle: "burrumballa",
  contactNote: "Tessera ARCI obbligatoria",
  rightsNote: "Tutti i diritti riservati",
}

// Tema di default: scuro, sfondo nero — il sito pubblico è un muro
// underground/ostile (vedi WallBackground), non più il tema chiaro
// originale. Mode e logo si scelgono da /admin/contenuti/impostazioni-
// generali, i colori del tema scuro da /admin/contenuti/tema; i colori del
// tema chiaro restano hardcoded in globals.css.
export const DEFAULT_THEME_CONTENT: ThemeContent = {
  mode: "dark",
  headerLogo: "white",
  dark: {
    background: "#000000",
    text: "#f3efe6",
    purple: "#7e3fae",
    pink: "#ec1e89",
    green: "#8be03c",
    orange: "#f6a323",
  },
}
