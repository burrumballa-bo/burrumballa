import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type {
  EventPerson,
  EventPersonCreateInput,
  EventPersonUpdateInput,
} from "@/types/eventPerson"

// Stesso bucket privato del timbro ricevute (vedi useAppSettings.ts). Le
// immagini di un evento (hero, giuria, host/dj) stanno in 'eventi/<id>/';
// il primo evento usa anche la cartella storica 'senti_come_suona/'.
const ASSETS_BUCKET = "assets"
const LEGACY_FOLDER = "senti_come_suona"
const SIGNED_URL_TTL_SECONDS = 60 * 60

export function eventImageFolder(eventId: number) {
  return `eventi/${eventId}`
}

export function useEventPeople(eventId: number) {
  return useQuery({
    queryKey: ["event-people", eventId],
    queryFn: async (): Promise<EventPerson[]> => {
      const { data, error } = await supabase
        .from("event_people")
        .select("*")
        .eq("event_id", eventId)
        .order("categoria", { ascending: true })
        .order("ordine", { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })
}

async function listFolder(folder: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(ASSETS_BUCKET)
    .list(folder, { sortBy: { column: "name", order: "asc" } })
  if (error) throw error
  return (data ?? [])
    .filter((file) => file.name && !file.name.startsWith(".") && file.id)
    .map((file) => `${folder}/${file.name}`)
}

// File gia' caricati per l'evento: popolano i selettori immagine, cosi'
// l'admin sceglie tra i file invece di doverne digitare il path.
export function useEventImageFiles(eventId: number) {
  return useQuery({
    queryKey: ["event-image-files", eventId],
    queryFn: async (): Promise<string[]> => {
      const own = await listFolder(eventImageFolder(eventId))
      return eventId === 1 ? [...(await listFolder(LEGACY_FOLDER)), ...own] : own
    },
  })
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
}

// Carica un'immagine nella cartella dell'evento e ne restituisce il path.
export function useUploadEventImage(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const base = file.name
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      const ext = EXTENSION_BY_MIME[file.type] ?? file.name.split(".").pop() ?? "jpg"
      const path = `${eventImageFolder(eventId)}/${base || "immagine"}-${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from(ASSETS_BUCKET)
        .upload(path, file, { contentType: file.type })
      if (error) throw error
      return path
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-image-files", eventId] }),
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
    mutationFn: async (input: EventPersonCreateInput) => {
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
