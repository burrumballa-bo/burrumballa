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
      return data
    },
  })
}

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

export function useUpdateAppSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      values,
      timbroFile,
    }: {
      values: AppSettingsFormValues
      timbroFile: File | null
    }) => {
      let timbroPath: string | undefined

      if (timbroFile) {
        const path = `timbro/timbro.${getFileExtension(timbroFile)}`
        const { error: uploadError } = await supabase.storage
          .from(TIMBRO_BUCKET)
          .upload(path, timbroFile, {
            upsert: true,
            contentType: timbroFile.type,
          })

        if (uploadError) throw uploadError
        timbroPath = path
      }

      const { error } = await supabase
        .from("app_settings")
        .update({
          email_mittente: values.email_mittente,
          ricevuta_intestazione: values.ricevuta_intestazione,
          ricevuta_indirizzo: values.ricevuta_indirizzo || null,
          ricevuta_piva_cf: values.ricevuta_piva_cf || null,
          ricevuta_iban: values.ricevuta_iban
            ? values.ricevuta_iban.replace(/\s+/g, "").toUpperCase()
            : null,
          ricevuta_note: values.ricevuta_note || null,
          ...(timbroPath ? { timbro_url: timbroPath } : {}),
        })
        .eq("id", 1)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] })
    },
  })
}
