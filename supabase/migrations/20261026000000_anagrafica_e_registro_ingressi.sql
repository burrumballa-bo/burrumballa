-- =====================================================================
--  SCUOLA — anagrafica completa e registro ingressi
--
--  1. school_students: codice fiscale, indirizzo, genitore/tutore (per i
--     minori: e' lui a pagare e a ricevere la ricevuta), scadenza del
--     certificato medico, consensi privacy e foto.
--
--  2. school_subscription_entries: un ingresso con la sua data per ogni
--     "+1" su un abbonamento a ingressi. Serve a sapere chi e' venuto in
--     un certo mese (alunni attivi). entries_used resta il contatore:
--     school_use_entry / school_undo_entry lo aggiornano insieme al
--     registro in un'unica transazione. Gli ingressi segnati prima di
--     questa migrazione restano nel contatore ma non hanno data.
-- =====================================================================

alter table public.school_students
  add column if not exists tax_code text,
  add column if not exists address text,
  add column if not exists guardian_name text,
  add column if not exists guardian_tax_code text,
  add column if not exists guardian_email text,
  add column if not exists guardian_phone text,
  add column if not exists medical_cert_expiry date,
  add column if not exists privacy_consent boolean not null default false,
  add column if not exists photo_consent boolean not null default false;

create table if not exists public.school_subscription_entries (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.school_subscriptions(id) on delete cascade,
  used_on         date not null default current_date,
  created_at      timestamptz not null default now()
);

create index if not exists idx_school_subscription_entries_sub
  on public.school_subscription_entries(subscription_id);
create index if not exists idx_school_subscription_entries_used_on
  on public.school_subscription_entries(used_on);

alter table public.school_subscription_entries enable row level security;

grant select, insert, delete on public.school_subscription_entries to authenticated;

drop policy if exists "school_subscription_entries_all_authenticated" on public.school_subscription_entries;
create policy "school_subscription_entries_all_authenticated"
  on public.school_subscription_entries for all to authenticated using (true) with check (true);

-- ---- +1 / -1 ingressi ----------------------------------------------
-- Il lock sulla riga dell'abbonamento evita doppi conteggi con due clic
-- ravvicinati o due admin insieme.
create or replace function public.school_use_entry(
  p_subscription_id uuid,
  p_used_on date default current_date
)
returns integer
language plpgsql
as $$
declare
  v_used integer;
  v_total integer;
begin
  select entries_used, entries into v_used, v_total
  from public.school_subscriptions
  where id = p_subscription_id
  for update;

  if not found then
    raise exception 'Abbonamento non trovato';
  end if;
  if v_total is null then
    raise exception 'L''abbonamento non e'' a ingressi';
  end if;
  if v_used >= v_total then
    raise exception 'Ingressi esauriti';
  end if;

  insert into public.school_subscription_entries (subscription_id, used_on)
  values (p_subscription_id, coalesce(p_used_on, current_date));

  update public.school_subscriptions
  set entries_used = v_used + 1
  where id = p_subscription_id;

  return v_used + 1;
end;
$$;

-- Toglie l'ultimo ingresso registrato (se l'ingresso era di prima del
-- registro si scala solo il contatore).
create or replace function public.school_undo_entry(p_subscription_id uuid)
returns integer
language plpgsql
as $$
declare
  v_used integer;
begin
  select entries_used into v_used
  from public.school_subscriptions
  where id = p_subscription_id
  for update;

  if not found then
    raise exception 'Abbonamento non trovato';
  end if;
  if v_used <= 0 then
    raise exception 'Nessun ingresso da togliere';
  end if;

  delete from public.school_subscription_entries
  where id = (
    select id from public.school_subscription_entries
    where subscription_id = p_subscription_id
    order by used_on desc, created_at desc
    limit 1
  );

  update public.school_subscriptions
  set entries_used = v_used - 1
  where id = p_subscription_id;

  return v_used - 1;
end;
$$;

revoke all on function public.school_use_entry(uuid, date) from public, anon;
revoke all on function public.school_undo_entry(uuid) from public, anon;
grant execute on function public.school_use_entry(uuid, date) to authenticated;
grant execute on function public.school_undo_entry(uuid) to authenticated;
