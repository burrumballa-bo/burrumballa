import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { useEventInfo, useUpdateEventInfo } from "@/hooks/useEventInfo"
import {
  useEventOptionsStato,
  useUpdateEventOption,
} from "@/hooks/useEventOptionsStato"
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
import type { EventOptionUpdateInput } from "@/types/eventOption"

export default function EventoPage() {
  const navigate = useNavigate()
  const eventInfoQuery = useEventInfo()
  const updateEventInfo = useUpdateEventInfo()
  const optionsQuery = useEventOptionsStato()
  const updateOption = useUpdateEventOption()
  const [savingOptionId, setSavingOptionId] = useState<string | null>(null)

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
          descrizione: eventInfoQuery.data.descrizione ?? "",
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
        descrizione: values.descrizione || null,
        testi_informativi: values.testi_informativi || null,
        scadenza_iscrizioni: scadenzaIso,
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

  const handleSaveOption = (input: EventOptionUpdateInput) => {
    setSavingOptionId(input.id)
    updateOption.mutate(input, {
      onSuccess: () => toast.success("Opzione salvata."),
      onError: (error) =>
        toast.error("Salvataggio opzione non riuscito.", {
          description: (error as Error).message,
        }),
      onSettled: () => setSavingOptionId(null),
    })
  }

  const options = optionsQuery.data ?? []
  const workshopOptions = options.filter((o) => o.tipo === "workshop")
  const battleOptions = options.filter((o) => o.tipo === "battle")

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">Evento: Senti Come Suona</h1>
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
                  <Label htmlFor="data_evento">Data evento</Label>
                  <Input id="data_evento" type="date" {...register("data_evento")} />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="descrizione">Descrizione</Label>
                <Textarea id="descrizione" rows={2} {...register("descrizione")} />
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
              options={workshopOptions}
              onSave={handleSaveOption}
              savingId={savingOptionId}
            />
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
              options={battleOptions}
              onSave={handleSaveOption}
              savingId={savingOptionId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
