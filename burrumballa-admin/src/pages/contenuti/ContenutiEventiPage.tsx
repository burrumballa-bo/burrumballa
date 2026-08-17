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
import { EventsSection } from "@/components/EventsSection"
import { useSitePage, useUpdateSitePage } from "@/hooks/useSitePage"
import { DEFAULT_EVENTI_CONTENT } from "@/lib/cms/defaults"
import { eventiContentSchema, type EventiContentFormValues } from "@/lib/cms/schemas"

export default function ContenutiEventiPage() {
  const navigate = useNavigate()
  const pageQuery = useSitePage("eventi", DEFAULT_EVENTI_CONTENT)
  const updatePage = useUpdateSitePage("eventi")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventiContentFormValues>({
    resolver: zodResolver(eventiContentSchema),
    values: pageQuery.data,
  })

  const onSubmit = (values: EventiContentFormValues) => {
    updatePage.mutate(values, {
      onSuccess: () => toast.success("Eventi salvata."),
      onError: (error) =>
        toast.error("Salvataggio non riuscito.", { description: (error as Error).message }),
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin/contenuti")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">Contenuti — Eventi</h1>
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
              Salva testi Eventi
            </Button>
          </div>
        </form>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Eventi</CardTitle>
          <CardDescription>
            Le schede evento mostrate su Home (le prime 3, in ordine) e nella pagina Eventi. La
            prima marcata &quot;In evidenza&quot; (o la prima in ordine) diventa la scheda grande in
            cima alla pagina Eventi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventsSection />
        </CardContent>
      </Card>
    </div>
  )
}
