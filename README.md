# Burrumballa

Repository con due progetti indipendenti, ciascuno con il proprio
`package.json` e pensato per essere deployato come progetto Vercel separato:

- [`burrumballa-web/`](./burrumballa-web) — sito pubblico (Next.js + TypeScript
  + App Router + Tailwind + shadcn/ui), destinato a `burrumballa.com`.
- [`burrumballa-admin/`](./burrumballa-admin) — pannello di amministrazione
  (Vite + React + TypeScript + Tailwind + shadcn/ui), destinato a
  `admin.burrumballa.com`.

Ogni cartella ha il proprio `README.md`, `.env.local.example` e istruzioni di
setup. Per collegare entrambi i progetti a Vercel come due progetti distinti
(env Production/Preview, Root Directory, sottodomini), vedi le istruzioni
fornite separatamente nella conversazione con l'assistente.
