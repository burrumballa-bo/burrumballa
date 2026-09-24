-- =====================================================================
--  SENTI COME SUONA — Iscrizioni inserite dall'admin
--
--  Il bottone "Nuovo iscritto" nella pagina Iscritti della dashboard
--  inserisce righe in registrations come utente autenticato: finora
--  authenticated aveva solo select/update. L'admin può impostare
--  liberamente stato pagamento, prezzo amministratore e note.
--
--  I trigger BEFORE INSERT restano attivi anche per l'admin (controllo
--  posti esauriti e calcolo importi).
-- =====================================================================

grant insert on public.registrations to authenticated;

drop policy if exists "registrations_insert_authenticated" on public.registrations;

create policy "registrations_insert_authenticated"
  on public.registrations
  for insert
  to authenticated
  with check (true);
