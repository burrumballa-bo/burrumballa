import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { AppSettings } from "@/types/appSettings"
import type { AppSettingsFormValues } from "@/lib/appSettingsSchema"

const TIMBRO_BUCKET = "assets"
const TIMBRO_SIGNED_URL_TTL_SECONDS = 60 * 60

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}

function getFileExtension(file: File) {
  return EXTENSION_BY_MIME[file.type] ?? file.name.split(".").pop() ?? "png"
}

export function useAppSettings() {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: async (): Promise<AppSettings> => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .single()

      if (error) throw error
      return {
        ...data,
        prezzo_tessera: data.prezzo_tessera == null ? null : Number(data.prezzo_tessera),
        prezzo_quota_iscrizione:
          data.prezzo_quota_iscrizione == null ? null : Number(data.prezzo_quota_iscrizione),
      }
    },
  })
}

// Usata per timbro e firma (stesso bucket privato).
export function useTimbroSignedUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["timbro-signed-url", path],
    queryFn: async (): Promise<string | null> => {
      if (!path) return null
      const { data, error } = await supabase.storage
        .from(TIMBRO_BUCKET)
        .createSignedUrl(path, TIMBRO_SIGNED_URL_TTL_SECONDS)

      if (error) throw error
      return data.signedUrl
    },
    enabled: !!path,
  })
}

// Timbro e firma: un file fisso per tipo (upsert), il path va in app_settings.
async function uploadSettingsImage(folder: "timbro" | "firma", file: File): Promise<string> {
  const path = `${folder}/${folder}.${getFileExtension(file)}`
  const { error } = await supabase.storage
    .from(TIMBRO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  return path
}

function priceOrNull(value: string): number | null {
  return value === "" ? null : Number(value)
}

export function useUpdateAppSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      values,
      timbroFile,
      firmaFile,
    }: {
      values: AppSettingsFormValues
      timbroFile: File | null
      firmaFile: File | null
    }) => {
      const timbroPath = timbroFile ? await uploadSettingsImage("timbro", timbroFile) : undefined
      const firmaPath = firmaFile ? await uploadSettingsImage("firma", firmaFile) : undefined

      const { error } = await supabase
        .from("app_settings")
        .update({
          email_contatti: values.email_contatti,
          email_mittente_generale: values.email_mittente_generale || null,
          ricevuta_intestazione: values.ricevuta_intestazione,
          ricevuta_indirizzo: values.ricevuta_indirizzo || null,
          ricevuta_piva_cf: values.ricevuta_piva_cf || null,
          ricevuta_iban: values.ricevuta_iban
            ? values.ricevuta_iban.replace(/\s+/g, "").toUpperCase()
            : null,
          ricevuta_note: values.ricevuta_note || null,
          presidente_nome: values.presidente_nome || null,
          stagione_mese_inizio: Number(values.stagione_mese_inizio),
          prezzo_tessera: priceOrNull(values.prezzo_tessera),
          prezzo_quota_iscrizione: priceOrNull(values.prezzo_quota_iscrizione),
          ...(timbroPath ? { timbro_url: timbroPath } : {}),
          ...(firmaPath ? { firma_url: firmaPath } : {}),
        })
        .eq("id", 1)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] })
      // Il path di timbro/firma non cambia al ricaricamento: la signed URL va rigenerata.
      queryClient.invalidateQueries({ queryKey: ["timbro-signed-url"] })
    },
  })
}
