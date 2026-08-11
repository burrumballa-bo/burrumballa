import type { Metadata } from "next"
import Link from "next/link"

import { LegalPageShell, LegalSection } from "@/components/legal/legal-page-shell"
import { getEventInfo } from "@/lib/event-info"
import { getOrgInfo } from "@/lib/org-info"

export const dynamic = "force-dynamic"

const LAST_UPDATED = "11 agosto 2026"

export const metadata: Metadata = {
  title: "Informativa privacy — Burrumballa",
  description:
    "Informativa sul trattamento dei dati personali per le iscrizioni agli eventi Burrumballa, inclusa la pubblicazione di materiale fotografico e video.",
  robots: { index: false, follow: true },
}

export default async function PrivacyPage() {
  const [eventInfo, orgInfo] = await Promise.all([getEventInfo(), getOrgInfo()])

  const titolare = orgInfo.intestazione || "Burrumballa APS"
  const contatto = orgInfo.email_contatto || "info@burrumballa.it"

  return (
    <LegalPageShell title="Informativa sul trattamento dei dati personali" updatedAt={LAST_UPDATED}>
      <p className="text-muted-foreground text-sm leading-relaxed">
        La presente informativa, resa ai sensi degli artt. 13 e 14 del
        Regolamento (UE) 2016/679 (&quot;GDPR&quot;) e del D.Lgs. 196/2003
        come modificato dal D.Lgs. 101/2018 (Codice Privacy), descrive come{" "}
        {titolare} tratta i dati personali raccolti tramite il form di
        iscrizione agli eventi organizzati (es. &quot;{eventInfo.titolo}
        &quot;) e attraverso la navigazione del sito.
      </p>

      <LegalSection title="1. Titolare del trattamento">
        <p>
          Titolare del trattamento è {titolare}
          {orgInfo.indirizzo ? `, ${orgInfo.indirizzo}` : ""}
          {orgInfo.piva_cf ? ` (P.IVA/C.F. ${orgInfo.piva_cf})` : ""}.
        </p>
        <p>
          Per qualsiasi richiesta relativa al trattamento dei dati personali
          è possibile scrivere a{" "}
          <a
            href={`mailto:${contatto}`}
            className="underline underline-offset-2 hover:text-foreground"
          >
            {contatto}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Dati raccolti">
        <p>Attraverso il form di iscrizione raccogliamo:</p>
        <ul className="list-disc pl-5">
          <li>
            dati anagrafici e di contatto: nome, cognome, data di nascita,
            telefono, email, città (facoltativa);
          </li>
          <li>nome d&apos;arte/aka e, per le categorie 2vs2, il nome del partner o della crew;</li>
          <li>
            dati relativi all&apos;iscrizione: workshop e categorie battle
            scelte, metodo di pagamento indicato e importi dovuti;
          </li>
          <li>
            i consensi espressi in fase di iscrizione (accettazione del
            regolamento e trattamento dati, consenso alla pubblicazione di
            foto/video).
          </li>
        </ul>
        <p>
          Non raccogliamo né conserviamo dati di carte di pagamento: il
          bonifico viene eseguito autonomamente dall&apos;interessato
          tramite la propria banca.
        </p>
      </LegalSection>

      <LegalSection title="3. Finalità e base giuridica del trattamento">
        <ul className="list-disc pl-5">
          <li>
            <strong>Gestione dell&apos;iscrizione e del pagamento</strong> —
            esecuzione di misure precontrattuali e del rapporto instaurato
            con l&apos;iscrizione (art. 6.1.b GDPR). Il conferimento di
            questi dati è necessario: senza di essi non è possibile
            completare l&apos;iscrizione.
          </li>
          <li>
            <strong>
              Comunicazioni di servizio (conferma iscrizione, promemoria,
              istruzioni per il pagamento, ricevute)
            </strong>{" "}
            — esecuzione del rapporto e legittimo interesse
            all&apos;organizzazione dell&apos;evento (art. 6.1.b e 6.1.f
            GDPR).
          </li>
          <li>
            <strong>Adempimenti contabili e fiscali</strong> legati
            all&apos;incasso delle quote di iscrizione — obbligo legale
            (art. 6.1.c GDPR).
          </li>
          <li>
            <strong>
              Pubblicazione di foto/video dell&apos;evento in cui
              l&apos;interessato può comparire
            </strong>{" "}
            — consenso specifico (art. 6.1.a e art. 7 GDPR), raccolto
            tramite l&apos;apposita casella nel form di iscrizione. Vedi la
            sezione dedicata più sotto.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Minori">
        <p>
          Alcune categorie sono aperte a partecipanti minorenni. Se
          l&apos;iscritto/a è minorenne, l&apos;iscrizione — e i relativi
          consensi, incluso quello alla pubblicazione di foto/video — devono
          essere effettuati da chi esercita la responsabilità genitoriale
          sul minore.
        </p>
      </LegalSection>

      <LegalSection title="5. Conservazione e pubblicazione di materiale fotografico e video">
        <p>
          Durante l&apos;evento vengono normalmente realizzate foto e video
          (workshop, battle, premiazioni) in cui i partecipanti possono
          comparire. Solo con il consenso espresso in fase di iscrizione,
          questo materiale può essere pubblicato sui canali social e sul
          sito di {titolare}, per finalità promozionali e di documentazione
          dell&apos;evento.
        </p>
        <p>
          Il materiale pubblicato viene conservato per il tempo in cui resta
          online sui canali ufficiali, salvo revoca del consenso.
          L&apos;interessato può in qualsiasi momento revocare il consenso e
          richiedere la rimozione di contenuti specifici già pubblicati
          scrivendo a{" "}
          <a
            href={`mailto:${contatto}`}
            className="underline underline-offset-2 hover:text-foreground"
          >
            {contatto}
          </a>
          . Resta inteso che la revoca non ha effetto retroattivo su
          eventuali condivisioni già effettuate da terzi non riconducibili
          all&apos;organizzazione (es. altri partecipanti, media esterni).
        </p>
      </LegalSection>

      <LegalSection title="6. Destinatari e trattamento tramite fornitori terzi">
        <p>
          I dati sono trattati con strumenti elettronici da personale e
          collaboratori autorizzati di {titolare}. Per la gestione tecnica
          del sito, del database delle iscrizioni e dell&apos;invio delle
          comunicazioni email ci avvaliamo di fornitori terzi (hosting e
          database, servizio di posta elettronica), nominati responsabili
          del trattamento ai sensi dell&apos;art. 28 GDPR, tenuti ad
          adottare misure di sicurezza adeguate. I dati non vengono ceduti a
          terzi per finalità di marketing di terzi.
        </p>
        <p>
          Alcuni fornitori possono trattare i dati anche al di fuori dello
          Spazio Economico Europeo: in tal caso il trasferimento avviene nel
          rispetto delle garanzie previste dal Capo V del GDPR (es. clausole
          contrattuali standard della Commissione Europea).
        </p>
      </LegalSection>

      <LegalSection title="7. Periodo di conservazione">
        <p>
          I dati anagrafici e di iscrizione sono conservati per il tempo
          necessario all&apos;organizzazione dell&apos;evento e, per i dati
          rilevanti ai fini contabili/fiscali (es. ricevute di pagamento),
          per il periodo previsto dalla normativa fiscale italiana
          (ordinariamente 10 anni). Decorsi tali termini, i dati vengono
          cancellati o anonimizzati, salvo diverso obbligo di legge o
          necessità di far valere un diritto in sede giudiziaria.
        </p>
      </LegalSection>

      <LegalSection title="8. Diritti dell'interessato">
        <p>
          In qualità di interessato, hai diritto di chiedere in qualsiasi
          momento l&apos;accesso ai tuoi dati personali, la rettifica o la
          cancellazione degli stessi, la limitazione del trattamento che ti
          riguarda, la portabilità dei dati, nonché di opporti al loro
          trattamento e di revocare, in qualsiasi momento, un consenso
          eventualmente prestato (senza pregiudicare la liceità del
          trattamento basata sul consenso prima della revoca).
        </p>
        <p>
          Le richieste possono essere inviate a{" "}
          <a
            href={`mailto:${contatto}`}
            className="underline underline-offset-2 hover:text-foreground"
          >
            {contatto}
          </a>
          . Hai inoltre diritto di proporre reclamo all&apos;Autorità
          Garante per la protezione dei dati personali (www.garanteprivacy.it)
          qualora ritenga che il trattamento violi la normativa applicabile.
        </p>
      </LegalSection>

      <LegalSection title="9. Cookie">
        <p>
          Le informazioni sui cookie e sugli strumenti di tracciamento
          utilizzati dal sito sono descritte nella{" "}
          <Link
            href="/cookie-policy"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Cookie Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  )
}
