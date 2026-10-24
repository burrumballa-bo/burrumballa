import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ArrowLeft, ExternalLink, Loader2, RefreshCw, Upload } from "lucide-react"
import { toast } from "sonner"

import { useConfirm } from "@/hooks/useConfirm"
import { useEventId } from "@/hooks/useEventId"
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
  useEventImageFiles,
  useEventPeople,
  useUpdateEventPerson,
  useUploadEventImage,
} from "@/hooks/useEventPeople"
import {
  eventInfoSchema,
  emptyEventInfoFormValues,
  type EventInfoFormValues,
} from "@/lib/eventInfoSchema"
import { isoToDatetimeLocal, datetimeLocalToIso } from "@/lib/datetime"
import { PUBLIC_SITE_URL } from "@/lib/site"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { EventImageField } from "@/components/EventImageField"
import { EventPricingCard } from "@/components/EventPricingCard"
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
import type { EventInfoPatch } from "@/types/eventInfo"

type EventInfoNoteFieldKey = "nota_battle" | "nota_workshop" | "nota_pagamento"

type OptionModalState =
  | { mode: "create"; tipo: EventOptionTipo }
  | { mode: "edit"; option: EventOptionStato }
  | null

export default function EventoPaginaPage() {
  const navigate = useNavigate()
  const eventId = useEventId()
  const eventInfoQuery = useEventInfo(eventId)
  const updateEventInfo = useUpdateEventInfo(eventId)
  const optionsQuery = useEventOptionsStato(eventId)
  const createOption = useCreateEventOption()
  const updateOption = useUpdateEventOption()
  const deleteOption = useDeleteEventOption()
  const confirm = useConfirm()
  const [optionModal, setOptionModal] = useState<OptionModalState>(null)
  const [deletingOptionId, setDeletingOptionId] = useState<string | null>(null)

  const peopleQuery = useEventPeople(eventId)
  const imageFilesQuery = useEventImageFiles(eventId)
  const uploadImage = useUploadEventImage(eventId)
  const createPerson = useCreateEventPerson()
  const updatePerson = useUpdateEventPerson()
  const deletePerson = useDeleteEventPerson()
  const [savingPersonId, setSavingPersonId] = useState<string | null>(null)
  const [deletingPersonId, setDeletingPersonId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventInfoFormValues>({
    resolver: zodResolver(eventInfoSchema),
    values: eventInfoQuery.data
      ? {
          titolo: eventInfoQuery.data.titolo ?? "",
          slug: eventInfoQuery.data.slug ?? "",
          citta: eventInfoQuery.data.citta ?? "",
          colore_primario: eventInfoQuery.data.colore_primario ?? "#f5d90a",
          colore_secondario: eventInfoQuery.data.colore_secondario ?? "#a855f7",
          data_evento: eventInfoQuery.data.data_evento ?? "",
          ora_inizio: eventInfoQuery.data.ora_inizio ?? "",
          ora_fine: eventInfoQuery.data.ora_fine ?? "",
          descrizione_iscrizione: eventInfoQuery.data.descrizione_iscrizione ?? "",
          descrizione: eventInfoQuery.data.descrizione ?? "",
          luogo: eventInfoQuery.data.luogo ?? "",
          testi_informativi: eventInfoQuery.data.testi_informativi ?? "",
          email_mittente: eventInfoQuery.data.email_mittente ?? "",
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
        slug: values.slug,
        citta: values.citta || null,
        colore_primario: values.colore_primario.toLowerCase(),
        colore_secondario: values.colore_secondario.toLowerCase(),
        data_evento: values.data_evento || null,
        ora_inizio: values.ora_inizio || null,
        ora_fine: values.ora_fine || null,
        descrizione_iscrizione: values.descrizione_iscrizione || null,
        descrizione: values.descrizione || null,
        luogo: values.luogo || null,
        testi_informativi: values.testi_informativi || null,
        email_mittente: values.email_mittente || null,
        scadenza_iscrizioni: scadenzaIso,
      },
      {
        onSuccess: () => toast.success("Info evento salvate."),
        onError: (error) =>
          toast.error("Salvataggio non riuscito.", {
            description: (error as Error).message.includes("event_info_slug_key")
              ? "Questo indirizzo è già usato da un altro evento."
              : (error as Error).message,
          }),
      }
    )
  }

  // Salvataggi immediati (interruttori, immagini, prezzi): solo i campi toccati.
  const savePatch = (patch: EventInfoPatch, successMessage: string) =>
    updateEventInfo.mutate(patch, {
      onSuccess: () => toast.success(successMessage),
      onError: (error) =>
        toast.error("Salvataggio non riuscito.", { description: (error as Error).message }),
    })

  const handleSaveNoteField = (field: EventInfoNoteFieldKey, value: string) =>
    savePatch({ [field]: value.trim() || null }, "Nota salvata.")

  const handleToggleBonifico = (value: boolean) =>
    savePatch(
      { bonifico_attivo: value },
      value
        ? "Pagamento con bonifico attivato."
        : "Pagamento con bonifico disattivato: si pagherà di persona."
    )

  const handleCreateOption = (input: Omit<EventOptionInsertInput, "event_id">) => {
    createOption.mutate({ ...input, event_id: eventId }, {
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
    createPerson.mutate({ ...input, event_id: eventId }, {
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

  const handleDeletePerson = async (id: string) => {
    const ok = await confirm({
      title: "Eliminare questa persona?",
      description: "L'operazione non è reversibile.",
    })
    if (!ok) return
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
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`/admin/eventi/${eventId}`)}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">
          Modifica evento{eventInfoQuery.data ? ` — ${eventInfoQuery.data.titolo}` : ""}
        </h1>
        {eventInfoQuery.data && (
          <Button variant="outline" size="sm" className="ml-auto" asChild>
            <a href={`${PUBLIC_SITE_URL}/eventi/${eventInfoQuery.data.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink />
              Apri pagina pubblica
            </a>
          </Button>
        )}
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="slug">Indirizzo della pagina</Label>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-muted-foreground shrink-0">/eventi/</span>
                    <Input id="slug" aria-invalid={!!errors.slug} {...register("slug")} />
                  </div>
                  {errors.slug ? (
                    <p className="text-destructive text-sm">{errors.slug.message}</p>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      Cambiandolo, i link già condivisi smettono di funzionare.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="citta">Città</Label>
                  <Input id="citta" placeholder="Bologna · Italy" {...register("citta")} />
                  <p className="text-muted-foreground text-xs">Sotto la data, sulla foto di copertina.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["colore_primario", "Colore principale", "Pulsanti, prezzi, bordi."],
                    ["colore_secondario", "Colore secondario", "Linee, titoletti, ruoli."],
                  ] as const
                ).map(([name, label, hint]) => (
                  <div key={name} className="space-y-2">
                    <Label htmlFor={name}>{label}</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label={`${label} (selettore)`}
                        className="border-input h-9 w-12 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
                        value={watch(name)}
                        onChange={(e) => setValue(name, e.target.value, { shouldDirty: true })}
                      />
                      <Input id={name} className="font-mono" aria-invalid={!!errors[name]} {...register(name)} />
                    </div>
                    <p className="text-muted-foreground text-xs">{hint}</p>
                  </div>
                ))}
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

              <div className="space-y-2">
                <Label htmlFor="email_mittente">Email mittente</Label>
                <Input
                  id="email_mittente"
                  type="email"
                  placeholder="senticomesuona@burrumballa.it"
                  aria-invalid={!!errors.email_mittente}
                  {...register("email_mittente")}
                />
                {errors.email_mittente ? (
                  <p className="text-destructive text-sm">
                    {errors.email_mittente.message}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Indirizzo da cui partono le email dell&apos;evento (conferma
                    iscrizione e ricevuta di pagamento) e a cui arrivano le
                    risposte degli iscritti. Se vuoto viene usato il mittente
                    generale impostato in Impostazioni.
                  </p>
                )}
              </div>

              <div className="flex items-start justify-between gap-4 border-t pt-4">
                <div className="space-y-1">
                  <Label htmlFor="bonifico_attivo">Pagamento con bonifico</Label>
                  <p className="text-muted-foreground text-xs">
                    Se disattivato ci si può comunque iscrivere all&apos;evento, ma il
                    bonifico non viene proposto: il pagamento avverrà di persona.
                    Salvato subito.
                  </p>
                </div>
                <Switch
                  id="bonifico_attivo"
                  checked={eventInfoQuery.data?.bonifico_attivo ?? true}
                  onCheckedChange={handleToggleBonifico}
                  disabled={updateEventInfo.isPending}
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

      {eventInfoQuery.data && (
        <Card>
          <CardHeader>
            <CardTitle>Pubblicazione e immagini</CardTitle>
            <CardDescription>Salvati subito. Le immagini stanno nella cartella dell&apos;evento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start justify-between gap-4 rounded-md border p-3">
                <div className="space-y-1">
                  <Label htmlFor="pubblicato">Visibile sul sito</Label>
                  <p className="text-muted-foreground text-xs">
                    Spento, la pagina pubblica risponde &quot;non trovata&quot;.
                  </p>
                </div>
                <Switch
                  id="pubblicato"
                  checked={eventInfoQuery.data.pubblicato}
                  disabled={updateEventInfo.isPending}
                  onCheckedChange={(value) =>
                    savePatch({ pubblicato: value }, value ? "Evento pubblicato." : "Evento tolto dal sito.")
                  }
                />
              </div>
              <div className="flex items-start justify-between gap-4 rounded-md border p-3">
                <div className="space-y-1">
                  <Label htmlFor="iscrizioni_aperte">Iscrizioni aperte</Label>
                  <p className="text-muted-foreground text-xs">
                    Spento, la pagina resta visibile ma il form non c&apos;è più.
                  </p>
                </div>
                <Switch
                  id="iscrizioni_aperte"
                  checked={eventInfoQuery.data.iscrizioni_aperte}
                  disabled={updateEventInfo.isPending}
                  onCheckedChange={(value) =>
                    savePatch({ iscrizioni_aperte: value }, value ? "Iscrizioni aperte." : "Iscrizioni chiuse.")
                  }
                />
              </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {(
                [
                  ["immagine_copertina", "Copertina", "Foto grande dell'hero."],
                  ["immagine_cornice", "Cornice", "Texture delle fasce sopra e sotto la copertina."],
                  ["immagine_logo", "Logo", "PNG trasparente, a destra sulla copertina."],
                ] as const
              ).map(([field, label, hint]) => (
                <EventImageField
                  key={field}
                  eventId={eventId}
                  label={label}
                  hint={hint}
                  value={eventInfoQuery.data[field]}
                  files={imageFilesQuery.data ?? []}
                  disabled={updateEventInfo.isPending}
                  onChange={(path) => savePatch({ [field]: path }, "Immagine salvata.")}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {eventInfoQuery.data && (
        <EventPricingCard
          key={eventInfoQuery.data.updated_at}
          event={eventInfoQuery.data}
          isSaving={updateEventInfo.isPending}
          onSave={(patch) => savePatch(patch, "Prezzi salvati.")}
        />
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
            L&apos;immagine si sceglie tra i file dell&apos;evento: caricali qui.
          </CardDescription>
          <label className="border-input hover:bg-accent mt-2 inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors">
            {uploadImage.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            Carica immagine
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={uploadImage.isPending}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ""
                if (!file) return
                uploadImage.mutate(file, {
                  onSuccess: () => toast.success("Immagine caricata: ora la trovi nei selettori."),
                  onError: (error) =>
                    toast.error("Caricamento non riuscito.", { description: (error as Error).message }),
                })
              }}
            />
          </label>
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
