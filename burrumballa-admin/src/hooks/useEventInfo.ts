import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { EventInfo, EventInfoPatch } from "@/types/eventInfo"

// numeric di Postgres puo' arrivare come stringa: si converte sempre.
function normalize(row: EventInfo): EventInfo {
  return {
    ...row,
    battle_prezzi: (row.battle_prezzi ?? []).map(Number),
    maggiorazione_ritardo: Number(row.maggiorazione_ritardo),
    maggiorazione_sul_posto: Number(row.maggiorazione_sul_posto),
  }
}

export interface EventListItem extends EventInfo {
  /** Iscritti non eliminati. */
  iscritti: number
}

export function useEvents() {
  return useQuery({
    queryKey: ["events-list"],
    queryFn: async (): Promise<EventListItem[]> => {
      const [events, regs] = await Promise.all([
        supabase.from("event_info").select("*").order("data_evento", { ascending: false, nullsFirst: true }),
        supabase.from("registrations").select("event_id").is("deleted_at", null),
      ])
      if (events.error) throw events.error
      if (regs.error) throw regs.error
      const counts = new Map<number, number>()
      for (const r of regs.data ?? []) counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1)
      return (events.data ?? []).map((e) => ({ ...normalize(e), iscritti: counts.get(e.id) ?? 0 }))
    },
  })
}

export function useEventInfo(eventId: number) {
  return useQuery({
    queryKey: ["event-info", eventId],
    queryFn: async (): Promise<EventInfo> => {
      const { data, error } = await supabase
        .from("event_info")
        .select("*")
        .eq("id", eventId)
        .single()

      if (error) throw error
      return normalize(data)
    },
  })
}

function invalidateEvent(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["event-info"] })
  queryClient.invalidateQueries({ queryKey: ["events-list"] })
}

// Aggiorna solo i campi passati.
export function useUpdateEventInfo(eventId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (patch: EventInfoPatch) => {
      const { error } = await supabase.from("event_info").update(patch).eq("id", eventId)
      if (error) throw error
    },
    onSuccess: () => invalidateEvent(queryClient),
  })
}

export interface CreateEventInput {
  titolo: string
  slug: string
  data_evento: string | null
  scadenza_iscrizioni: string
  /** Evento da cui copiare opzioni (con composizioni), giuria, prezzi, testi e colori. */
  copyFromId: number | null
}

const OPTION_COPY_COLUMNS =
  "id, tipo, chiave, label, prezzo, max_posti, sold_out_manuale, attivo, ordine, composto, richiede_partner"

// Nuovo evento (non pubblicato). Senza un evento da copiare parte con le
// due voci "nessuna scelta" che il form pubblico si aspetta.
export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ copyFromId, ...input }: CreateEventInput): Promise<number> => {
      let base: Partial<EventInfo> = {}
      if (copyFromId) {
        const { data, error } = await supabase.from("event_info").select("*").eq("id", copyFromId).single()
        if (error) throw error
        const {
          id: _id,
          slug: _slug,
          titolo: _titolo,
          data_evento: _data,
          scadenza_iscrizioni: _scadenza,
          pubblicato: _pubblicato,
          immagine_copertina: _cover,
          immagine_cornice: _frame,
          immagine_logo: _logo,
          created_at: _created,
          updated_at: _updated,
          ...rest
        } = data as EventInfo
        base = rest
      }

      const { data: created, error } = await supabase
        .from("event_info")
        .insert({ ...base, ...input, pubblicato: false })
        .select("id")
        .single()
      if (error) throw error
      const eventId = created.id as number

      if (!copyFromId) {
        const { error: optError } = await supabase.from("event_options").insert([
          { event_id: eventId, tipo: "workshop", chiave: "no_workshop", label: "Nessun workshop", prezzo: 0, ordine: 99 },
          { event_id: eventId, tipo: "battle", chiave: "no_battle", label: "Nessuna battle", prezzo: 0, ordine: 99 },
        ])
        if (optError) throw optError
        return eventId
      }

      const { data: options, error: optError } = await supabase
        .from("event_options")
        .select(OPTION_COPY_COLUMNS)
        .eq("event_id", copyFromId)
        .is("deleted_at", null)
      if (optError) throw optError
      if (options && options.length > 0) {
        const { data: inserted, error: insError } = await supabase
          .from("event_options")
          .insert(options.map(({ id: _id, ...o }) => ({ ...o, event_id: eventId })))
          .select("id, chiave")
        if (insError) throw insError

        // Composizioni dei workshop: si rimappano gli id tramite la chiave.
        const oldIds = options.map((o) => o.id)
        const { data: comps, error: compError } = await supabase
          .from("event_option_components")
          .select("parent_id, child_id")
          .in("parent_id", oldIds)
        if (compError) throw compError
        const chiaveByOldId = new Map(options.map((o) => [o.id, o.chiave]))
        const newIdByChiave = new Map((inserted ?? []).map((o) => [o.chiave, o.id]))
        const mapped = (comps ?? [])
          .map((c) => ({
            parent_id: newIdByChiave.get(chiaveByOldId.get(c.parent_id) ?? ""),
            child_id: newIdByChiave.get(chiaveByOldId.get(c.child_id) ?? ""),
          }))
          .filter((c): c is { parent_id: string; child_id: string } => !!c.parent_id && !!c.child_id)
        if (mapped.length > 0) {
          const { error: e } = await supabase.from("event_option_components").insert(mapped)
          if (e) throw e
        }
      }

      const { data: people, error: peopleError } = await supabase
        .from("event_people")
        .select("categoria, nome, ruolo, immagine_path, colore, ordine, attivo")
        .eq("event_id", copyFromId)
      if (peopleError) throw peopleError
      if (people && people.length > 0) {
        const { error: e } = await supabase
          .from("event_people")
          .insert(people.map((p) => ({ ...p, event_id: eventId })))
        if (e) throw e
      }

      return eventId
    },
    onSuccess: () => invalidateEvent(queryClient),
  })
}

// Possibile solo senza iscrizioni (vincolo su registrations): altrimenti
// l'evento si archivia togliendolo dal sito.
export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (eventId: number) => {
      const { error } = await supabase.from("event_info").delete().eq("id", eventId)
      if (error) {
        if (error.code === "23503") {
          throw new Error("L'evento ha delle iscrizioni: toglilo dal sito invece di eliminarlo.")
        }
        throw error
      }
    },
    onSuccess: () => invalidateEvent(queryClient),
  })
}
