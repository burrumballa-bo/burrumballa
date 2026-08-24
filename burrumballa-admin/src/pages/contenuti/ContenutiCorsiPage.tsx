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
import { useSitePage, useUpdateSitePage } from "@/hooks/useSitePage"
import { DEFAULT_CORSI_CONTENT } from "@/lib/cms/defaults"
import { corsiContentSchema, type CorsiContentFormValues } from "@/lib/cms/schemas"

export default function ContenutiCorsiPage() {
  const navigate = useNavigate()
  const pageQuery = useSitePage("corsi", DEFAULT_CORSI_CONTENT)
  const updatePage = useUpdateSitePage("corsi")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CorsiContentFormValues>({
    resolver: zodResolver(corsiContentSchema),
    values: pageQuery.data,
  })

  const onSubmit = (values: CorsiContentFormValues) => {
    updatePage.mutate(values, {
      onSuccess: () => toast.success("Corsi salvata."),
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
        <h1 className="text-2xl font-semibold">Contenuti — Corsi</h1>
      </div>

      {pageQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento...</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Kicker</Label>
                <Input {...register("hero.kicker")} />
              </div>
              <div className="space-y-1.5">
                <Label>Titolo</Label>
                <Input aria-invalid={!!errors.hero?.title} {...register("hero.title")} />
              </div>
              <div className="space-y-1.5">
                <Label>Sottotitolo</Label>
                <Textarea rows={2} {...register("hero.subtitle")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sezione calendario settimanale</CardTitle>
              <CardDescription>Titoli sopra la griglia degli orari (gli orari si gestiscono qui sotto, per corso).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Kicker</Label>
                  <Input {...register("calendar.kicker")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Titolo</Label>
                  <Input aria-invalid={!!errors.calendar?.title} {...register("calendar.title")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Sottotitolo (a destra)</Label>
                <Textarea rows={2} {...register("calendar.subtitle")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sezione &quot;Iscriviti&quot;</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Kicker</Label>
                <Input {...register("join.kicker")} />
              </div>
              <div className="space-y-1.5">
                <Label>Titolo</Label>
                <Input aria-invalid={!!errors.join?.title} {...register("join.title")} />
              </div>
              <div className="space-y-1.5">
                <Label>Testo</Label>
                <Textarea rows={2} {...register("join.body")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Etichetta pulsante</Label>
                  <Input aria-invalid={!!errors.join?.ctaLabel} {...register("join.ctaLabel")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nota sotto il pulsante</Label>
                  <Input {...register("join.note")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || updatePage.isPending}>
              {(isSubmitting || updatePage.isPending) && <Loader2 className="animate-spin" />}
              Salva testi Corsi
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
