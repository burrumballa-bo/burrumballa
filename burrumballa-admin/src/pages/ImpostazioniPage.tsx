import { useEffect, useState, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ArrowLeft, Loader2, PenLine, Stamp, type LucideIcon } from "lucide-react"
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
import { seasonLabel, currentSeason } from "@/lib/seasons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024

const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
]

// Timbro e firma: anteprima del file salvato (signed URL) o di quello
// appena scelto, caricato solo al salvataggio del form.
function SettingsImageField({
  label,
  storedPath,
  file,
  onFileChange,
  placeholderIcon: PlaceholderIcon,
}: {
  label: string
  storedPath: string | null | undefined
  file: File | null
  onFileChange: (file: File) => void
  placeholderIcon: LucideIcon
}) {
  const signedUrlQuery = useTimbroSignedUrl(storedPath)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    event.target.value = ""
    if (!selected) return

    if (!selected.type.startsWith("image/")) {
      toast.error(`${label}: il file deve essere un'immagine.`)
      return
    }
    if (selected.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`${label}: l'immagine non può superare i 3 MB.`)
      return
    }
    onFileChange(selected)
  }

  const displayedUrl = preview ?? signedUrlQuery.data ?? null

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {displayedUrl ? (
        <img
          src={displayedUrl}
          alt={`Anteprima ${label.toLowerCase()}`}
          className="border-input h-32 w-32 rounded-md border object-contain p-2"
        />
      ) : (
        <div className="border-input text-muted-foreground flex h-32 w-32 items-center justify-center rounded-md border border-dashed">
          <PlaceholderIcon className="size-8" />
        </div>
      )}
      <Input type="file" accept="image/*" aria-label={`Carica ${label.toLowerCase()}`} onChange={handleChange} />
      {file && (
        <p className="text-muted-foreground text-sm">
          Nuovo file selezionato: {file.name} (verrà caricato al salvataggio)
        </p>
      )}
    </div>
  )
}

