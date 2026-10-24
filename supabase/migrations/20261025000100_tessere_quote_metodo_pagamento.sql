-- =====================================================================
--  SCUOLA — metodo di pagamento, tessere e quote di iscrizione
--
--  Metodo di incasso: 'contanti' | 'bonifico' | 'pos'.
--
--  - school_subscriptions.payment_method: null = abbonamento ancora da
--    pagare. paid_at = giorno dell'incasso (per i riepiloghi per periodo).
--  - school_memberships: una riga per iscritto e per stagione (season =
--    anno di inizio, 2026 = "2026/27"; il mese di inizio e' in
--    app_settings.stagione_mese_inizio). Contiene:
--      * tessera: card_status
--          pagata        -> fatta da Burrumballa e pagata
--          altro_circolo -> l'iscritto ce l'ha gia', fatta altrove
--          da_pagare     -> fatta da Burrumballa ma non ancora pagata
--          da_fare       -> non ancora fatta
--        importo / metodo / data valgono solo per 'pagata' (l'importo
--        resta facoltativo anche per 'da_pagare', per sapere quanto manca).
--      * quota di iscrizione: fee_paid + importo / metodo / data.
-- =====================================================================

alter table public.school_subscriptions
  add column if not exists payment_method text
    check (payment_method in ('contanti', 'bonifico', 'pos')),
  add column if not exists paid_at date;

alter table public.school_subscriptions
  drop constraint if exists school_subscriptions_paid_check;
alter table public.school_subscriptions
  add constraint school_subscriptions_paid_check
  check ((payment_method is null) = (paid_at is null));

create table if not exists public.school_memberships (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references public.school_students(id) on delete cascade,
  season              smallint not null check (season between 2000 and 2100),

  card_status         text not null default 'da_fare'
                        check (card_status in ('pagata', 'altro_circolo', 'da_pagare', 'da_fare')),
  card_number         text,
  card_price          numeric(8,2) check (card_price >= 0),
  card_payment_method text check (card_payment_method in ('contanti', 'bonifico', 'pos')),
  card_paid_at        date,

  fee_paid            boolean not null default false,
  fee_price           numeric(8,2) check (fee_price >= 0),
  fee_payment_method  text check (fee_payment_method in ('contanti', 'bonifico', 'pos')),
  fee_paid_at         date,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (student_id, season),
  constraint school_memberships_card_paid_check check (
    (card_status = 'pagata'
      and card_price is not null and card_payment_method is not null and card_paid_at is not null)
    or (card_status <> 'pagata' and card_payment_method is null and card_paid_at is null)
  ),
  constraint school_memberships_fee_paid_check check (
    (fee_paid and fee_price is not null and fee_payment_method is not null and fee_paid_at is not null)
    or (not fee_paid and fee_payment_method is null and fee_paid_at is null)
  )
);

create index if not exists idx_school_memberships_season on public.school_memberships(season);

drop trigger if exists trg_school_memberships_updated_at on public.school_memberships;
create trigger trg_school_memberships_updated_at
  before update on public.school_memberships
  for each row execute function public.set_updated_at();

alter table public.school_memberships enable row level security;

grant select, insert, update, delete on public.school_memberships to authenticated;

drop policy if exists "school_memberships_all_authenticated" on public.school_memberships;
create policy "school_memberships_all_authenticated"
  on public.school_memberships for all to authenticated using (true) with check (true);
