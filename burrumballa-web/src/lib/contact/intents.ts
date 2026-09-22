// Un "intent" è il contesto da cui parte un contatto: dà il titolo al
// popup, l'oggetto all'email che riceve la scuola e il messaggio già
// iniziato nel campo di testo. Sta qui, in un unico posto, perché gli
// stessi pulsanti (iscriviti a un corso / lezione di prova) compaiono in
// più pagine e devono raccontare sempre la stessa cosa.
//
// Attenzione: descrive la richiesta *prima* dell'invio. Il ringraziamento
// che si vede dopo aver spedito è un'altra cosa e vive in <ContactForm>,
// che è l'unico a sapere quando il messaggio è davvero partito.

export interface ContactIntent {
  /** Titolo del popup. */
  title: string;
  /** Riga di contesto sotto al titolo del popup. */
  description: string;
  /** Oggetto dell'email che arriva alla scuola. */
  topic: string;
  /** Testo già scritto nel campo messaggio, da completare a mano. */
  message: string;
}

/** Oggetto dei messaggi che partono dal form libero in home. */
export const GENERAL_CONTACT_TOPIC = "Richiesta di informazioni";

/** "Iscriviti a un corso": generico, oppure riferito a un corso preciso. */
export function courseSignupIntent(courseName?: string): ContactIntent {
  const corso = courseName?.trim();

  return {
    title: corso ? `Iscriviti a ${corso}` : "Iscriviti a un corso",
    description:
      "Lasciaci due righe e i tuoi contatti: ti scriviamo noi con orari, livelli e come iniziare.",
    topic: corso ? `Iscrizione al corso di ${corso}` : "Iscrizione a un corso",
    message: corso
      ? `Ciao! Vorrei iscrivermi al corso di ${corso}. Mi piacerebbe sapere orari, livelli disponibili e come funziona la prima lezione.`
      : "Ciao! Vorrei iscrivermi a un corso. Mi piacerebbe sapere orari, livelli disponibili e come funziona la prima lezione.",
  };
}

/** "Lezione di prova": la prima lezione, gratuita. */
export function trialLessonIntent(courseName?: string): ContactIntent {
  const corso = courseName?.trim();

  return {
    title: "Lezione di prova",
    description:
      "Dicci quando ti torna comodo passare: ti confermiamo giorno e orario in sala.",
    topic: corso ? `Lezione di prova — ${corso}` : "Lezione di prova",
    message: corso
      ? `Ciao! Vorrei prenotare una lezione di prova di ${corso}. Fatemi sapere quando posso passare.`
      : "Ciao! Vorrei prenotare una lezione di prova. Fatemi sapere quali giorni sono disponibili e quale corso mi consigliate.",
  };
}
