import { type ChangeEvent } from "react"
import { ImageOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { useUploadSiteMedia } from "@/hooks/useMediaUpload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov|ogg)(\?|$)/i

interface MediaUploadFieldProps {
  label: string
  value: string | null
  onChange: (url: string | null) => void
  /** Sottocartella del bucket "site-media" in cui salvare il file (es. "courses", "events"). */
  folder: string
  hint?: string
}

// Campo di upload riusato da tutti i form del CMS: un solo file
// (immagine, gif o video, rilevato dall'estensione) per ogni slot media,
// caricato nel bucket pubblico "site-media".
export function MediaUploadField({ label, value, onChange, folder, hint }: MediaUploadFieldProps) {
  const upload = useUploadSiteMedia(folder)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    upload.mutate(file, {
      onSuccess: (url) => onChange(url),
      onError: (error) =>
        toast.error("Caricamento non riuscito.", { description: (error as Error).message }),
    })
  }

  const isVideo = value ? VIDEO_EXTENSION_PATTERN.test(value) : false

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        {value ? (
          isVideo ? (
            <video
              src={value}
              className="h-24 w-24 rounded-md border object-cover"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <img src={value} alt="" className="h-24 w-24 rounded-md border object-cover" />
          )
        ) : (
          <div className="border-input text-muted-foreground flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-dashed">
            <ImageOff className="size-6" />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <Input
            type="file"
            accept="image/*,video/mp4,video/webm"
            onChange={handleFileChange}
            disabled={upload.isPending}
          />
          {upload.isPending && (
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
              <Loader2 className="size-3 animate-spin" /> Caricamento...
            </p>
          )}
          {value && (
            <Button type="button" variant="outline" size="sm" onClick={() => onChange(null)}>
              Rimuovi
            </Button>
          )}
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
      </div>
    </div>
  )
}
