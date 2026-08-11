import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save, Trash2 } from "lucide-react"

import { TableCell, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useSignedAssetUrl } from "@/hooks/useEventPeople"
import { eventPersonSchema, type EventPersonFormValues } from "@/lib/eventPersonSchema"
import type { EventPerson, EventPersonUpdateInput } from "@/types/eventPerson"

interface EventPersonRowProps {
  person: EventPerson
  imageFiles: string[]
  onSave: (input: EventPersonUpdateInput) => void
  onDelete: (id: string) => void
  isSaving: boolean
  isDeleting: boolean
}

export function EventPersonRow({
  person,
  imageFiles,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: EventPersonRowProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EventPersonFormValues>({
    resolver: zodResolver(eventPersonSchema),
    defaultValues: {
      categoria: person.categoria,
      nome: person.nome,
      ruolo: person.ruolo ?? "",
      immagine_path: person.immagine_path ?? "",
      colore: person.colore ?? "",
      ordine: String(person.ordine),
      attivo: person.attivo,
    },
  })

  const immaginePath = watch("immagine_path")
  const colore = watch("colore")
  const attivo = watch("attivo")
  const signedUrlQuery = useSignedAssetUrl(immaginePath || null)

  const onSubmit = (values: EventPersonFormValues) => {
    onSave({
      id: person.id,
      categoria: values.categoria,
      nome: values.nome.trim(),
      ruolo: values.ruolo.trim() || null,
      immagine_path: values.immagine_path || null,
      colore: values.colore.trim() || null,
      ordine: Number(values.ordine),
      attivo: values.attivo,
    })
  }

  return (
    <TableRow>
      <TableCell className="w-32">
        <Select aria-label={`Categoria ${person.nome}`} {...register("categoria")}>
          <option value="giuria">Giuria</option>
          <option value="host_dj">Host / DJ</option>
        </Select>
      </TableCell>
      <TableCell className="min-w-[130px]">
        <Input
          aria-label={`Nome ${person.nome}`}
          aria-invalid={!!errors.nome}
          {...register("nome")}
        />
        {errors.nome && (
          <p className="text-destructive mt-1 text-xs">{errors.nome.message}</p>
        )}
      </TableCell>
      <TableCell className="min-w-[150px]">
        <Input
          aria-label={`Ruolo ${person.nome}`}
          placeholder="Es. JUDGE"
          {...register("ruolo")}
        />
      </TableCell>
      <TableCell className="min-w-[200px]">
        <div className="flex items-center gap-2">
          {signedUrlQuery.data ? (
            <img
              src={signedUrlQuery.data}
              alt=""
              className="h-9 w-9 shrink-0 rounded-sm border object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-dashed text-[9px]">
              —
            </div>
          )}
          <Select aria-label={`Immagine ${person.nome}`} {...register("immagine_path")}>
            <option value="">Nessuna immagine</option>
            {imageFiles.map((path) => (
              <option key={path} value={path}>
                {path.split("/").pop()}
              </option>
            ))}
          </Select>
        </div>
      </TableCell>
      <TableCell className="w-36">
        <div className="flex items-center gap-2">
          <span
            className="border-input h-6 w-6 shrink-0 rounded-sm border"
            style={{ backgroundColor: colore || "transparent" }}
            aria-hidden
          />
          <Input
            aria-label={`Colore ${person.nome}`}
            placeholder="#a855f7"
            aria-invalid={!!errors.colore}
            {...register("colore")}
          />
        </div>
        {errors.colore && (
          <p className="text-destructive mt-1 text-xs">{errors.colore.message}</p>
        )}
      </TableCell>
      <TableCell className="w-16">
        <Input
          type="number"
          step="1"
          aria-label={`Ordine ${person.nome}`}
          aria-invalid={!!errors.ordine}
          {...register("ordine")}
        />
      </TableCell>
      <TableCell className="text-center">
        <Switch
          aria-label={`Attivo/non attivo ${person.nome}`}
          checked={attivo}
          onCheckedChange={(value) => setValue("attivo", value, { shouldDirty: true })}
        />
      </TableCell>
      <TableCell className="text-right whitespace-nowrap">
        <Button
          type="button"
          size="sm"
          variant={isDirty ? "default" : "outline"}
          disabled={isSaving}
          onClick={handleSubmit(onSubmit)}
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          Salva
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive ml-1"
          disabled={isDeleting}
          onClick={() => onDelete(person.id)}
        >
          {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
        </Button>
      </TableCell>
    </TableRow>
  )
}
