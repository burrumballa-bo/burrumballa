import { type ChangeEvent } from "react"
import { ImageOff, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useSignedAssetUrl, useUploadEventImage } from "@/hooks/useEventPeople"

const MAX_SIZE_BYTES = 8 * 1024 * 1024

interface EventImageFieldProps {
  eventId: number
  label: string
  hint?: string
  value: string | null
  /** File gia' caricati per l'evento (path nel bucket "assets"). */
  files: string[]
  onChange: (path: string | null) => void
  disabled?: boolean
}

// Immagine della pagina evento: si sceglie tra i file dell'evento o se ne
// carica una nuova (salvata subito in assets/eventi/<id>/).
export function EventImageField({ eventId, label, hint, value, files, onChange, disabled }: EventImageFieldProps) {
  const preview = useSignedAssetUrl(value)
  const upload = useUploadEventImage(eventId)
  const options = value && !files.includes(value) ? [value, ...files] : files

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) return void toast.error("Il file deve essere un'immagine.")
    if (file.size > MAX_SIZE_BYTES) return void toast.error("L'immagine non può superare gli 8 MB.")
    upload.mutate(file, {
      onSuccess: (path) => onChange(path),
      onError: (error) => toast.error("Caricamento non riuscito.", { description: (error as Error).message }),
    })
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        {preview.data ? (
          <img
            src={preview.data}
            alt={`Anteprima ${label.toLowerCase()}`}
            className="border-input h-20 w-28 shrink-0 rounded-md border object-cover"
          />
        ) : (
          <div className="border-input text-muted-foreground flex h-20 w-28 shrink-0 items-center justify-center rounded-md border border-dashed">
            <ImageOff className="size-5" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <Select
            aria-label={label}
            value={value ?? ""}
            disabled={disabled || upload.isPending}
            onChange={(e) => onChange(e.target.value || null)}
          >
            <option value="">Nessuna immagine</option>
            {options.map((path) => (
              <option key={path} value={path}>
                {path.split("/").pop()}
              </option>
            ))}
          </Select>
          <label className="border-input hover:bg-accent inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors">
            {upload.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            Carica nuova
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={disabled || upload.isPending}
              onChange={handleFile}
            />
          </label>
        </div>
      </div>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}
