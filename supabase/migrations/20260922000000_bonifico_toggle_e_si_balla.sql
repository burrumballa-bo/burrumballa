-- =====================================================================
--  SENTI COME SUONA — Toggle bonifico + ordinamenti "Si balla"
--
--  1. event_info.bonifico_attivo: l'admin può disattivare il pagamento
--     con bonifico. Da disattivato il form pubblico accetta comunque le
--     iscrizioni, ma il metodo di pagamento è forzato a "sul_posto"
--     (pagamento di persona all'evento).
--
--  2. si_balla_ordinamenti: ordine (randomizzato dall'admin) delle liste
--     della pagina /admin/evento/si-balla. Una riga per sezione; `ordine`
--     contiene gli id delle righe (id iscrizione, o coppia "idA|idB" per
--     le coppie della 2vs2) nell'ordine salvato.
-- =====================================================================

-- ---- 1. Toggle bonifico ----------------------------------------------
alter table public.event_info
  add column if not exists bonifico_attivo boolean not null default true;

comment on column public.event_info.bonifico_attivo is
  'Se false il form pubblico non propone il bonifico: ci si iscrive comunque e si paga di persona (payment_method = sul_posto).';

-- ---- 2. Ordinamenti "Si balla" ----------------------------------------
create table if not exists public.si_balla_ordinamenti (
  sezione     text primary key,
  ordine      text[] not null default '{}',
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_si_balla_ordinamenti_updated_at on public.si_balla_ordinamenti;
create trigger trg_si_balla_ordinamenti_updated_at
  before update on public.si_balla_ordinamenti
  for each row execute function public.set_updated_at();

alter table public.si_balla_ordinamenti enable row level security;

grant select, insert, update, delete on public.si_balla_ordinamenti to authenticated;

drop policy if exists "si_balla_ordinamenti_all_authenticated" on public.si_balla_ordinamenti;
create policy "si_balla_ordinamenti_all_authenticated"
  on public.si_balla_ordinamenti
  for all
  to authenticated
  using (true)
  with check (true);
