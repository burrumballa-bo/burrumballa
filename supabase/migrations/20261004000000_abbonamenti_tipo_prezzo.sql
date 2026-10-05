-- =====================================================================
--  ABBONAMENTI — tipo (mensile / trimestrale / ingressi) e prezzo
--
--  - kind: monthly | quarterly | entries
--  - entries: numero di ingressi (1..10), solo per kind = 'entries'
--  - price: sempre obbligatorio
--  - description (testo libero) rimossa
-- =====================================================================

alter table public.school_subscriptions
  add column kind text not null default 'monthly'
    check (kind in ('monthly', 'quarterly', 'entries')),
  add column entries integer,
  add column price numeric(8,2) not null default 0 check (price >= 0);

alter table public.school_subscriptions alter column kind drop default;
alter table public.school_subscriptions alter column price drop default;

alter table public.school_subscriptions drop column description;

alter table public.school_subscriptions
  add constraint school_subscriptions_entries_check
  check (
    (kind = 'entries' and entries between 1 and 10)
    or (kind <> 'entries' and entries is null)
  );
