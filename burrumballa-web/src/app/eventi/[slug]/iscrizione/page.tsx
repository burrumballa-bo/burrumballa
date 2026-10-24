import { redirect } from "next/navigation"

// Il form di iscrizione è stato unito alla pagina dell'evento
// (vedi /eventi/<slug>#iscrizione): questa route resta solo per non
// rompere eventuali link salvati.
export default async function IscrizioneEventoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  redirect(`/eventi/${(await params).slug}#iscrizione`)
}
