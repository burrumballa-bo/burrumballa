-- =====================================================================
--  PIU' EVENTI
--
--  event_info smette di essere una riga unica: ogni riga e' un evento con
--  la stessa struttura di "Senti Come Suona" (workshop e/o battle, posti
--  limitati, bonifico o pagamento sul posto) e una pagina pubblica dal
--  modello unico /eventi/<slug>. L'evento esistente (id = 1) diventa il
--  primo evento, con slug 'senti-come-suona' (stesso indirizzo di oggi).
--
--  Ogni evento ha:
--   - slug, citta', due colori (primario e secondario), immagini di
--     copertina / cornice / logo (path nel bucket privato "assets");
--   - pubblicato (visibile sul sito) e iscrizioni_aperte;
--   - le regole di prezzo che prima erano nel codice: prezzi della battle
--     per numero di categorie, maggiorazione dopo la scadenza e per il
--     pagamento sul posto.
--
--  event_options, registrations, event_people e si_balla_ordinamenti
--  ricevono event_id. Il default 1 resta solo per compatibilita' con il
--  codice gia' online durante il rilascio: il nuovo codice lo passa sempre.
--  Le chiavi delle opzioni diventano uniche per evento, non piu' globali.
--
--  Corregge anche la policy di INSERT mancante su event_options (la
--  creazione di nuove opzioni dall'admin veniva rifiutata dalla RLS).
-- =====================================================================

-- ---- 1. event_info: piu' righe ------------------------------------------
alter table public.event_info drop constraint if exists event_info_single_row;

create sequence if not exists public.event_info_id_seq owned by public.event_info.id;
select setval('public.event_info_id_seq', (select coalesce(max(id), 1) from public.event_info));
alter table public.event_info alter column id set default nextval('public.event_info_id_seq');
grant usage on sequence public.event_info_id_seq to authenticated;

alter table public.event_info
  add column if not exists slug text,
  add column if not exists citta text,
  add column if not exists colore_primario text not null default '#f5d90a',
  add column if not exists colore_secondario text not null default '#a855f7',
  add column if not exists immagine_copertina text,
  add column if not exists immagine_cornice text,
  add column if not exists immagine_logo text,
  add column if not exists pubblicato boolean not null default false,
  add column if not exists iscrizioni_aperte boolean not null default true,
  add column if not exists battle_prezzi numeric(6,2)[] not null default '{15,20,25,30}',
  add column if not exists maggiorazione_ritardo numeric(6,2) not null default 5,
  add column if not exists maggiorazione_sul_posto numeric(6,2) not null default 5,
  add column if not exists created_at timestamptz not null default now();

-- L'evento attuale: stessi file e stessa citta' che la pagina usava fissi.
update public.event_info
set slug = 'senti-come-suona',
    citta = 'Bologna · Italy',
    immagine_copertina = 'senti_come_suona/sfondo_crew.jpeg',
    immagine_cornice = 'senti_come_suona/sfondo_tribale.jpg',
    immagine_logo = 'senti_come_suona/senti_come_suona_logo.png',
    pubblicato = true
where id = 1 and slug is null;

alter table public.event_info alter column slug set not null;
alter table public.event_info drop constraint if exists event_info_slug_key;
alter table public.event_info add constraint event_info_slug_key unique (slug);
alter table public.event_info drop constraint if exists event_info_slug_format;
alter table public.event_info
  add constraint event_info_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
alter table public.event_info drop constraint if exists event_info_battle_prezzi_check;
alter table public.event_info
  add constraint event_info_battle_prezzi_check
  check (array_length(battle_prezzi, 1) between 1 and 10 and 0 <= all (battle_prezzi));

-- Sul sito si vedono solo gli eventi pubblicati.
drop policy if exists "event_info_select_anon" on public.event_info;
create policy "event_info_select_anon"
  on public.event_info for select to anon using (pubblicato);

drop policy if exists "event_info_insert_authenticated" on public.event_info;
create policy "event_info_insert_authenticated"
  on public.event_info for insert to authenticated with check (true);

drop policy if exists "event_info_delete_authenticated" on public.event_info;
create policy "event_info_delete_authenticated"
  on public.event_info for delete to authenticated using (true);

-- ---- 2. event_id sulle tabelle dell'evento -------------------------------
alter table public.event_options
  add column if not exists event_id integer not null default 1
    references public.event_info(id) on delete cascade,
  add column if not exists richiede_partner boolean not null default false;

-- La categoria 2vs2 chiedeva il nome del partner tramite una chiave fissa
-- nel codice: ora e' un'impostazione dell'opzione.
update public.event_options set richiede_partner = true
where chiave = 'hiphop_2vs2_open' and richiede_partner = false;

alter table public.event_options drop constraint if exists event_options_chiave_key;
alter table public.event_options drop constraint if exists event_options_event_chiave_key;
alter table public.event_options
  add constraint event_options_event_chiave_key unique (event_id, chiave);
create index if not exists idx_event_options_event on public.event_options(event_id);

drop policy if exists "event_options_insert_authenticated" on public.event_options;
create policy "event_options_insert_authenticated"
  on public.event_options for insert to authenticated with check (true);

-- Un evento eliminato non puo' avere iscrizioni: si archivia (pubblicato = false).
alter table public.registrations
  add column if not exists event_id integer not null default 1
    references public.event_info(id) on delete restrict;
create index if not exists idx_registrations_event on public.registrations(event_id);

alter table public.event_people
  add column if not exists event_id integer not null default 1
    references public.event_info(id) on delete cascade;
create index if not exists idx_event_people_event on public.event_people(event_id);

alter table public.si_balla_ordinamenti
  add column if not exists event_id integer not null default 1
    references public.event_info(id) on delete cascade;
alter table public.si_balla_ordinamenti drop constraint if exists si_balla_ordinamenti_pkey;
alter table public.si_balla_ordinamenti add primary key (event_id, sezione);

-- ---- 3. Iscrizioni pubbliche solo a eventi pubblicati e aperti ----------
drop policy if exists "registrations_insert_anon" on public.registrations;
create policy "registrations_insert_anon"
  on public.registrations
  for insert
  to anon
  with check (
    payment_status = 'da_pagare'
    and note_admin is null
    and email_conferma_bonifico_inviata_at is null
    and prezzo_admin is null
    and exists (
      select 1 from public.event_info e
      where e.id = registrations.event_id and e.pubblicato and e.iscrizioni_aperte
    )
  );

-- ---- 4. Conteggi e sold out per evento -----------------------------------
create or replace function public.conta_iscritti_opzione(p_event_id integer, p_chiave text, p_tipo text)
returns integer
language sql
stable
security definer
set search_path to 'public'
as $$
  select count(*)::int
  from public.registrations r
  where r.deleted_at is null
    and r.event_id = p_event_id
    and (
      (p_tipo = 'battle' and p_chiave = any(r.battle_categories))
      or (p_tipo = 'workshop' and (
        r.workshop = p_chiave
        or r.workshop in (
          select po.chiave
          from public.event_option_components c
          join public.event_options po on po.id = c.parent_id
          join public.event_options ch on ch.id = c.child_id
          where ch.chiave = p_chiave
            and ch.event_id = p_event_id
            and po.event_id = p_event_id
        )
      ))
    );
$$;

create or replace view public.event_options_stato as
select o.id,
    o.tipo,
    o.chiave,
    o.label,
    o.prezzo,
    o.max_posti,
    o.sold_out_manuale,
    o.attivo,
    o.ordine,
    c.iscritti,
    o.sold_out_manuale or o.max_posti is not null and c.iscritti >= o.max_posti
      or coalesce(comp.componenti_esauriti, false) as sold_out,
    o.composto,
    o.deleted_at,
    coalesce(comp.child_chiavi, '{}'::text[]) as composto_di,
    o.event_id,
    o.richiede_partner
from public.event_options o
  cross join lateral (
    select public.conta_iscritti_opzione(o.event_id, o.chiave, o.tipo) as iscritti
  ) c
  left join lateral (
    select array_agg(ch.chiave order by ch.ordine) as child_chiavi,
      bool_or(ch.sold_out_manuale or ch.max_posti is not null
        and public.conta_iscritti_opzione(ch.event_id, ch.chiave, ch.tipo) >= ch.max_posti)
        as componenti_esauriti
    from public.event_option_components ec
      join public.event_options ch on ch.id = ec.child_id
    where ec.parent_id = o.id
  ) comp on true
where o.deleted_at is null;

drop function if exists public.conta_iscritti_opzione(text, text);

create or replace function public.check_registration_sold_out()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_chiave   text;
  v_opt      public.event_options%rowtype;
  v_iscritti int;
  v_keys     text[];
  v_child    text;
begin
  -- Raccogli tutte le chiavi scelte: battle_categories + workshop.
  v_keys := coalesce(NEW.battle_categories, '{}'::text[]);
  if NEW.workshop is not null and length(trim(NEW.workshop)) > 0 then
    v_keys := array_append(v_keys, NEW.workshop);

    -- Workshop composto: occupa anche un posto in ciascun componente.
    for v_child in
      select ch.chiave
      from public.event_options po
      join public.event_option_components ec on ec.parent_id = po.id
      join public.event_options ch on ch.id = ec.child_id
      where po.event_id = NEW.event_id and po.chiave = NEW.workshop and po.composto = true
    loop
      v_keys := array_append(v_keys, v_child);
    end loop;
  end if;

  foreach v_chiave in array v_keys loop
    -- Lock della riga opzione: serializza le iscrizioni in contemporanea.
    select * into v_opt
    from public.event_options
    where event_id = NEW.event_id and chiave = v_chiave
    for update;

    -- Chiave non presente a catalogo: nessun limite da applicare.
    if not found then
      continue;
    end if;

    -- Conteggio DOPO aver acquisito il lock (vede le iscrizioni committate).
    v_iscritti := public.conta_iscritti_opzione(NEW.event_id, v_opt.chiave, v_opt.tipo);

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

-- Un workshop composto puo' contenere solo workshop dello stesso evento.
create or replace function public.check_event_option_component()
returns trigger
language plpgsql
as $$
declare
  v_parent public.event_options%rowtype;
  v_child  public.event_options%rowtype;
begin
  select * into v_parent from public.event_options where id = NEW.parent_id;
  select * into v_child  from public.event_options where id = NEW.child_id;

  if v_parent.tipo is distinct from 'workshop' or v_parent.composto is not true then
    raise exception 'Il genitore di una composizione workshop deve essere un''opzione workshop con composto = true.';
  end if;

  if v_child.tipo is distinct from 'workshop' or v_child.composto is true then
    raise exception 'I componenti di un workshop composto devono essere opzioni workshop non composte.';
  end if;

  if v_parent.event_id is distinct from v_child.event_id then
    raise exception 'I componenti di un workshop composto devono appartenere allo stesso evento.';
  end if;

  return NEW;
end;
$$;

-- ---- 5. Immagini degli eventi nuovi: assets/eventi/<id>/... --------------
-- Leggibili da anon solo tramite signed URL, come 'senti_come_suona/'.
drop policy if exists "assets_select_anon_eventi" on storage.objects;
create policy "assets_select_anon_eventi"
  on storage.objects for select to anon
  using (bucket_id = 'assets' and (storage.foldername(name))[1] = 'eventi');
