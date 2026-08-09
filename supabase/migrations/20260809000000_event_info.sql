-- =====================================================================
--  EVENTO: SENTI COME SUONA — Info evento (contenuti pagina pubblica)
--
--  Riga unica (id = 1), sullo stesso modello di app_settings. Gestita
--  dall'admin in /admin/evento; letta pubblicamente (anon) dalla pagina
--  dell'evento e dal form di iscrizione (per la scadenza iscrizioni).
-- =====================================================================

create table public.event_info (
  id                    int primary key default 1,
  titolo                text not null,
  data_evento           date,
  descrizione           text,
  testi_informativi     text,
  scadenza_iscrizioni   timestamptz not null,
  updated_at            timestamptz not null default now(),
  constraint event_info_single_row check (id = 1)  -- forza la riga unica
);

create trigger trg_event_info_updated_at
  before update on public.event_info
  for each row execute function public.set_updated_at();

-- ---- RLS event_info --------------------------------------------------
alter table public.event_info enable row level security;

grant select on public.event_info to anon, authenticated;
grant update on public.event_info to authenticated;

-- Lettura pubblica: la pagina evento e il form di iscrizione leggono
-- titolo/data/descrizione/testi/scadenza senza autenticazione.
create policy "event_info_select_anon"
  on public.event_info
  for select
  to anon
  using (true);

create policy "event_info_select_authenticated"
  on public.event_info
  for select
  to authenticated
  using (true);

-- Update: solo admin autenticato.
create policy "event_info_update_authenticated"
  on public.event_info
  for update
  to authenticated
  using (true)
  with check (true);

-- ---- INSERT di default (valori attuali della pagina pubblica) -------
insert into public.event_info (
  id, titolo, data_evento, descrizione, testi_informativi, scadenza_iscrizioni
) values (
  1,
  'Senti Come Suona',
  '2025-09-28',
  'Workshop di Waacking con Rada, battle Hip Hop & Allstyle (1vs1 e 2vs2) con giuria Spider, Zurek e Rada.',
  null,
  '2025-09-21T23:59:59+02:00'
)
on conflict (id) do nothing;
