import { useMutation } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

const SITE_MEDIA_BUCKET = "site-media"

function slugifyFileName(name: string): string {
  const dotIndex = name.lastIndexOf(".")
  const base = dotIndex > 0 ? name.slice(0, dotIndex) : name
  const ext = dotIndex > 0 ? name.slice(dotIndex + 1) : ""
  const slug = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  return ext ? `${slug}.${ext.toLowerCase()}` : slug
}

// Carica un'immagine/gif/video nel bucket pubblico "site-media" (usato da
// tutti i campi media del CMS) e restituisce l'URL pubblico da salvare nel
// campo *_url della riga corrispondente.
export function useUploadSiteMedia(folder: string) {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const path = `${folder}/${Date.now()}-${slugifyFileName(file.name)}`
      const { error } = await supabase.storage
        .from(SITE_MEDIA_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false })

      if (error) throw error

      const { data } = supabase.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(path)
      return data.publicUrl
    },
  })
}
