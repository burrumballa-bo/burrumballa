# burrumballa-web

Sito pubblico — Next.js (App Router) + TypeScript, Tailwind CSS e shadcn/ui.

## Setup

```bash
npm install
cp .env.local.example .env.local # e inserisci le tue chiavi Supabase
npm run dev
```

## Struttura

- `src/app` — route dell'App Router
- `src/components/ui` — componenti shadcn/ui
- `src/lib/supabase/client.ts` — client Supabase browser (`@supabase/ssr`)
- `src/lib/utils.ts` — utility condivise (`cn`)

## Stack

Next.js, React, Tailwind CSS, shadcn/ui, Supabase (`@supabase/supabase-js` +
`@supabase/ssr`), React Hook Form + Zod, lucide-react, date-fns.
