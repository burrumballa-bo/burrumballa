import type {
  ChiSiamoContent,
  CorsiContent,
  EventiContent,
  FooterContent,
  HomeContent,
  ThemeContent,
} from "@/types/cms"

// Stessa copy di default di burrumballa-web/src/lib/cms/defaults.ts: usata
// come default dei form quando una riga di site_pages non esiste ancora.

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
  faq: {
    kicker: "domande & risposte",
    title: "Le cose che ci chiedete sempre",
    subtitle:
      "Quello che ci chiedono tutti prima di mettere piede in sala. Se non trovi la tua risposta, scrivici su Instagram: rispondiamo noi, non un bot.",
    items: [
      {
        question: "Devo saper ballare per iniziare?",
        answer:
          "No. I corsi partono dalle fondamenta: nel livello base si comincia da zero, con calma e senza sentirsi fuori posto. Se hai già ballato ti mettiamo nel livello giusto dopo la prima lezione.",
      },
      {
        question: "Come funziona la lezione di prova?",
        answer:
          "La prima lezione è gratuita. Scrivici su Instagram o passa al Circolo dicendoci quale corso ti interessa: ti confermiamo giorno e orario e ti aspettiamo in sala.",
      },
      {
        question: "Cosa devo portare la prima volta?",
        answer:
          "Abbigliamento comodo, un paio di scarpe da tenere solo per la sala e una bottiglia d'acqua. Nient'altro: il resto lo trovi qui.",
      },
      {
        question: "Serve la tessera ARCI?",
        answer:
          "Sì, è obbligatoria: le lezioni sono dentro il Circolo La Fattoria. Si fa in sede in cinque minuti e vale per tutta la stagione, anche per gli eventi.",
      },
      {
        question: "Da che età si può ballare con voi?",
        answer:
          "Dai corsi kids agli adulti. Le classi sono divise per età e livello, quindi c'è spazio sia per i più piccoli che per chi decide di cominciare a trent'anni.",
      },
      {
        question: "Posso iscrivermi a stagione già iniziata?",
        answer:
          "Sì. Le iscrizioni restano aperte tutto l'anno: se nel corso che ti interessa c'è ancora posto puoi entrare in qualsiasi momento.",
      },
    ],
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

// Tema di default: scuro, sfondo nero — deve restare identico alla copia in
// burrumballa-web/src/lib/cms/defaults.ts (usata come fallback finché non
// esiste una riga "theme" salvata). Mode e logo si scelgono da Impostazioni
// generali, i colori del tema scuro da questa stessa pagina (Contenuti —
// Tema); i colori del tema chiaro restano hardcoded nel CSS del sito.
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
