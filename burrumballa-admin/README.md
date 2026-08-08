# burrumballa-admin

Pannello di amministrazione — Vite + React + TypeScript, Tailwind CSS e shadcn/ui.

## Setup

```bash
npm install
cp .env.local.example .env.local # e inserisci le tue chiavi Supabase
npm run dev
```

## Struttura

- `src/pages` — pagine dell'app (`LoginPage`, `ResetPasswordPage`, `AdminPage`,
  `ImpostazioniPage`)
- `src/components` — componenti condivisi (`src/components/ui` per shadcn/ui,
  `RegistrationsTable`, `SummaryCards`)
- `src/lib` — utility e client (`src/lib/supabase.ts`, `src/lib/format.ts`,
  `src/lib/paymentStatus.ts`, `src/lib/appSettingsSchema.ts`)
- `src/hooks` — hook custom (`useAuth`, `useRegistrations`, `useEventOptions`,
  `useRegistrationMutations`, `useAppSettings`)
- `src/types` — tipi condivisi (`Registration`, `EventOption`, `AppSettings`)

## Routing

- `/admin/login` — login amministratore (con link "Password dimenticata?")
- `/admin/reset-password` — pagina per impostare la nuova password dopo il
  link di recupero ricevuto via email
- `/admin` — area protetta con la tabella iscritti (richiede sessione
  Supabase)
- `/admin/impostazioni` — area protetta per aggiornare la riga unica di
  `app_settings` (email mittente, dati ricevuta, timbro)

## Recupero password

Il flusso usa `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
con `redirectTo` calcolato dinamicamente come
`${window.location.origin}/admin/reset-password` (mai hardcoded), e
`supabase.auth.updateUser({ password })` nella pagina di reset.

Perché l'email di reset (e tutte le altre email di Supabase Auth) arrivino
dall'indirizzo ufficiale di Burrumballa configurato in
`app_settings.email_mittente`, va attivato il **Custom SMTP** nel progetto
Supabase: la procedura completa è documentata in
[`../supabase/CUSTOM_SMTP.md`](../supabase/CUSTOM_SMTP.md).

## Tabella iscritti

`/admin` mostra la tabella `registrations` (via TanStack Query + TanStack
Table) con colonne Nome, Cognome, Aka, Email, Workshop, Battle, Metodo,
Stato (badge colorato), Totale e Data, con ordinamento per colonna. Include
ricerca su nome/cognome/aka/email, filtri per stato con conteggi (Tutti | Da
pagare | Pagato bonifico | Pagato in loco), cambio stato di pagamento e
campo note interne (`note_admin`) editabili per riga (persistiti su
Supabase), e un pannello di riepilogo con totale iscritti, incassato e da
incassare.

Quando lo stato passa a **Pagato bonifico**, la tabella invoca
automaticamente la Edge Function `send-payment-confirmation` (vedi
`../supabase/functions/send-payment-confirmation`), che genera la ricevuta
PDF (dati dinamici da `app_settings` + timbro da Storage) e la invia via
email all'iscritto. La guardia anti-doppio-invio vive lato server
(`registrations.email_conferma_bonifico_inviata_at`), quindi la function è
sicura da richiamare più volte. L'esito (inviata / già inviata / errore)
viene mostrato con un Toast (`sonner`).

## Impostazioni

`/admin/impostazioni` legge e aggiorna l'unica riga di `app_settings`
(`id = 1`, già popolata a DB — la pagina non fa mai insert, solo update):

- `email_mittente` — indirizzo Burrumballa usato come mittente delle email e
  per il recupero password (vedi sezione "Recupero password" sopra)
- `ricevuta_intestazione`, `ricevuta_indirizzo`, `ricevuta_piva_cf`,
  `ricevuta_iban`, `ricevuta_note` — dati usati dalle Edge Functions per
  generare la ricevuta PDF
- `timbro_url` — path dell'immagine del timbro nel bucket Storage privato
  `assets` (upload in `timbro/timbro.<ext>` con `upsert: true`); essendo il
  bucket privato, l'anteprima viene mostrata generando una Signed URL
  (`supabase.storage.from("assets").createSignedUrl(...)`)

Form con React Hook Form + Zod (validazione: email mittente obbligatoria e
valida, intestazione obbligatoria, IBAN opzionale ma validato se presente) e
notifiche di salvataggio/errore con `sonner` (Toaster montato in
`main.tsx`).

## Stack

React Router, TanStack Query, TanStack Table, React Hook Form + Zod, Supabase,
lucide-react, date-fns, jsPDF + jspdf-autotable, sonner.

## Deploy

Progetto Vite (SPA): `vercel.json` include il rewrite `/(.*) -> /index.html`
necessario per far funzionare il client-side routing su Vercel.
