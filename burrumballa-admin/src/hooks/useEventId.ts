import { useParams } from "react-router-dom"

// Evento delle pagine /admin/eventi/:eventId/... (anche per i componenti
// che stanno dentro quelle pagine, es. il modale iscritto).
export function useEventId(): number {
  const { eventId } = useParams<{ eventId: string }>()
  const id = Number(eventId)
  if (!Number.isInteger(id) || id <= 0) throw new Error("Evento non valido nell'indirizzo.")
  return id
}
