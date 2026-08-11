import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type {
  EventPerson,
  EventPersonInsertInput,
  EventPersonUpdateInput,
} from "@/types/eventPerson"

// Stesso bucket privato del timbro ricevute (vedi useAppSettings.ts):
// la cartella 'senti_come_suona/' contiene le foto di giuria/host/dj e gli
// asset dell'hero della pagina evento, già caricati dall'admin su Storage.
const ASSETS_BUCKET = "assets"
const SENTI_COME_SUONA_FOLDER = "senti_come_suona"
const SIGNED_URL_TTL_SECONDS = 60 * 60

export function useEventPeople() {
  return useQuery({
    queryKey: ["event-people"],
    queryFn: async (): Promise<EventPerson[]> => {
      const { data, error } = await supabase
        .from("event_people")
        .select("*")
        .order("categoria", { ascending: true })
        .order("ordine", { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })
}

// Elenco dei file già caricati nella cartella 'senti_come_suona/': usato
// per popolare il selettore immagine, così l'admin sceglie tra i file
// caricati su Storage invece di doverne digitare il path a mano.
export function useSentiComeSuonaImageFiles() {
  return useQuery({
    queryKey: ["senti-come-suona-image-files"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.storage
        .from(ASSETS_BUCKET)
        .list(SENTI_COME_SUONA_FOLDER, {
          sortBy: { column: "name", order: "asc" },
        })

      if (error) throw error
      return (data ?? [])
        .filter((file) => file.name && !file.name.startsWith("."))
        .map((file) => `${SENTI_COME_SUONA_FOLDER}/${file.name}`)
    },
  })
}

export function useSignedAssetUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["signed-asset-url", path],
    queryFn: async (): Promise<string | null> => {
      if (!path) return null
      const { data, error } = await supabase.storage
        .from(ASSETS_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

      if (error) throw error
      return data.signedUrl
    },
    enabled: !!path,
  })
}

export function useCreateEventPerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: EventPersonInsertInput) => {
      const { error } = await supabase.from("event_people").insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-people"] })
    },
  })
}

export function useUpdateEventPerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: EventPersonUpdateInput) => {
      const { id, ...values } = input
      const { error } = await supabase.from("event_people").update(values).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-people"] })
    },
  })
}

export function useDeleteEventPerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_people").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-people"] })
    },
  })
}
