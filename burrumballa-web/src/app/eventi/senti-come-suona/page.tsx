import type { Metadata } from "next"
import {
  Banknote,
  CalendarDays,
  Clock,
  CreditCard,
  Gavel,
  TriangleAlert,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Renderizzata lato server ad ogni richiesta (App Router = SSR di default).
export const dynamic = "force-dynamic"

const title = "Senti Come Suona — 28 Settembre 2025"
const description =
  "Workshop di Waacking con Rada, battle Hip Hop & Allstyle (1vs1 e 2vs2) con giuria Spider, Zurek e Rada. Iscrizioni entro il 21/09/2025."

export const metadata: Metadata = {
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

export default function SentiComeSuonaPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3 text-center">
        <Badge variant="secondary" className="mx-auto">
          Evento / Event
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">Senti Come Suona</h1>
        <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
          <CalendarDays className="size-4" />
          <span>
            Domenica 28 Settembre 2025{" "}
            <span className="italic">
              (Sunday, September 28, 2025)
            </span>
          </span>
        </div>
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
              15€ / 20€ / 25€ a seconda della categoria{" "}
              <span className="italic">(depending on the category)</span>
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
            <Badge variant="secondary">21/09/2025</Badge>
          </div>

          <ul className="text-muted-foreground flex flex-col gap-2 text-sm">
            <li className="flex items-start gap-2">
              <Banknote className="mt-0.5 size-4 shrink-0" />
              <span>
                Dopo la scadenza: <strong className="text-foreground">+5€</strong>{" "}
                <span className="italic">
                  (after the deadline: +€5)
                </span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CreditCard className="mt-0.5 size-4 shrink-0" />
              <span>
                Pagamento sul posto: <strong className="text-foreground">+5€</strong>{" "}
                <span className="italic">(payment on site: +€5)</span>
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
    </main>
  )
}
