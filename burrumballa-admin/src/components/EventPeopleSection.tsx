import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, Plus } from "lucide-react"

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { EventPersonRow } from "@/components/EventPersonRow"
import {
  eventPersonSchema,
  emptyEventPersonFormValues,
  type EventPersonFormValues,
} from "@/lib/eventPersonSchema"
import type {
  EventPerson,
  EventPersonInsertInput,
  EventPersonUpdateInput,
} from "@/types/eventPerson"

interface EventPeopleSectionProps {
  people: EventPerson[]
  imageFiles: string[]
  onCreate: (input: EventPersonInsertInput, onDone: () => void) => void
  onSave: (input: EventPersonUpdateInput) => void
  onDelete: (id: string) => void
  savingId: string | null
  deletingId: string | null
  isCreating: boolean
}

export function EventPeopleSection({
  people,
  imageFiles,
  onCreate,
  onSave,
  onDelete,
  savingId,
  deletingId,
  isCreating,
}: EventPeopleSectionProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventPersonFormValues>({
    resolver: zodResolver(eventPersonSchema),
    defaultValues: emptyEventPersonFormValues,
  })

  const attivo = watch("attivo")
  const colore = watch("colore")

  const onSubmit = (values: EventPersonFormValues) => {
    onCreate(
      {
        categoria: values.categoria,
        nome: values.nome.trim(),
        ruolo: values.ruolo.trim() || null,
        immagine_path: values.immagine_path || null,
        colore: values.colore.trim() || null,
        ordine: Number(values.ordine),
        attivo: values.attivo,
      },
      () => reset(emptyEventPersonFormValues)
    )
  }

  return (
    <div className="space-y-4">
      {people.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna persona configurata.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Immagine</TableHead>
                <TableHead>Colore</TableHead>
                <TableHead>Ordine</TableHead>
                <TableHead className="text-center">Attivo</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => (
                <EventPersonRow
                  key={person.id}
                  person={person}
                  imageFiles={imageFiles}
                  onSave={onSave}
                  onDelete={onDelete}
                  isSaving={savingId === person.id}
                  isDeleting={deletingId === person.id}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-3 rounded-md border border-dashed p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="new-categoria">Categoria</Label>
          <Select id="new-categoria" {...register("categoria")}>
            <option value="giuria">Giuria</option>
            <option value="host_dj">Host / DJ</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-nome">Nome</Label>
          <Input id="new-nome" aria-invalid={!!errors.nome} {...register("nome")} />
          {errors.nome && (
            <p className="text-destructive text-xs">{errors.nome.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-ruolo">Ruolo</Label>
          <Input id="new-ruolo" placeholder="Es. JUDGE" {...register("ruolo")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-immagine">Immagine</Label>
          <Select id="new-immagine" {...register("immagine_path")}>
            <option value="">Nessuna immagine</option>
            {imageFiles.map((path) => (
              <option key={path} value={path}>
                {path.split("/").pop()}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-colore">Colore (opzionale)</Label>
          <div className="flex items-center gap-2">
            <span
              className="border-input h-6 w-6 shrink-0 rounded-sm border"
              style={{ backgroundColor: colore || "transparent" }}
              aria-hidden
            />
            <Input
              id="new-colore"
              placeholder="#a855f7"
              aria-invalid={!!errors.colore}
              {...register("colore")}
            />
          </div>
          {errors.colore && (
            <p className="text-destructive text-xs">{errors.colore.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-ordine">Ordine</Label>
          <Input
            id="new-ordine"
            type="number"
            step="1"
            aria-invalid={!!errors.ordine}
            {...register("ordine")}
          />
          {errors.ordine && (
            <p className="text-destructive text-xs">{errors.ordine.message}</p>
          )}
        </div>
        <div className="flex items-center gap-2 self-end pb-1.5">
          <Switch
            id="new-attivo"
            checked={attivo}
            onCheckedChange={(value) => setValue("attivo", value)}
          />
          <Label htmlFor="new-attivo">Attivo</Label>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating ? <Loader2 className="animate-spin" /> : <Plus />}
            Aggiungi persona
          </Button>
        </div>
      </form>
    </div>
  )
}
