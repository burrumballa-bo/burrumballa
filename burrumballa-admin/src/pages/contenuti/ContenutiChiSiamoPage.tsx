import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MediaUploadField } from "@/components/MediaUploadField"
import { CrewGroupsSection } from "@/components/CrewGroupsSection"
import { useSitePage, useUpdateSitePage } from "@/hooks/useSitePage"
import { DEFAULT_CHI_SIAMO_CONTENT } from "@/lib/cms/defaults"
import { chiSiamoContentSchema, type ChiSiamoContentFormValues } from "@/lib/cms/schemas"

export default function ContenutiChiSiamoPage() {
  const navigate = useNavigate()
  const pageQuery = useSitePage("chi-siamo", DEFAULT_CHI_SIAMO_CONTENT)
  const updatePage = useUpdateSitePage("chi-siamo")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ChiSiamoContentFormValues>({
    resolver: zodResolver(chiSiamoContentSchema),
    values: pageQuery.data,
  })

  const onSubmit = (values: ChiSiamoContentFormValues) => {
    updatePage.mutate(values, {
      onSuccess: () => toast.success("Chi siamo salvata."),
      onError: (error) =>
        toast.error("Salvataggio non riuscito.", { description: (error as Error).message }),
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">Contenuti — Chi siamo</h1>
      </div>

      {pageQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento...</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero (manifesto)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Kicker</Label>
                <Input {...register("hero.kicker")} />
              </div>
              <div className="space-y-1.5">
                <Label>Titolo</Label>
                <Textarea rows={2} aria-invalid={!!errors.hero?.title} {...register("hero.title")} />
              </div>
              <div className="space-y-1.5">
                <Label>Sottotitolo</Label>
                <Textarea rows={3} {...register("hero.subtitle")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Titolo</Label>
                <Input aria-invalid={!!errors.story?.title} {...register("story.title")} />
              </div>
              <div className="space-y-1.5">
                <Label>Paragrafo 1</Label>
                <Textarea rows={3} {...register("story.paragraph1")} />
              </div>
              <div className="space-y-1.5">
                <Label>Paragrafo 2</Label>
                <Textarea rows={3} {...register("story.paragraph2")} />
              </div>
              <MediaUploadField
                label="Immagine"
                value={watch("story.imageUrl")}
                onChange={(url) => setValue("story.imageUrl", url, { shouldDirty: true })}
                folder="pages/chi-siamo"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>I nostri valori</CardTitle>
              <CardDescription>Le 4 card numerate 01–04.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Kicker</Label>
                  <Input {...register("valori.kicker")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Titolo sezione</Label>
                  <Input aria-invalid={!!errors.valori?.title} {...register("valori.title")} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="space-y-2 rounded-md border p-3">
                    <Label>Valore {index + 1}</Label>
                    <Input
                      placeholder="Titolo (es. CULTURA)"
                      aria-invalid={!!errors.valori?.items?.[index]?.title}
                      {...register(`valori.items.${index}.title` as const)}
                    />
                    <Textarea rows={2} placeholder="Descrizione" {...register(`valori.items.${index}.body` as const)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>La crew</CardTitle>
              <CardDescription>Testi sopra le card (le card si gestiscono qui sotto).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Kicker</Label>
                  <Input {...register("crew.kicker")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Titolo</Label>
                  <Input aria-invalid={!!errors.crew?.title} {...register("crew.title")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Sottotitolo</Label>
                <Textarea rows={2} {...register("crew.subtitle")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Corsi kids</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Kicker</Label>
                <Input {...register("kids.kicker")} />
              </div>
              <div className="space-y-1.5">
                <Label>Titolo</Label>
                <Input aria-invalid={!!errors.kids?.title} {...register("kids.title")} />
              </div>
              <div className="space-y-1.5">
                <Label>Testo</Label>
                <Textarea rows={2} {...register("kids.body")} />
              </div>
              <MediaUploadField
                label="Immagine"
                value={watch("kids.imageUrl")}
                onChange={(url) => setValue("kids.imageUrl", url, { shouldDirty: true })}
                folder="pages/chi-siamo"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>La nostra sede</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Titolo</Label>
                <Input aria-invalid={!!errors.place?.title} {...register("place.title")} />
              </div>
              <div className="space-y-1.5">
                <Label>Testo</Label>
                <Textarea rows={2} {...register("place.body")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Nome del luogo</Label>
                  <Input aria-invalid={!!errors.place?.locationName} {...register("place.locationName")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Indirizzo — riga 1</Label>
                  <Input {...register("place.addressLine1")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Indirizzo — riga 2</Label>
                  <Input {...register("place.addressLine2")} />
                </div>
              </div>
              <MediaUploadField
                label="Immagine"
                value={watch("place.imageUrl")}
                onChange={(url) => setValue("place.imageUrl", url, { shouldDirty: true })}
                folder="pages/chi-siamo"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Banda finale (call to action)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Titolo</Label>
                <Input aria-invalid={!!errors.ctaBand?.title} {...register("ctaBand.title")} />
              </div>
              <div className="space-y-1.5">
                <Label>Sottotitolo</Label>
                <Textarea rows={2} {...register("ctaBand.subtitle")} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || updatePage.isPending}>
              {(isSubmitting || updatePage.isPending) && <Loader2 className="animate-spin" />}
              Salva testi Chi siamo
            </Button>
          </div>
        </form>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Card della crew</CardTitle>
        </CardHeader>
        <CardContent>
          <CrewGroupsSection />
        </CardContent>
      </Card>
    </div>
  )
}
