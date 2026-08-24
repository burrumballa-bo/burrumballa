import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ArrowLeft, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAssetSignedUrl } from "@/hooks/useAssetSignedUrl"
import { useSitePage, useUpdateSitePage } from "@/hooks/useSitePage"
import { DEFAULT_THEME_CONTENT } from "@/lib/cms/defaults"
import {
  themeGeneralSettingsSchema,
  type ThemeGeneralSettingsFormValues,
} from "@/lib/cms/schemas"
import { cn } from "@/lib/utils"
import type { HeaderLogoVariant } from "@/types/cms"

const LOGO_OPTIONS: { variant: HeaderLogoVariant; path: string; label: string }[] = [
  { variant: "black", path: "logo_black.png", label: "Logo nero" },
  { variant: "white", path: "logo_white.png", label: "Logo bianco" },
]

function LogoOption({
  variant,
  path,
  label,
  selected,
  onSelect,
}: {
  variant: HeaderLogoVariant
  path: string
  label: string
  selected: boolean
  onSelect: (variant: HeaderLogoVariant) => void
}) {
  const signedUrl = useAssetSignedUrl(path)

  return (
    <button
      type="button"
      onClick={() => onSelect(variant)}
      className={cn(
        "relative flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-colors",
        selected ? "border-primary" : "border-input hover:border-muted-foreground/50"
      )}
    >
      {selected && (
        <span className="bg-primary text-primary-foreground absolute top-2 right-2 flex size-5 items-center justify-center rounded-full">
          <Check className="size-3" />
        </span>
      )}
      <div
        className={cn(
          "flex h-24 w-full items-center justify-center rounded-md",
          variant === "white" ? "bg-neutral-800" : "bg-neutral-100"
        )}
      >
        {signedUrl.isLoading ? (
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        ) : signedUrl.data ? (
          <img src={signedUrl.data} alt={label} className="max-h-16 max-w-[80%] object-contain" />
        ) : (
          <p className="text-muted-foreground px-2 text-center text-xs">
            Non trovato in Storage ({path})
          </p>
        )}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

export default function ContenutiImpostazioniGeneraliPage() {
  const navigate = useNavigate()
  const pageQuery = useSitePage("theme", DEFAULT_THEME_CONTENT)
  const updatePage = useUpdateSitePage("theme")

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<ThemeGeneralSettingsFormValues>({
    resolver: zodResolver(themeGeneralSettingsSchema),
    values: pageQuery.data
      ? { mode: pageQuery.data.mode, headerLogo: pageQuery.data.headerLogo }
      : undefined,
  })

  const mode = watch("mode")
  const headerLogo = watch("headerLogo")

  const onSubmit = (values: ThemeGeneralSettingsFormValues) => {
    if (!pageQuery.data) return
    updatePage.mutate(
      { ...pageQuery.data, mode: values.mode, headerLogo: values.headerLogo },
      {
        onSuccess: () => toast.success("Impostazioni salvate."),
        onError: (error) =>
          toast.error("Salvataggio non riuscito.", { description: (error as Error).message }),
      }
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">Impostazioni generali</h1>
      </div>

      {pageQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento...</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tema del sito</CardTitle>
              <CardDescription>
                Il sito pubblico usa sempre lo stesso tema per tutti i visitatori: non c&apos;è un
                pulsante per cambiarlo, la scelta è unica e fissa da qui. I colori del tema scuro
                si personalizzano nella sezione Tema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Usa il tema scuro</Label>
                  <p className="text-muted-foreground text-xs">
                    Disattivato: il sito è in tema chiaro. Attivato: il sito è in tema scuro.
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={mode === "dark"}
                  onCheckedChange={(value) =>
                    setValue("mode", value ? "dark" : "light", { shouldDirty: true })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo nell&apos;header</CardTitle>
              <CardDescription>
                Scegli quale versione del logo mostrare nell&apos;header del sito. I due file
                (logo_black.png e logo_white.png) sono caricati su Supabase Storage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {LOGO_OPTIONS.map((option) => (
                  <LogoOption
                    key={option.variant}
                    variant={option.variant}
                    path={option.path}
                    label={option.label}
                    selected={headerLogo === option.variant}
                    onSelect={(variant) => setValue("headerLogo", variant, { shouldDirty: true })}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || updatePage.isPending}>
              {(isSubmitting || updatePage.isPending) && <Loader2 className="animate-spin" />}
              Salva impostazioni
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
