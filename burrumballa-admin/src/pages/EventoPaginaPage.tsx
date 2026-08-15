import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { useEventInfo, useUpdateEventInfo } from "@/hooks/useEventInfo"
import {
  useCreateEventOption,
  useDeleteEventOption,
  useEventOptionsStato,
  useUpdateEventOption,
} from "@/hooks/useEventOptionsStato"
import {
  useCreateEventPerson,
  useDeleteEventPerson,
  useEventPeople,
  useSentiComeSuonaImageFiles,
  useUpdateEventPerson,
} from "@/hooks/useEventPeople"
import {
  eventInfoSchema,
  emptyEventInfoFormValues,
  type EventInfoFormValues,
} from "@/lib/eventInfoSchema"
import { isoToDatetimeLocal, datetimeLocalToIso } from "@/lib/datetime"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EventOptionsSection } from "@/components/EventOptionsSection"
import { EventOptionModal } from "@/components/EventOptionModal"
import { EventInfoNoteField } from "@/components/EventInfoNoteField"
import { EventPeopleSection } from "@/components/EventPeopleSection"
import type {
  EventOptionInsertInput,
  EventOptionStato,
  EventOptionTipo,
  EventOptionUpdateInput,
} from "@/types/eventOption"
import type {
  EventPersonInsertInput,
  EventPersonUpdateInput,
} from "@/types/eventPerson"

type EventInfoNoteFieldKey = "nota_battle" | "nota_workshop" | "nota_pagamento"

type OptionModalState =
  | { mode: "create"; tipo: EventOptionTipo }
  | { mode: "edit"; option: EventOptionStato }
  | null

