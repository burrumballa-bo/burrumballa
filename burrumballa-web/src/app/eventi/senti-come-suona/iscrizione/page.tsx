import type { Metadata } from "next"

import { RegistrationForm } from "@/components/registration/registration-form"

const title = "Iscrizione — Senti Come Suona"
const description =
  "Iscriviti a Senti Come Suona: workshop, battle e pagamento in un unico form."

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/eventi/senti-come-suona/iscrizione",
  },
  openGraph: {
    title,
    description,
    url: "/eventi/senti-come-suona/iscrizione",
    siteName: "Burrumballa",
    type: "website",
    locale: "it_IT",
  },
}

export default function IscrizioneSentiComeSuonaPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Iscrizione — Senti Come Suona
        </h1>
        <p className="text-muted-foreground text-sm">
          Compila tutti i campi obbligatori (*). Il totale viene calcolato in
          tempo reale.
        </p>
      </header>

      <RegistrationForm />
    </main>
  )
}
