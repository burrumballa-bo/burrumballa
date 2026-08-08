# burrumballa-admin

Pannello di amministrazione — Vite + React + TypeScript, Tailwind CSS e shadcn/ui.

## Setup

```bash
npm install
cp .env.local.example .env.local # e inserisci le tue chiavi Supabase
npm run dev
```

## Struttura

- `src/pages` — pagine dell'app (`LoginPage`, `ResetPasswordPage`, `AdminPage`)
- `src/components` — componenti condivisi (`src/components/ui` per shadcn/ui,
  `RegistrationsTable`, `SummaryCards`)
- `src/lib` — utility e client (`src/lib/supabase.ts`, `src/lib/format.ts`,
  `src/lib/paymentStatus.ts`)
- `src/hooks` — hook custom (`useAuth`, `useRegistrations`, `useEventOptions`,
  `useRegistrationMutations`)
- `src/types` — tipi condivisi (`Registration`, `EventOption`)

## Routing

- `/admin/login` — login amministratore (con link "Password dimenticata?")
- `/admin/reset-password` — pagina per impostare la nuova password dopo il
  link di recupero ricevuto via email
- `/admin` — area protetta con la tabella iscritti (richiede sessione
  Supabase)

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

## Stack

React Router, TanStack Query, TanStack Table, React Hook Form + Zod, Supabase,
lucide-react, date-fns, jsPDF + jspdf-autotable.

## Deploy

Progetto Vite (SPA): `vercel.json` include il rewrite `/(.*) -> /index.html`
necessario per far funzionare il client-side routing su Vercel.
