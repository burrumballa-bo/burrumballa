-- Ingressi gia' effettuati per gli abbonamenti ad ingressi (0..entries).
alter table public.school_subscriptions
  add column if not exists entries_used integer not null default 0 check (entries_used >= 0);

alter table public.school_subscriptions
  drop constraint if exists school_subscriptions_entries_used_max_check;

alter table public.school_subscriptions
  add constraint school_subscriptions_entries_used_max_check
  check (entries is null or entries_used <= entries);