export default function EventoPaginaPage() {
  const navigate = useNavigate()
  const eventInfoQuery = useEventInfo()
  const updateEventInfo = useUpdateEventInfo()
  const optionsQuery = useEventOptionsStato()
  const createOption = useCreateEventOption()
  const updateOption = useUpdateEventOption()
  const deleteOption = useDeleteEventOption()
  const [optionModal, setOptionModal] = useState<OptionModalState>(null)
  const [deletingOptionId, setDeletingOptionId] = useState<string | null>(null)

  const peopleQuery = useEventPeople()
  const imageFilesQuery = useSentiComeSuonaImageFiles()
  const createPerson = useCreateEventPerson()
  const updatePerson = useUpdateEventPerson()
  const deletePerson = useDeleteEventPerson()
  const [savingPersonId, setSavingPersonId] = useState<string | null>(null)
  const [deletingPersonId, setDeletingPersonId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventInfoFormValues>({
    resolver: zodResolver(eventInfoSchema),
    values: eventInfoQuery.data
      ? {
          titolo: eventInfoQuery.data.titolo ?? "",
          data_evento: eventInfoQuery.data.data_evento ?? "",
          ora_inizio: eventInfoQuery.data.ora_inizio ?? "",
          ora_fine: eventInfoQuery.data.ora_fine ?? "",
          descrizione_iscrizione: eventInfoQuery.data.descrizione_iscrizione ?? "",
          descrizione: eventInfoQuery.data.descrizione ?? "",
          luogo: eventInfoQuery.data.luogo ?? "",
          testi_informativi: eventInfoQuery.data.testi_informativi ?? "",
          scadenza_iscrizioni: isoToDatetimeLocal(
            eventInfoQuery.data.scadenza_iscrizioni
          ),
        }
      : emptyEventInfoFormValues,
  })

  const onSubmitInfo = (values: EventInfoFormValues) => {
    const scadenzaIso = datetimeLocalToIso(values.scadenza_iscrizioni)
    if (!scadenzaIso) {
      toast.error("Scadenza iscrizioni non valida.")
      return
    }

    updateEventInfo.mutate(
      {
        titolo: values.titolo,
        data_evento: values.data_evento || null,
        ora_inizio: values.ora_inizio || null,
        ora_fine: values.ora_fine || null,
        descrizione_iscrizione: values.descrizione_iscrizione || null,
        descrizione: values.descrizione || null,
        luogo: values.luogo || null,
        testi_informativi: values.testi_informativi || null,
        scadenza_iscrizioni: scadenzaIso,
        // Non gestite in questo form: si salvano da sole nelle rispettive
        // sezioni (vedi handleSaveNoteField), qui si preservano invariate.
        nota_battle: eventInfoQuery.data?.nota_battle ?? null,
        nota_workshop: eventInfoQuery.data?.nota_workshop ?? null,
        nota_pagamento: eventInfoQuery.data?.nota_pagamento ?? null,
      },
      {
        onSuccess: () => toast.success("Info evento salvate."),
        onError: (error) =>
          toast.error("Salvataggio non riuscito.", {
            description: (error as Error).message,
          }),
      }
    )
  }

  const handleSaveNoteField = (field: EventInfoNoteFieldKey, value: string) => {
    if (!eventInfoQuery.data) return
    const { id, updated_at, ...rest } = eventInfoQuery.data
    updateEventInfo.mutate(
      { ...rest, [field]: value.trim() || null },
      {
        onSuccess: () => toast.success("Nota salvata."),
        onError: (error) =>
          toast.error("Salvataggio nota non riuscito.", {
            description: (error as Error).message,
          }),
      }
    )
  }

  const handleCreateOption = (input: EventOptionInsertInput) => {
    createOption.mutate(input, {
      onSuccess: () => {
        toast.success("Opzione creata.")
        setOptionModal(null)
      },
      onError: (error) =>
        toast.error("Creazione opzione non riuscita.", {
          description: (error as Error).message,
        }),
    })
  }

  const handleSaveOption = (input: EventOptionUpdateInput) => {
    updateOption.mutate(input, {
      onSuccess: () => {
        toast.success("Opzione salvata.")
        setOptionModal(null)
      },
      onError: (error) =>
        toast.error("Salvataggio opzione non riuscito.", {
          description: (error as Error).message,
        }),
    })
  }

  const handleDeleteOption = (id: string) => {
    setDeletingOptionId(id)
    deleteOption.mutate(id, {
      onSuccess: () => {
        toast.success("Opzione eliminata.")
        setOptionModal(null)
      },
      onError: (error) =>
        toast.error("Eliminazione opzione non riuscita.", {
          description: (error as Error).message,
        }),
      onSettled: () => setDeletingOptionId(null),
    })
  }

  const handleCreatePerson = (input: EventPersonInsertInput, onDone: () => void) => {
    createPerson.mutate(input, {
      onSuccess: () => {
        toast.success("Persona aggiunta.")
        onDone()
      },
      onError: (error) =>
        toast.error("Aggiunta non riuscita.", {
          description: (error as Error).message,
        }),
    })
  }

  const handleSavePerson = (input: EventPersonUpdateInput) => {
    setSavingPersonId(input.id)
    updatePerson.mutate(input, {
      onSuccess: () => toast.success("Persona salvata."),
      onError: (error) =>
        toast.error("Salvataggio non riuscito.", {
          description: (error as Error).message,
        }),
      onSettled: () => setSavingPersonId(null),
    })
  }

  const handleDeletePerson = (id: string) => {
    if (!window.confirm("Eliminare questa persona? L'operazione non è reversibile.")) {
      return
    }
    setDeletingPersonId(id)
    deletePerson.mutate(id, {
      onSuccess: () => toast.success("Persona eliminata."),
      onError: (error) =>
        toast.error("Eliminazione non riuscita.", {
          description: (error as Error).message,
        }),
      onSettled: () => setDeletingPersonId(null),
    })
  }

  const options = optionsQuery.data ?? []
  const workshopOptions = options.filter((o) => o.tipo === "workshop")
  const battleOptions = options.filter((o) => o.tipo === "battle")

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin/evento")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">Modifica pagina evento</h1>
      </div>

      {eventInfoQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento info evento...</p>
      ) : eventInfoQuery.isError ? (
        <p className="text-destructive text-sm">
          Errore nel caricamento dell&apos;info evento:{" "}
          {(eventInfoQuery.error as Error).message}
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmitInfo)}>
          <Card>
            <CardHeader>
              <CardTitle>Info evento</CardTitle>
              <CardDescription>
                Valori mostrati nella pagina pubblica dell&apos;evento e nel form di
                iscrizione.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titolo">Titolo</Label>
                <Input
                  id="titolo"
                  aria-invalid={!!errors.titolo}
                  {...register("titolo")}
                />
                {errors.titolo && (
                  <p className="text-destructive text-sm">{errors.titolo.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="data_evento">Data evento</Label>
                  <Input id="data_evento" type="date" {...register("data_evento")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ora_inizio">Orario inizio</Label>
                  <Input id="ora_inizio" type="time" {...register("ora_inizio")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ora_fine">Orario fine</Label>
                  <Input id="ora_fine" type="time" {...register("ora_fine")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scadenza_iscrizioni">Scadenza iscrizioni</Label>
                <Input
                  id="scadenza_iscrizioni"
                  type="datetime-local"
                  aria-invalid={!!errors.scadenza_iscrizioni}
                  {...register("scadenza_iscrizioni")}
                />
                {errors.scadenza_iscrizioni && (
                  <p className="text-destructive text-sm">
                    {errors.scadenza_iscrizioni.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descrizione_iscrizione">Descrizione iscrizione</Label>
                <Textarea
                  id="descrizione_iscrizione"
                  rows={2}
                  {...register("descrizione_iscrizione")}
                />
                <p className="text-muted-foreground text-xs">
                  Testo sotto il titolo &quot;Iscrizione&quot; nella pagina pubblica,
                  seguito automaticamente da data e orario evento.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descrizione">Descrizione</Label>
                <Textarea id="descrizione" rows={2} {...register("descrizione")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="luogo">Luogo</Label>
                <Input
                  id="luogo"
                  placeholder="Es. Circolo La Fattoria, Via Pirandello 6"
                  {...register("luogo")}
                />
                <p className="text-muted-foreground text-xs">
                  Mostrato nella pagina pubblica sotto la descrizione, con
                  icona a pin.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testi_informativi">Testi informativi</Label>
                <Textarea
                  id="testi_informativi"
                  rows={5}
                  placeholder="Regolamento, info pratiche, ecc."
                  {...register("testi_informativi")}
                />
              </div>

              <div className="border-t pt-4">
                <EventInfoNoteField
                  id="nota_pagamento"
                  label="Nota pagamento"
                  description="Testo mostrato nel form pubblico sotto il metodo di pagamento."
                  value={eventInfoQuery.data?.nota_pagamento ?? ""}
                  onSave={(value) => handleSaveNoteField("nota_pagamento", value)}
                  isSaving={updateEventInfo.isPending}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting || updateEventInfo.isPending}>
              {(isSubmitting || updateEventInfo.isPending) && (
                <Loader2 className="animate-spin" />
              )}
              Salva info evento
            </Button>
          </div>
        </form>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Opzioni form — Workshop</CardTitle>
            <CardDescription>
              Iscritti conteggiati a prescindere dallo stato di pagamento. Sold out
              automatico quando iscritti ≥ max posti, oppure forzato manualmente.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => optionsQuery.refetch()}
            disabled={optionsQuery.isFetching}
          >
            <RefreshCw className={optionsQuery.isFetching ? "animate-spin" : ""} />
            Aggiorna
          </Button>
        </CardHeader>
        <CardContent>
          {optionsQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Caricamento opzioni...</p>
          ) : optionsQuery.isError ? (
            <p className="text-destructive text-sm">
              Errore nel caricamento delle opzioni:{" "}
              {(optionsQuery.error as Error).message}
            </p>
          ) : (
            <EventOptionsSection
              tipo="workshop"
              options={workshopOptions}
              onEdit={(option) => setOptionModal({ mode: "edit", option })}
              onCreate={() => setOptionModal({ mode: "create", tipo: "workshop" })}
            />
          )}
          {eventInfoQuery.data && (
            <div className="mt-4 border-t pt-4">
              <EventInfoNoteField
                id="nota_workshop"
                label="Nota workshop"
                description="Testo mostrato nel form pubblico sotto la scelta del workshop."
                value={eventInfoQuery.data.nota_workshop ?? ""}
                onSave={(value) => handleSaveNoteField("nota_workshop", value)}
                isSaving={updateEventInfo.isPending}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opzioni form — Battle</CardTitle>
        </CardHeader>
        <CardContent>
          {optionsQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Caricamento opzioni...</p>
          ) : optionsQuery.isError ? null : (
            <EventOptionsSection
              tipo="battle"
              options={battleOptions}
              onEdit={(option) => setOptionModal({ mode: "edit", option })}
              onCreate={() => setOptionModal({ mode: "create", tipo: "battle" })}
            />
          )}
          {eventInfoQuery.data && (
            <div className="mt-4 border-t pt-4">
              <EventInfoNoteField
                id="nota_battle"
                label="Nota battle"
                description="Testo mostrato nel form pubblico sotto le categorie battle."
                value={eventInfoQuery.data.nota_battle ?? ""}
                onSave={(value) => handleSaveNoteField("nota_battle", value)}
                isSaving={updateEventInfo.isPending}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Giuria & Host / DJ</CardTitle>
          <CardDescription>
            Persone mostrate nella pagina pubblica dell&apos;evento.
            L&apos;immagine si sceglie tra i file già caricati su Storage
            (bucket &quot;assets&quot;, cartella &quot;senti_come_suona&quot;).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {peopleQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Caricamento...</p>
          ) : peopleQuery.isError ? (
            <p className="text-destructive text-sm">
              Errore nel caricamento: {(peopleQuery.error as Error).message}
            </p>
          ) : (
            <EventPeopleSection
              people={peopleQuery.data ?? []}
              imageFiles={imageFilesQuery.data ?? []}
              onCreate={handleCreatePerson}
              onSave={handleSavePerson}
              onDelete={handleDeletePerson}
              savingId={savingPersonId}
              deletingId={deletingPersonId}
              isCreating={createPerson.isPending}
            />
          )}
        </CardContent>
      </Card>

      {optionModal && (
        <EventOptionModal
          mode={optionModal.mode}
          tipo={optionModal.mode === "create" ? optionModal.tipo : optionModal.option.tipo}
          option={optionModal.mode === "edit" ? optionModal.option : undefined}
          siblingWorkshops={workshopOptions}
          onClose={() => setOptionModal(null)}
          onCreate={handleCreateOption}
          onSave={handleSaveOption}
          onDelete={handleDeleteOption}
          isSaving={createOption.isPending || updateOption.isPending}
          isDeleting={
            deleteOption.isPending &&
            optionModal.mode === "edit" &&
            deletingOptionId === optionModal.option.id
          }
        />
      )}
    </div>
  )
}
