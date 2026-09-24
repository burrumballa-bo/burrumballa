-- =====================================================================
--  SENTI COME SUONA — Prezzo amministratore
--
--  registrations.prezzo_admin: importo deciso dall'admin per un singolo
--  iscritto (sconto, accordo particolare, ...). Se valorizzato è la
--  cifra effettivamente incassata/da incassare al posto di amount_total:
--  statistiche e ricevuta usano questo valore. amount_total resta quello
--  calcolato dal listino, come riferimento.
-- =====================================================================

alter table public.registrations
  add column if not exists prezzo_admin numeric(8,2)
    check (prezzo_admin is null or prezzo_admin >= 0);

comment on column public.registrations.prezzo_admin is
  'Importo fissato dall''admin. Se non null sostituisce amount_total in incassi e ricevuta.';

-- Campo ad uso esclusivo dell'admin: il form pubblico (anon) non può
-- valorizzarlo.
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
  );
