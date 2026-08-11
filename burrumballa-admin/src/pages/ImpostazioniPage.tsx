import { useEffect, useState, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ArrowLeft, Loader2, Stamp } from "lucide-react"
import { toast } from "sonner"

import {
  useAppSettings,
  useTimbroSignedUrl,
  useUpdateAppSettings,
} from "@/hooks/useAppSettings"
import {
  appSettingsSchema,
  emptyAppSettingsFormValues,
  type AppSettingsFormValues,
} from "@/lib/appSettingsSchema"
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

const MAX_TIMBRO_SIZE_BYTES = 3 * 1024 * 1024

export default function ImpostazioniPage() {
  const navigate = useNavigate()
  const settingsQuery = useAppSettings()
  const updateSettings = useUpdateAppSettings()
  const timbroSignedUrlQuery = useTimbroSignedUrl(settingsQuery.data?.timbro_url)

  const [timbroFile, setTimbroFile] = useState<File | null>(null)
  const [timbroPreview, setTimbroPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AppSettingsFormValues>({
    resolver: zodResolver(appSettingsSchema),
    values: settingsQuery.data
      ? {
          email_mittente: settingsQuery.data.email_mittente ?? "",
          ricevuta_intestazione: settingsQuery.data.ricevuta_intestazione ?? "",
          ricevuta_indirizzo: settingsQuery.data.ricevuta_indirizzo ?? "",
          ricevuta_piva_cf: settingsQuery.data.ricevuta_piva_cf ?? "",
          ricevuta_iban: settingsQuery.data.ricevuta_iban ?? "",
          ricevuta_note: settingsQuery.data.ricevuta_note ?? "",
        }
      : emptyAppSettingsFormValues,
  })

  useEffect(() => {
    if (!timbroFile) {
      setTimbroPreview(null)
      return
    }
    const url = URL.createObjectURL(timbroFile)
    setTimbroPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [timbroFile])

  const handleTimbroChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Il timbro deve essere un'immagine.")
      return
    }
    if (file.size > MAX_TIMBRO_SIZE_BYTES) {
      toast.error("L'immagine del timbro non può superare i 3 MB.")
      return
    }
    setTimbroFile(file)
  }

  const onSubmit = (values: AppSettingsFormValues) => {
    updateSettings.mutate(
      { values, timbroFile },
      {
        onSuccess: () => {
          toast.success("Impostazioni salvate.")
          setTimbroFile(null)
        },
        onError: (error) => {
          toast.error("Salvataggio non riuscito.", {
            description: (error as Error).message,
          })
        },
      }
    )
  }

  const displayedTimbroUrl = timbroPreview ?? timbroSignedUrlQuery.data ?? null

  if (settingsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <p className="text-muted-foreground text-sm">Caricamento impostazioni...</p>
      </div>
    )
  }

  if (settingsQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <p className="text-destructive text-sm">
          Errore nel caricamento delle impostazioni:{" "}
          {(settingsQuery.error as Error).message}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">Impostazioni</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Email mittente</CardTitle>
            <CardDescription>
              Indirizzo usato come mittente delle email e per il recupero password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="email_mittente">Email mittente</Label>
            <Input
              id="email_mittente"
              type="email"
              placeholder="info@burrumballa.it"
              aria-invalid={!!errors.email_mittente}
              {...register("email_mittente")}
            />
            {errors.email_mittente && (
              <p className="text-destructive text-sm">
                {errors.email_mittente.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dati per la ricevuta</CardTitle>
            <CardDescription>
              Usati dalle Edge Functions per generare la ricevuta PDF.
              Intestazione e IBAN vengono mostrati anche a chi si iscrive con
              pagamento tramite bonifico, nella pagina di conferma
              iscrizione.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ricevuta_intestazione">
                Intestazione (nome associazione)
              </Label>
              <Input
                id="ricevuta_intestazione"
                aria-invalid={!!errors.ricevuta_intestazione}
                {...register("ricevuta_intestazione")}
              />
              {errors.ricevuta_intestazione && (
                <p className="text-destructive text-sm">
                  {errors.ricevuta_intestazione.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ricevuta_indirizzo">Indirizzo</Label>
              <Input id="ricevuta_indirizzo" {...register("ricevuta_indirizzo")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ricevuta_piva_cf">P.IVA / C.F.</Label>
              <Input id="ricevuta_piva_cf" {...register("ricevuta_piva_cf")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ricevuta_iban">IBAN</Label>
              <Input
                id="ricevuta_iban"
                aria-invalid={!!errors.ricevuta_iban}
                {...register("ricevuta_iban")}
              />
              {errors.ricevuta_iban && (
                <p className="text-destructive text-sm">
                  {errors.ricevuta_iban.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ricevuta_note">Note</Label>
              <Textarea id="ricevuta_note" rows={3} {...register("ricevuta_note")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timbro</CardTitle>
            <CardDescription>
              Immagine del timbro usata nella ricevuta PDF, caricata nel bucket privato
              "assets".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayedTimbroUrl ? (
              <img
                src={displayedTimbroUrl}
                alt="Anteprima timbro"
                className="border-input h-32 w-32 rounded-md border object-contain p-2"
              />
            ) : (
              <div className="border-input text-muted-foreground flex h-32 w-32 items-center justify-center rounded-md border border-dashed">
                <Stamp className="size-8" />
              </div>
            )}
            <Input type="file" accept="image/*" onChange={handleTimbroChange} />
            {timbroFile && (
              <p className="text-muted-foreground text-sm">
                Nuovo file selezionato: {timbroFile.name} (verrà caricato al
                salvataggio)
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || updateSettings.isPending}>
            {(isSubmitting || updateSettings.isPending) && (
              <Loader2 className="animate-spin" />
            )}
            Salva impostazioni
          </Button>
        </div>
      </form>
    </div>
  )
}
