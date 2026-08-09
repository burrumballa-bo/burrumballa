import { redirect } from "next/navigation"

// Il form di iscrizione è stato unito alla pagina dell'evento
// (vedi /eventi/senti-come-suona#iscrizione): questa route resta solo
// per non rompere eventuali link salvati.
export default function IscrizioneSentiComeSuonaPage() {
  redirect("/eventi/senti-come-suona#iscrizione")
}
