-- =====================================================================
--  EVENTO: SENTI COME SUONA
--  Schema Supabase / PostgreSQL
--
--  Ordine di esecuzione: eseguire l'intero file nel SQL Editor.
--  I valori segnati come PLACEHOLDER vanno aggiornati (prezzi, posti,
--  dati della ricevuta, email mittente, ecc.).
--
--  NOTA: questa migrazione documenta lo schema gia' eseguito manualmente
--  sul SQL Editor di Supabase. Vedi 20260808000100_registrations_insert_hardening.sql
--  per il fix di sicurezza applicato subito dopo.
-- =====================================================================


-- =====================================================================
--  0. FUNZIONI DI UTILITA'
-- =====================================================================

-- Aggiorna automaticamente updated_at su UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- =====================================================================
--  1. ENUM
-- =====================================================================

create type public.payment_status as enum ('da_pagare', 'pagato_bonifico', 'pagato_in_loco');
create type public.payment_method as enum ('bonifico', 'sul_posto');


-- =====================================================================
--  2. TABELLA registrations
-- =====================================================================

create table public.registrations (
  id                                  uuid primary key default gen_random_uuid(),
  created_at                          timestamptz not null default now(),
  nome                                text not null,
  cognome                             text not null,
  aka                                 text,
  aka_partner_2vs2                    text,
  email                               text not null,
  workshop                            text,                 -- chiave di event_options (tipo 'workshop')
  battle_categories                   text[] not null default '{}',  -- chiavi di event_options (tipo 'battle')
  payment_method                      public.payment_method not null,
  payment_status                      public.payment_status not null default 'da_pagare',
  amount_workshop                     numeric(6,2) not null default 0,
  amount_battle                       numeric(6,2) not null default 0,
  surcharge_late                      numeric(6,2) not null default 0,
  surcharge_onsite                    numeric(6,2) not null default 0,
  amount_total                        numeric(8,2) not null default 0,
  consenso_immagini                   boolean not null default false,
  note_admin                          text,
  email_conferma_bonifico_inviata_at  timestamptz
);

-- Indici richiesti
create index idx_registrations_payment_status on public.registrations (payment_status);
create index idx_registrations_nome_cognome   on public.registrations (nome, cognome);

-- ---- RLS registrations ---------------------------------------------
alter table public.registrations enable row level security;

-- Privilegi di tabella (necessari IN AGGIUNTA alle policy su Supabase)
grant insert         on public.registrations to anon;
grant select, update on public.registrations to authenticated;

-- INSERT pubblico (form): chiunque non autenticato puo' iscriversi.
create policy "registrations_insert_anon"
  on public.registrations
  for insert
  to anon
  with check (true);

-- SELECT: solo admin autenticato.
create policy "registrations_select_authenticated"
  on public.registrations
  for select
  to authenticated
  using (true);

-- UPDATE: solo admin autenticato.
create policy "registrations_update_authenticated"
  on public.registrations
  for update
  to authenticated
  using (true)
  with check (true);

-- Nota: per inserimenti manuali lato admin usa la service_role (che
-- bypassa la RLS) dal backend/dashboard, oppure aggiungi una policy
-- insert anche per authenticated se preferisci.


