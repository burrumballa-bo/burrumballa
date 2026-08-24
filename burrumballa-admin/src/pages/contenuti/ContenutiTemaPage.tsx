import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSitePage, useUpdateSitePage } from "@/hooks/useSitePage"
import { DEFAULT_THEME_CONTENT } from "@/lib/cms/defaults"
import { themeColorsSchema, type ThemeColorsFormValues } from "@/lib/cms/schemas"

const COLOR_FIELDS = [
  { key: "background", label: "Sfondo", description: "Colore di fondo delle pagine in tema scuro." },
  { key: "text", label: "Testo", description: "Colore del testo e dei bordi su sfondo scuro." },
  { key: "purple", label: "Viola", description: "Accento — corsi, kicker, dettagli." },
  { key: "pink", label: "Rosa", description: "Accento — corsi, kicker, dettagli." },
  { key: "green", label: "Verde", description: "Accento — badge, corsi, dettagli." },
  { key: "orange", label: "Arancio", description: "Accento — corsi, dettagli." },
] as const

export default function ContenutiTemaPage() {
  const navigate = useNavigate()
  const pageQuery = useSitePage("theme", DEFAULT_THEME_CONTENT)
  const updatePage = useUpdateSitePage("theme")

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ThemeColorsFormValues>({
    resolver: zodResolver(themeColorsSchema),
    values: pageQuery.data ? { dark: pageQuery.data.dark } : undefined,
  })

  const onSubmit = (values: ThemeColorsFormValues) => {
    if (!pageQuery.data) return
    updatePage.mutate(
      { ...pageQuery.data, dark: values.dark },
      {
        onSuccess: () => toast.success("Tema salvato."),
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
        <h1 className="text-2xl font-semibold">Contenuti — Tema</h1>
      </div>

      {pageQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento...</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Colori del tema scuro</CardTitle>
              <CardDescription>
                Solo il tema scuro è personalizzabile da qui; i colori del tema chiaro restano
                quelli del brand. Usa colori esadecimali (es. #121014). Per scegliere se il sito
                deve usare il tema chiaro o quello scuro, vai su Impostazioni generali.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {COLOR_FIELDS.map((field) => {
                const value = watch(`dark.${field.key}`)
                const fieldErrors = errors.dark?.[field.key]
                return (
                  <div key={field.key} className="space-y-1.5">
                    <Label htmlFor={`theme-${field.key}`}>{field.label}</Label>
                    <div className="flex items-center gap-2">
                      <span
                        className="border-input h-9 w-9 shrink-0 rounded-md border"
                        style={{ backgroundColor: value || "transparent" }}
                        aria-hidden
                      />
                      <Input
                        id={`theme-${field.key}`}
                        aria-invalid={!!fieldErrors}
                        {...register(`dark.${field.key}`)}
                      />
                    </div>
                    <p className="text-muted-foreground text-xs">{field.description}</p>
                    {fieldErrors && (
                      <p className="text-destructive text-xs">{fieldErrors.message}</p>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || updatePage.isPending}>
              {(isSubmitting || updatePage.isPending) && <Loader2 className="animate-spin" />}
              Salva Tema
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
