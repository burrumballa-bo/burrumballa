-- =====================================================================
--  HARDENING: registrations.insert (ruolo anon)
--
--  Problema: la policy "registrations_insert_anon" originale aveva
--  with check (true), quindi chiunque chiami direttamente l'endpoint
--  REST pubblico di Supabase (bypassando il form) potrebbe inserire
--  una registrazione con:
--    - payment_status = 'pagato_bonifico' / 'pagato_in_loco' (finto pagato)
--    - note_admin / email_conferma_bonifico_inviata_at valorizzati
--      (campi ad uso esclusivo dell'admin)
--    - amount_workshop / amount_battle / amount_total a piacere,
--      es. 0 anche selezionando opzioni a pagamento
--
--  Fix:
--    1) la policy anon accetta solo payment_status = 'da_pagare' e
--       campi ad uso admin nulli;
--    2) un trigger BEFORE INSERT ricalcola SEMPRE amount_workshop,
--       amount_battle e amount_total leggendo i prezzi reali da
--       event_options, ignorando i valori eventualmente inviati dal
--       client; i sovrapprezzi (ritardo / pagamento in loco) partono
--       sempre da 0 e restano una decisione dell'admin via UPDATE
--       successiva (RLS: update solo authenticated).
-- =====================================================================


-- ---- 1. Policy insert anon piu' restrittiva -------------------------

drop policy if exists "registrations_insert_anon" on public.registrations;

create policy "registrations_insert_anon"
  on public.registrations
  for insert
  to anon
  with check (
    payment_status = 'da_pagare'
    and note_admin is null
    and email_conferma_bonifico_inviata_at is null
  );


-- ---- 2. Calcolo server-side degli importi ---------------------------

create or replace function public.compute_registration_amounts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount_workshop numeric(6,2) := 0;
  v_amount_battle   numeric(6,2) := 0;
  v_chiave          text;
  v_prezzo          numeric(6,2);
begin
  if NEW.workshop is not null and length(trim(NEW.workshop)) > 0 then
    select prezzo into v_prezzo
    from public.event_options
    where chiave = NEW.workshop and tipo = 'workshop';

    if found then
      v_amount_workshop := v_prezzo;
    end if;
  end if;

  foreach v_chiave in array coalesce(NEW.battle_categories, '{}'::text[]) loop
    select prezzo into v_prezzo
    from public.event_options
    where chiave = v_chiave and tipo = 'battle';

    if found then
      v_amount_battle := v_amount_battle + v_prezzo;
    end if;
  end loop;

  NEW.amount_workshop := v_amount_workshop;
  NEW.amount_battle   := v_amount_battle;

  -- I sovrapprezzi sono decisioni amministrative: mai al momento
  -- dell'iscrizione pubblica, l'admin li applica dopo con una UPDATE.
  NEW.surcharge_late   := 0;
  NEW.surcharge_onsite := 0;

  NEW.amount_total := v_amount_workshop + v_amount_battle;

  return NEW;
end;
$$;

-- BEFORE INSERT: gira insieme a trg_registrations_sold_out (ordine
-- alfabetico dei nomi trigger su Postgres -> "compute_amounts" prima di
-- "sold_out"; comunque i due trigger operano su colonne indipendenti).
create trigger trg_registrations_compute_amounts
  before insert on public.registrations
  for each row
  execute function public.compute_registration_amounts();
