# burrumballa-admin

Pannello di amministrazione — Vite + React + TypeScript, Tailwind CSS e shadcn/ui.

## Setup

```bash
npm install
cp .env.local.example .env.local # e inserisci le tue chiavi Supabase
npm run dev
```

## Struttura

- `src/pages` — pagine dell'app (`LoginPage`, `AdminPage`)
- `src/components` — componenti condivisi (`src/components/ui` per shadcn/ui)
- `src/lib` — utility e client (`src/lib/supabase.ts`)
- `src/hooks` — hook custom (`useAuth`)

## Routing

- `/login` — login amministratore
- `/` — area protetta (richiede sessione Supabase)

## Stack

React Router, TanStack Query, TanStack Table, React Hook Form + Zod, Supabase,
lucide-react, date-fns, jsPDF + jspdf-autotable.

## Deploy

Progetto Vite (SPA): `vercel.json` include il rewrite `/(.*) -> /index.html`
necessario per far funzionare il client-side routing su Vercel.
