-- =====================================================================
--  RICEVUTE — numerazione unica (scuola + eventi + ricevute libere)
--
--  - Numero progressivo per anno solare: 2026/0001, 2026/0002, ...
--    Assegnato da un trigger sotto advisory lock, quindi due emissioni
--    contemporanee non possono prendere lo stesso numero (il vincolo
--    unique resta come rete di sicurezza).
--  - Una ricevuta emessa non si cancella e non si modifica: si annulla
--    (cancelled_at), cosi' la numerazione non ha buchi. Restano
--    aggiornabili solo pdf_path, invio e annullamento.
--  - Le ricevute vengono create solo dalle Edge Functions (service role):
--    authenticated puo' leggerle e annullarle.
--  - Il PDF emesso e' salvato in assets/ricevute/<anno>/<numero>.pdf e
--    non viene rigenerato: resta identico anche se cambiano le impostazioni.
-- =====================================================================

create table if not exists public.receipts (
  id                 uuid primary key default gen_random_uuid(),
  year               smallint not null,
  number             integer not null,
  issued_on          date not null default current_date,

  recipient_name     text not null check (length(trim(recipient_name)) > 0),
  recipient_tax_code text,
  recipient_address  text,
  recipient_email    text,

  -- [{ "description": text, "amount": number | null }]
  items              jsonb not null
                       check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  total              numeric(10,2) not null check (total >= 0),
  payment_method     text check (payment_method in ('contanti', 'bonifico', 'pos')),
  notes              text,

  student_id         uuid references public.school_students(id) on delete set null,
  registration_id    uuid references public.registrations(id) on delete set null,

  pdf_path           text,
  sent_at            timestamptz,
  sent_to            text,
  cancelled_at       timestamptz,

  created_at         timestamptz not null default now(),
  created_by         uuid default auth.uid(),

  unique (year, number)
);

create index if not exists idx_receipts_student on public.receipts(student_id);
create index if not exists idx_receipts_registration on public.receipts(registration_id);

-- ---- Numerazione ------------------------------------------------------
create or replace function public.assign_receipt_number()
returns trigger
language plpgsql
as $$
begin
  new.year := extract(year from new.issued_on)::smallint;
  -- Serializza le emissioni dello stesso anno fino al commit.
  perform pg_advisory_xact_lock(hashtext('receipts_number'), new.year);
  select coalesce(max(number), 0) + 1 into new.number
  from public.receipts
  where year = new.year;
  return new;
end;
$$;

drop trigger if exists trg_receipts_number on public.receipts;
create trigger trg_receipts_number
  before insert on public.receipts
  for each row execute function public.assign_receipt_number();

-- ---- Immutabilita' ----------------------------------------------------
create or replace function public.protect_issued_receipt()
returns trigger
language plpgsql
as $$
begin
  if (new.year, new.number, new.issued_on, new.recipient_name, new.recipient_tax_code,
      new.recipient_address, new.recipient_email, new.items, new.total,
      new.payment_method, new.notes)
     is distinct from
     (old.year, old.number, old.issued_on, old.recipient_name, old.recipient_tax_code,
      old.recipient_address, old.recipient_email, old.items, old.total,
      old.payment_method, old.notes) then
    raise exception 'Una ricevuta emessa non si puo'' modificare: annullala ed emettine una nuova.';
  end if;
  if old.cancelled_at is not null and new.cancelled_at is null then
    raise exception 'Una ricevuta annullata non si puo'' ripristinare.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_receipts_protect on public.receipts;
create trigger trg_receipts_protect
  before update on public.receipts
  for each row execute function public.protect_issued_receipt();

-- ---- RLS ---------------------------------------------------------------
alter table public.receipts enable row level security;

grant select on public.receipts to authenticated;
grant update (cancelled_at) on public.receipts to authenticated;

drop policy if exists "receipts_select_authenticated" on public.receipts;
create policy "receipts_select_authenticated"
  on public.receipts for select to authenticated using (true);

drop policy if exists "receipts_update_authenticated" on public.receipts;
create policy "receipts_update_authenticated"
  on public.receipts for update to authenticated using (true) with check (true);
