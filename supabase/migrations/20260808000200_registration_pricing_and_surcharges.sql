-- =====================================================================
--  PREZZI E SOVRAPPREZZI SERVER-SIDE (workshop, battle, ritardo, sul posto)
--
--  La versione precedente di compute_registration_amounts() (vedi
--  20260808000100_registrations_insert_hardening.sql) calcolava solo
--  amount_workshop/amount_battle sommando i prezzi delle singole opzioni,
--  e azzerava sempre surcharge_late/surcharge_onsite (demandati a una
--  UPDATE manuale dell'admin).
--
--  Il form pubblico mostra pero' un totale in tempo reale che include
--  gia' i sovrapprezzi di ritardo/pagamento sul posto e la tariffa a
--  scaglioni della battle (1/2/3 categorie = 15/20/25€, non la somma dei
--  prezzi delle singole categorie). Per coerenza tra quanto mostrato e
--  quanto salvato -- e per non fidarsi di importi mandati dal client --
--  ricalcoliamo tutto qui, lato server, con la stessa regola.
-- =====================================================================

create or replace function public.compute_registration_amounts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount_workshop  numeric(6,2) := 0;
  v_amount_battle    numeric(6,2) := 0;
  v_surcharge_late   numeric(6,2) := 0;
  v_surcharge_onsite numeric(6,2) := 0;
  v_prezzo           numeric(6,2);
  v_battle_count     int;
  v_deadline         constant timestamptz := '2025-09-21 23:59:59+02';
  v_is_late          boolean;
begin
  -- Workshop: prezzo dell'opzione scelta (letto da event_options).
  if NEW.workshop is not null and length(trim(NEW.workshop)) > 0 then
    select prezzo into v_prezzo
    from public.event_options
    where chiave = NEW.workshop and tipo = 'workshop';

    if found then
      v_amount_workshop := v_prezzo;
    end if;
  end if;

  -- Battle: tariffa a scaglioni in base al NUMERO di categorie scelte,
  -- non alla somma dei prezzi delle singole categorie.
  v_battle_count := coalesce(array_length(NEW.battle_categories, 1), 0);
  v_amount_battle := case
    when v_battle_count <= 0 then 0
    when v_battle_count = 1 then 15
    when v_battle_count = 2 then 20
    else 25
  end;

  -- Sovrapprezzo ritardo: +5€ su workshop e +5€ su battle se l'iscrizione
  -- arriva dopo la scadenza, per ciascuna delle due componenti scelte.
  v_is_late := now() > v_deadline;
  v_surcharge_late :=
    (case when v_is_late and v_amount_workshop > 0 then 5 else 0 end) +
    (case when v_is_late and v_amount_battle > 0 then 5 else 0 end);

  -- Sovrapprezzo pagamento sul posto: +5€ flat se c'e' un importo da pagare.
  v_surcharge_onsite := case
    when NEW.payment_method = 'sul_posto'
     and (v_amount_workshop + v_amount_battle) > 0
    then 5
    else 0
  end;

  NEW.amount_workshop  := v_amount_workshop;
  NEW.amount_battle    := v_amount_battle;
  NEW.surcharge_late   := v_surcharge_late;
  NEW.surcharge_onsite := v_surcharge_onsite;
  NEW.amount_total :=
    v_amount_workshop + v_amount_battle + v_surcharge_late + v_surcharge_onsite;

  return NEW;
end;
$$;

-- Il trigger trg_registrations_compute_amounts esiste gia' e punta a
-- questa funzione per nome: nessuna modifica al trigger necessaria.