export default function ImpostazioniPage() {
  const navigate = useNavigate()
  const settingsQuery = useAppSettings()
  const updateSettings = useUpdateAppSettings()

  const [timbroFile, setTimbroFile] = useState<File | null>(null)
  const [firmaFile, setFirmaFile] = useState<File | null>(null)

  const settings = settingsQuery.data

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AppSettingsFormValues>({
    resolver: zodResolver(appSettingsSchema),
    values: settings
      ? {
          email_contatti: settings.email_contatti ?? "",
          email_mittente_generale: settings.email_mittente_generale ?? "",
          ricevuta_intestazione: settings.ricevuta_intestazione ?? "",
          ricevuta_indirizzo: settings.ricevuta_indirizzo ?? "",
          ricevuta_piva_cf: settings.ricevuta_piva_cf ?? "",
          ricevuta_iban: settings.ricevuta_iban ?? "",
          ricevuta_note: settings.ricevuta_note ?? "",
          presidente_nome: settings.presidente_nome ?? "",
          stagione_mese_inizio: String(settings.stagione_mese_inizio ?? 9),
          prezzo_tessera: settings.prezzo_tessera != null ? String(settings.prezzo_tessera) : "",
          prezzo_quota_iscrizione:
            settings.prezzo_quota_iscrizione != null ? String(settings.prezzo_quota_iscrizione) : "",
        }
      : emptyAppSettingsFormValues,
  })

  const onSubmit = (values: AppSettingsFormValues) => {
    updateSettings.mutate(
      { values, timbroFile, firmaFile },
      {
        onSuccess: () => {
          toast.success("Impostazioni salvate.")
          setTimbroFile(null)
          setFirmaFile(null)
        },
        onError: (error) => {
          toast.error("Salvataggio non riuscito.", {
            description: (error as Error).message,
          })
        },
      }
    )
  }

  const startMonth = Number(watch("stagione_mese_inizio")) || 9

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
            <CardTitle>Email</CardTitle>
            <CardDescription>
              Il mittente delle email dell&apos;evento si imposta in Evento →
              Modifica pagina evento; se lì è vuoto viene usato il mittente
              generale.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email_contatti">Email contatti</Label>
              <Input
                id="email_contatti"
                type="email"
                placeholder="info@burrumballa.it"
                aria-invalid={!!errors.email_contatti}
                {...register("email_contatti")}
              />
              <p className="text-muted-foreground text-xs">
                Riceve i messaggi del form contatti del sito ed è il contatto
                pubblico mostrato nell&apos;informativa privacy.
              </p>
              {errors.email_contatti && (
                <p className="text-destructive text-sm">{errors.email_contatti.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_mittente_generale">Mittente generale</Label>
              <Input
                id="email_mittente_generale"
                type="email"
                placeholder="segreteria@burrumballa.it"
                aria-invalid={!!errors.email_mittente_generale}
                {...register("email_mittente_generale")}
              />
              <p className="text-muted-foreground text-xs">
                Indirizzo da cui partono le ricevute della scuola e quelle
                create a mano. Deve essere una casella abilitata all&apos;invio
                sul server di posta.
              </p>
              {errors.email_mittente_generale && (
                <p className="text-destructive text-sm">
                  {errors.email_mittente_generale.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dati per la ricevuta</CardTitle>
            <CardDescription>
              Usati per generare le ricevute PDF. Intestazione e IBAN vengono
              mostrati anche a chi si iscrive all&apos;evento con pagamento
              tramite bonifico, nella pagina di conferma iscrizione.
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
              <p className="text-muted-foreground text-xs">
                Stampate in fondo a ogni ricevuta.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timbro e firma</CardTitle>
            <CardDescription>
              Immagini stampate in fondo alla ricevuta PDF, salvate nel bucket
              privato &quot;assets&quot;. Per la firma usa un PNG con sfondo
              trasparente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="presidente_nome">Nome del presidente</Label>
              <Input
                id="presidente_nome"
                placeholder="Mario Rossi"
                {...register("presidente_nome")}
              />
              <p className="text-muted-foreground text-xs">
                Compare sotto la firma come &quot;Il Presidente — nome&quot;.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <SettingsImageField
                label="Timbro"
                storedPath={settings?.timbro_url}
                file={timbroFile}
                onFileChange={setTimbroFile}
                placeholderIcon={Stamp}
              />
              <SettingsImageField
                label="Firma del presidente"
                storedPath={settings?.firma_url}
                file={firmaFile}
                onFileChange={setFirmaFile}
                placeholderIcon={PenLine}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scuola</CardTitle>
            <CardDescription>
              Tessere e quote di iscrizione valgono per una stagione. Gli
              importi qui sotto vengono proposti in automatico nella scheda
              iscritto e si possono sempre cambiare caso per caso.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="stagione_mese_inizio">Inizio stagione</Label>
              <Select id="stagione_mese_inizio" {...register("stagione_mese_inizio")}>
                {MONTHS.map((month, i) => (
                  <option key={month} value={String(i + 1)}>
                    {month}
                  </option>
                ))}
              </Select>
              <p className="text-muted-foreground text-xs">
                Stagione in corso: {seasonLabel(currentSeason(startMonth))}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prezzo_tessera">Prezzo tessera (€)</Label>
              <Input
                id="prezzo_tessera"
                type="number"
                min={0}
                step="0.01"
                aria-invalid={!!errors.prezzo_tessera}
                {...register("prezzo_tessera")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prezzo_quota_iscrizione">Quota di iscrizione (€)</Label>
              <Input
                id="prezzo_quota_iscrizione"
                type="number"
                min={0}
                step="0.01"
                aria-invalid={!!errors.prezzo_quota_iscrizione}
                {...register("prezzo_quota_iscrizione")}
              />
            </div>
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
