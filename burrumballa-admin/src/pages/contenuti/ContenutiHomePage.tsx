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
import { useSitePage, useUpdateSitePage } from "@/hooks/useSitePage"
import { DEFAULT_HOME_CONTENT } from "@/lib/cms/defaults"
import { homeContentSchema, type HomeContentFormValues } from "@/lib/cms/schemas"

export default function ContenutiHomePage() {
  const navigate = useNavigate()
  const pageQuery = useSitePage("home", DEFAULT_HOME_CONTENT)
  const updatePage = useUpdateSitePage("home")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<HomeContentFormValues>({
    resolver: zodResolver(homeContentSchema),
    values: pageQuery.data,
  })

  const onSubmit = (values: HomeContentFormValues) => {
    updatePage.mutate(values, {
      onSuccess: () => toast.success("Home salvata."),
      onError: (error) =>
        toast.error("Salvataggio non riuscito.", { description: (error as Error).message }),
    })
  }

  if (pageQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <p className="text-muted-foreground text-sm">Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin/contenuti")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">Contenuti — Home</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hero</CardTitle>
            <CardDescription>Il primo blocco della home, con titolo e immagine principali.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="hero-kicker">Kicker</Label>
              <Input id="hero-kicker" {...register("hero.kicker")} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="hero-l1">Titolo — riga 1</Label>
                <Input id="hero-l1" {...register("hero.titleLine1")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hero-l2">Titolo — riga 2</Label>
                <Input id="hero-l2" {...register("hero.titleLine2")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hero-l3">Titolo — riga 3 (contornata)</Label>
                <Input id="hero-l3" {...register("hero.titleLine3")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hero-subtitle">Sottotitolo</Label>
              <Textarea id="hero-subtitle" rows={2} {...register("hero.subtitle")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hero-badge">Etichetta badge sull&apos;immagine</Label>
              <Input id="hero-badge" placeholder="es. EST. BOLOGNA" {...register("hero.badgeText")} />
            </div>
            <MediaUploadField
              label="Immagine hero"
              value={watch("hero.imageUrl")}
              onChange={(url) => setValue("hero.imageUrl", url, { shouldDirty: true })}
              folder="pages/home"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Striscia scorrevole</CardTitle>
            <CardDescription>Il testo animato sotto l&apos;hero.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea rows={2} {...register("marquee.text")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sezione calendario</CardTitle>
            <CardDescription>Titoli sopra il calendario &quot;Cosa succede&quot;.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Kicker</Label>
              <Input {...register("calendar.kicker")} />
            </div>
            <div className="space-y-1.5">
              <Label>Titolo</Label>
              <Input aria-invalid={!!errors.calendar?.title} {...register("calendar.title")} />
            </div>
            <div className="space-y-1.5">
              <Label>Etichetta a destra</Label>
              <Input {...register("calendar.subLabel")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sezione corsi</CardTitle>
            <CardDescription>Titoli sopra i 4 blocchi corso (i corsi si gestiscono in Contenuti — Corsi).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Kicker</Label>
              <Input {...register("corsiSection.kicker")} />
            </div>
            <div className="space-y-1.5">
              <Label>Titolo</Label>
              <Input aria-invalid={!!errors.corsiSection?.title} {...register("corsiSection.title")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sezione eventi</CardTitle>
            <CardDescription>Titoli sopra la preview eventi (gli eventi si gestiscono in Contenuti — Eventi).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Kicker</Label>
              <Input {...register("eventsSection.kicker")} />
            </div>
            <div className="space-y-1.5">
              <Label>Titolo</Label>
              <Input aria-invalid={!!errors.eventsSection?.title} {...register("eventsSection.title")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teaser &quot;Chi siamo&quot;</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Kicker</Label>
              <Input {...register("aboutTeaser.kicker")} />
            </div>
            <div className="space-y-1.5">
              <Label>Titolo</Label>
              <Input aria-invalid={!!errors.aboutTeaser?.title} {...register("aboutTeaser.title")} />
            </div>
            <div className="space-y-1.5">
              <Label>Testo</Label>
              <Textarea rows={3} {...register("aboutTeaser.body")} />
            </div>
            <MediaUploadField
              label="Immagine"
              value={watch("aboutTeaser.imageUrl")}
              onChange={(url) => setValue("aboutTeaser.imageUrl", url, { shouldDirty: true })}
              folder="pages/home"
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
            Salva Home
          </Button>
        </div>
      </form>
    </div>
  )
}
