import type { Metadata } from "next"
import Link from "next/link"

import { LegalPageShell, LegalSection } from "@/components/legal/legal-page-shell"
import { getOrgInfo } from "@/lib/org-info"

export const dynamic = "force-dynamic"

const LAST_UPDATED = "11 agosto 2026"

export const metadata: Metadata = {
  title: "Cookie policy — Burrumballa",
  description: "Informativa sui cookie e sugli strumenti di tracciamento usati dal sito Burrumballa.",
  robots: { index: false, follow: true },
}

export default async function CookiePolicyPage() {
  const orgInfo = await getOrgInfo()
  const titolare = orgInfo.intestazione || "Burrumballa APS"
  const contatto = orgInfo.email_contatto || "info@burrumballa.it"

  return (
    <LegalPageShell title="Cookie policy" updatedAt={LAST_UPDATED}>
      <LegalSection title="Cosa sono i cookie">
        <p>
          I cookie sono piccoli file di testo che i siti visitati inviano al
          browser e vengono memorizzati sul dispositivo dell&apos;utente,
          per poi essere ritrasmessi agli stessi siti alla visita
          successiva. Insieme ai cookie si usano anche tecnologie simili
          (es. local storage), qui indicate collettivamente come
          &quot;cookie&quot;.
        </p>
      </LegalSection>

      <LegalSection title="Cookie utilizzati da questo sito">
        <p>
          Il sito di {titolare} <strong>non utilizza cookie di
          profilazione, statistica o pubblicitari</strong>, né propri né di
          terze parti (nessun servizio di analytics, nessun pixel di
          tracciamento, nessun social plugin).
        </p>
        <p>
          Vengono utilizzati esclusivamente cookie e strumenti di storage{" "}
          <strong>tecnici</strong>, strettamente necessari al funzionamento
          delle pagine (es. libreria client di Supabase, usata per
          l&apos;invio del form di iscrizione e, nell&apos;area riservata
          dello staff, per mantenere la sessione di accesso).
        </p>
      </LegalSection>

      <LegalSection title="Base giuridica">
        <p>
          I cookie tecnici, in quanto strettamente necessari all&apos;
          erogazione del servizio richiesto, sono esenti dall&apos;obbligo
          di consenso preventivo ai sensi dell&apos;art. 122 del Codice
          Privacy (D.Lgs. 196/2003 e ss.mm.ii.) e delle Linee guida cookie e
          altri strumenti di tracciamento del Garante per la protezione dei
          dati personali (10 giugno 2021). Per questo motivo il sito non
          mostra un banner di richiesta consenso: non essendoci cookie non
          tecnici, non c&apos;è nulla su cui chiedere il consenso.
        </p>
      </LegalSection>

      <LegalSection title="Come gestire i cookie dal browser">
        <p>
          Anche se il sito non installa cookie non tecnici, puoi comunque
          consultare, gestire o eliminare in qualsiasi momento i cookie
          presenti sul tuo dispositivo dalle impostazioni del tuo browser
          (di norma nella sezione &quot;Privacy e sicurezza&quot; o
          &quot;Cookie&quot; dei menu Impostazioni).
        </p>
      </LegalSection>

      <LegalSection title="Aggiornamenti">
        <p>
          Se in futuro venissero introdotti strumenti di analisi statistica
          o cookie di terze parti, questa pagina verrà aggiornata di
          conseguenza e, ove richiesto dalla normativa, verrà mostrato un
          apposito banner per la raccolta del consenso.
        </p>
      </LegalSection>

      <LegalSection title="Titolare e contatti">
        <p>
          Titolare del trattamento è {titolare}. Per qualsiasi domanda su
          questa cookie policy puoi scrivere a{" "}
          <a
            href={`mailto:${contatto}`}
            className="underline underline-offset-2 hover:text-foreground"
          >
            {contatto}
          </a>
          . Per informazioni sul trattamento degli altri dati personali,
          consulta l&apos;
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-foreground"
          >
            informativa privacy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  )
}
