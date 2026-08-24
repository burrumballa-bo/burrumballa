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
import { DEFAULT_FOOTER_CONTENT } from "@/lib/cms/defaults"
import { footerContentSchema, type FooterContentFormValues } from "@/lib/cms/schemas"

export default function ContenutiFooterPage() {
  const navigate = useNavigate()
  const pageQuery = useSitePage("footer", DEFAULT_FOOTER_CONTENT)
  const updatePage = useUpdateSitePage("footer")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FooterContentFormValues>({
    resolver: zodResolver(footerContentSchema),
    values: pageQuery.data,
  })

  const onSubmit = (values: FooterContentFormValues) => {
    updatePage.mutate(values, {
      onSuccess: () => toast.success("Footer salvato."),
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
        <h1 className="text-2xl font-semibold">Contenuti — Footer</h1>
      </div>

      {pageQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento...</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Footer del sito</CardTitle>
              <CardDescription>
                Mostrato in fondo a tutte le pagine del sito pubblico (Home, Corsi, Eventi, Chi siamo).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="footer-tagline">Descrizione breve</Label>
                <Textarea id="footer-tagline" rows={2} {...register("tagline")} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="footer-location">Nome del luogo</Label>
                  <Input
                    id="footer-location"
                    aria-invalid={!!errors.locationName}
                    {...register("locationName")}
                  />
                  {errors.locationName && (
                    <p className="text-destructive text-xs">{errors.locationName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="footer-address-1">Indirizzo — riga 1</Label>
                  <Input id="footer-address-1" {...register("addressLine1")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="footer-address-2">Indirizzo — riga 2</Label>
                  <Input id="footer-address-2" {...register("addressLine2")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="footer-instagram">Handle Instagram (senza @)</Label>
                <Input id="footer-instagram" placeholder="burrumballa" {...register("instagramHandle")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="footer-contact-note">Nota contatti</Label>
                <Input id="footer-contact-note" placeholder="Tessera ARCI obbligatoria" {...register("contactNote")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="footer-rights">Nota diritti (a fianco del copyright)</Label>
                <Input id="footer-rights" {...register("rightsNote")} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || updatePage.isPending}>
              {(isSubmitting || updatePage.isPending) && <Loader2 className="animate-spin" />}
              Salva Footer
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