-- =====================================================================
--  3. TABELLA app_settings (riga unica, configurabile dall'admin)
-- =====================================================================

create table public.app_settings (
  id                     int primary key default 1,
  email_mittente         text,   -- email di Burrumballa: mittente + recupero password
  ricevuta_intestazione  text,   -- nome associazione
  ricevuta_indirizzo     text,
  ricevuta_piva_cf       text,
  ricevuta_iban          text,
  ricevuta_note          text,
  timbro_url             text,   -- path/URL del timbro su Supabase Storage (bucket privato 'assets')
  updated_at             timestamptz not null default now(),
  constraint app_settings_single_row check (id = 1)  -- forza la riga unica
);

create trigger trg_app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ---- RLS app_settings ----------------------------------------------
alter table public.app_settings enable row level security;

grant select, update on public.app_settings to authenticated;

create policy "app_settings_select_authenticated"
  on public.app_settings
  for select
  to authenticated
  using (true);

create policy "app_settings_update_authenticated"
  on public.app_settings
  for update
  to authenticated
  using (true)
  with check (true);

-- ---- INSERT di default (PLACEHOLDER: aggiorna i valori) -------------
insert into public.app_settings (
  id, email_mittente, ricevuta_intestazione, ricevuta_indirizzo,
  ricevuta_piva_cf, ricevuta_iban, ricevuta_note, timbro_url
) values (
  1,
  'placeholder@burrumballa.it',                    -- PLACEHOLDER email mittente
  'Burrumballa APS',                               -- PLACEHOLDER nome associazione
  'Via Placeholder 1, 00000 Città (XX)',           -- PLACEHOLDER indirizzo
  'P.IVA/C.F. 00000000000',                         -- PLACEHOLDER P.IVA / CF
  'IT00X0000000000000000000000',                   -- PLACEHOLDER IBAN
  'Grazie per la tua iscrizione a SENTI COME SUONA.', -- PLACEHOLDER note ricevuta
  null                                              -- timbro caricato in seguito
)
on conflict (id) do nothing;


-- =====================================================================
--  4. TABELLA event_options (opzioni del form: workshop e battle)
-- =====================================================================

create table public.event_options (
  id                uuid primary key default gen_random_uuid(),
  tipo              text not null check (tipo in ('workshop', 'battle')),
  chiave            text not null unique,
  label             text not null,
  prezzo            numeric(6,2) not null default 0,
  max_posti         int,                              -- null = illimitato
  sold_out_manuale  boolean not null default false,
  attivo            boolean not null default true,
  ordine            int not null default 0,
  created_at        timestamptz not null default now()
);

-- ---- RLS event_options ---------------------------------------------
alter table public.event_options enable row level security;

grant select on public.event_options to anon, authenticated;
grant update on public.event_options to authenticated;

-- Lettura pubblica: anon vede SOLO le opzioni attive.
create policy "event_options_select_active_anon"
  on public.event_options
  for select
  to anon
  using (attivo = true);

-- Lettura admin: authenticated vede tutte le opzioni (anche disattivate).
create policy "event_options_select_all_authenticated"
  on public.event_options
  for select
  to authenticated
  using (true);

-- Update: solo admin autenticato.
create policy "event_options_update_authenticated"
  on public.event_options
  for update
  to authenticated
  using (true)
  with check (true);

-- ---- INSERT opzioni SENTI COME SUONA (prezzi/posti = PLACEHOLDER) ---
insert into public.event_options (tipo, chiave, label, prezzo, max_posti, sold_out_manuale, attivo, ordine) values
  -- WORKSHOP
  ('workshop', 'waacking_rada', 'Workshop Waacking con Rada', 25.00, 20,   false, true, 1),  -- max_posti = PLACEHOLDER
  ('workshop', 'spider',        'Workshop Spider',            25.00, null,  true,  true, 2),  -- prezzo = PLACEHOLDER, gia' sold out
  ('workshop', 'no_workshop',   'Nessun workshop',            0.00,  null,  false, true, 3),
  -- BATTLE (prezzi = PLACEHOLDER)
  ('battle',   'hiphop_1vs1_u13', 'Hip Hop 1vs1 U13', 10.00, null, false, true, 10),
  ('battle',   'hiphop_1vs1_u18', 'Hip Hop 1vs1 U18', 10.00, null, false, true, 11),
  ('battle',   'hiphop_2vs2_open','Hip Hop 2vs2 Open', 10.00, null, false, true, 12),
  ('battle',   'allstyle_1vs1',   'All Style 1vs1',    10.00, null, false, true, 13),
  ('battle',   'no_battle',       'Nessuna battle',     0.00, null, false, true, 14);


-- =====================================================================
--  5. CONTEGGIO ISCRITTI + VIEW event_options_stato
--
--  Il conteggio deve girare in SECURITY DEFINER perche' anon NON puo'
--  leggere registrations: cosi' il pubblico vede i posti occupati
--  senza accedere ai dati personali delle iscrizioni.
--  Il conteggio e' A PRESCINDERE dallo stato di pagamento.
-- =====================================================================

create or replace function public.conta_iscritti_opzione(p_chiave text, p_tipo text)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.registrations r
  where (p_tipo = 'workshop' and r.workshop = p_chiave)
     or (p_tipo = 'battle'   and p_chiave = any(r.battle_categories));
$$;

grant execute on function public.conta_iscritti_opzione(text, text) to anon, authenticated;

-- View pubblica: security_invoker = true -> rispetta la RLS di
-- event_options (anon vede solo le attive; admin vede tutte).
-- Il conteggio arriva dalla funzione definer, quindi funziona anche
-- senza accesso a registrations.
create or replace view public.event_options_stato
with (security_invoker = true) as
select
  o.id,
  o.tipo,
  o.chiave,
  o.label,
  o.prezzo,
  o.max_posti,
  o.sold_out_manuale,
  o.attivo,
  o.ordine,
  c.iscritti,
  (o.sold_out_manuale
    or (o.max_posti is not null and c.iscritti >= o.max_posti)) as sold_out
from public.event_options o
cross join lateral (
  select public.conta_iscritti_opzione(o.chiave, o.tipo) as iscritti
) c;

grant select on public.event_options_stato to anon, authenticated;


-- =====================================================================
--  6. TRIGGER ANTI-OVERBOOKING sull'INSERT di registrations
--
--  Per ogni opzione scelta (workshop + ogni categoria battle):
--   - blocca la riga dell'opzione con SELECT ... FOR UPDATE
--     (serializza le iscrizioni concorrenti sulla stessa opzione)
--   - ricalcola iscritti e sold_out effettivo
--   - se sold_out -> RAISE EXCEPTION e l'iscrizione viene rifiutata.
--  security definer per poter contare registrations e bloccare le
--  opzioni anche quando l'insert arriva dal ruolo anon.
-- =====================================================================

create or replace function public.check_registration_sold_out()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chiave   text;
  v_opt      public.event_options%rowtype;
  v_iscritti int;
  v_keys     text[];
begin
  -- Raccogli tutte le chiavi scelte: battle_categories + workshop.
  v_keys := coalesce(NEW.battle_categories, '{}'::text[]);
  if NEW.workshop is not null and length(trim(NEW.workshop)) > 0 then
    v_keys := array_append(v_keys, NEW.workshop);
  end if;

  foreach v_chiave in array v_keys loop
    -- Lock della riga opzione: serializza le iscrizioni in contemporanea.
    select * into v_opt
    from public.event_options
    where chiave = v_chiave
    for update;

    -- Chiave non presente a catalogo: nessun limite da applicare.
    if not found then
      continue;
    end if;

    -- Conteggio DOPO aver acquisito il lock (vede le iscrizioni committate).
    v_iscritti := public.conta_iscritti_opzione(v_opt.chiave, v_opt.tipo);

    if v_opt.sold_out_manuale
       or (v_opt.max_posti is not null and v_iscritti >= v_opt.max_posti) then
      raise exception 'Iscrizione rifiutata: l''opzione "%" (%) e'' esaurita.',
        v_opt.label, v_opt.chiave
        using errcode = 'check_violation';
    end if;
  end loop;

  return NEW;
end;
$$;

create trigger trg_registrations_sold_out
  before insert on public.registrations
  for each row
  execute function public.check_registration_sold_out();


-- =====================================================================
--  7. SUPABASE STORAGE: bucket privato "assets" per il timbro
--
--  In alternativa alla dashboard (Storage -> New bucket -> "assets",
--  Public = OFF), puoi crearlo via SQL come qui sotto.
-- =====================================================================

-- Crea il bucket privato.
insert into storage.buckets (id, name, public)
values ('assets', 'assets', false)
on conflict (id) do nothing;

-- Policy: solo utenti authenticated possono leggere/caricare/aggiornare/eliminare
-- gli oggetti del bucket 'assets'. Essendo privato, per mostrare il timbro
-- (es. nella ricevuta) genera una Signed URL lato server.
create policy "assets_select_authenticated"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'assets');

create policy "assets_insert_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'assets');

create policy "assets_update_authenticated"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'assets')
  with check (bucket_id = 'assets');

create policy "assets_delete_authenticated"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'assets');

-- =====================================================================
--  FINE
-- =====================================================================
