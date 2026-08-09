import type { Metadata } from "next"
import Link from "next/link"
import {
  Banknote,
  CalendarDays,
  Clock,
  CreditCard,
  Gavel,
  Info,
  TriangleAlert,
  Users,
} from "lucide-react"

import { RegistrationForm } from "@/components/registration/registration-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDeadlineDate, formatEventDate, getEventInfo } from "@/lib/event-info"

// Renderizzata lato server ad ogni richiesta (App Router = SSR di default).
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const eventInfo = await getEventInfo()
  const dataEvento = formatEventDate(eventInfo.data_evento)
  const title = dataEvento ? `${eventInfo.titolo} — ${dataEvento}` : eventInfo.titolo
  const description =
    (eventInfo.descrizione ??
      `Iscrizioni entro il ${formatDeadlineDate(eventInfo.scadenza_iscrizioni)}.`) +
    " Iscriviti online: workshop, battle e pagamento in un unico form."

  return {
    title,
    description,
    alternates: {
      canonical: "/eventi/senti-come-suona",
    },
    openGraph: {
      title,
      description,
      url: "/eventi/senti-come-suona",
      siteName: "Burrumballa",
      type: "website",
      locale: "it_IT",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function SentiComeSuonaPage() {
  const eventInfo = await getEventInfo()
  const dataEvento = formatEventDate(eventInfo.data_evento)

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3 text-center">
        <Badge variant="secondary" className="mx-auto">
          Evento / Event
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">{eventInfo.titolo}</h1>
        {dataEvento && (
          <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
            <CalendarDays className="size-4" />
            <span>{dataEvento}</span>
          </div>
        )}
        {eventInfo.descrizione && (
          <p className="text-muted-foreground mx-auto max-w-xl text-sm">
            {eventInfo.descrizione}
          </p>
        )}
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users className="size-5" />
            Workshop
          </CardTitle>
          <CardDescription>
            Prima dell&apos;evento{" "}
            <span className="italic">(before the event)</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="font-medium">Waacking con RADA</p>
              <p className="text-muted-foreground text-sm italic">
                Waacking with RADA
              </p>
              <div className="text-muted-foreground mt-2 flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="size-4" /> 10:00–11:00
                </span>
                <span>25€</span>
              </div>
            </div>
            <Badge>Posti disponibili</Badge>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="font-medium">Spider</p>
              <p className="text-muted-foreground text-sm italic">Spider</p>
            </div>
            <Badge variant="destructive">SOLD OUT</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Gavel className="size-5" />
            Battle
          </CardTitle>
          <CardDescription>
            1vs1 &amp; 2vs2 — Hip Hop &amp; Allstyle
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium">
              Formati <span className="text-muted-foreground italic">(Formats)</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">1vs1</Badge>
              <Badge variant="outline">2vs2</Badge>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">
              Stili <span className="text-muted-foreground italic">(Styles)</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">Hip Hop</Badge>
              <Badge variant="outline">Allstyle</Badge>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">
              Giuria <span className="text-muted-foreground italic">(Judges)</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">Spider</Badge>
              <Badge variant="secondary">Zurek</Badge>
              <Badge variant="secondary">Rada</Badge>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">
              Costi <span className="text-muted-foreground italic">(Fees)</span>
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              15€ / 20€ / 25€ / 30€ a seconda del numero di categorie{" "}
              <span className="italic">(depending on how many categories)</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="size-5" />
            Iscrizioni e pagamento
          </CardTitle>
          <CardDescription className="italic">
            Registration &amp; payment
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="font-medium">Scadenza iscrizioni</p>
              <p className="text-muted-foreground text-sm italic">
                Registration deadline
              </p>
            </div>
            <Badge variant="secondary">
              {formatDeadlineDate(eventInfo.scadenza_iscrizioni)}
            </Badge>
          </div>

          <ul className="text-muted-foreground flex flex-col gap-2 text-sm">
            <li className="flex items-start gap-2">
              <Banknote className="mt-0.5 size-4 shrink-0" />
              <span>
                Battle dopo la scadenza:{" "}
                <strong className="text-foreground">+5€</strong>{" "}
                <span className="italic">
                  (battle after the deadline: +€5)
                </span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CreditCard className="mt-0.5 size-4 shrink-0" />
              <span>
                Battle pagata sul posto:{" "}
                <strong className="text-foreground">+5€</strong>{" "}
                <span className="italic">(battle paid on site: +€5)</span>
              </span>
            </li>
          </ul>

          <div className="border-destructive/50 bg-destructive/5 flex items-start gap-3 rounded-lg border p-4">
            <TriangleAlert className="text-destructive mt-0.5 size-5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">
                Il posto è confermato solo dopo il bonifico.
              </p>
              <p className="text-muted-foreground italic">
                Your spot is confirmed only after the bank transfer is
                received.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {eventInfo.testi_informativi && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Info className="size-5" />
              Informazioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {eventInfo.testi_informativi}
            </p>
          </CardContent>
        </Card>
      )}

      <Button asChild size="lg" className="mx-auto">
        <Link href="#iscrizione">Iscriviti ora</Link>
      </Button>

      <div id="iscrizione" className="flex scroll-mt-8 flex-col gap-6">
        <header className="flex flex-col gap-2 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Iscrizione</h2>
          <p className="text-muted-foreground text-sm">
            Compila tutti i campi obbligatori (*). Il totale viene calcolato
            in tempo reale.
          </p>
        </header>

        <RegistrationForm />
      </div>
    </main>
  )
}
