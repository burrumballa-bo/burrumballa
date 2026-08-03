# Burrumballa

Vite + React + TypeScript, con Tailwind CSS e shadcn/ui.

## Setup

```bash
npm install
cp .env.local.example .env.local # e inserisci le tue chiavi Supabase
npm run dev
```

## Struttura

- `src/pages` — pagine dell'app
- `src/components` — componenti condivisi (`src/components/ui` per shadcn/ui)
- `src/lib` — utility e client (es. `src/lib/supabase.ts`)
- `src/hooks` — hook custom
- `src/types` — tipi TypeScript condivisi

## Routing

- `/` — pagina pubblica
- `/admin/login` — login amministratore
- `/admin` — area protetta (richiede sessione Supabase)

## Stack

React Router, TanStack Query, TanStack Table, React Hook Form + Zod, Supabase,
lucide-react, date-fns, jsPDF + jspdf-autotable.
