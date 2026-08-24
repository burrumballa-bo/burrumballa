-- =====================================================================
--  FIX: manca la policy/grant di INSERT su site_pages.
--
--  useUpdateSitePage (admin) salva con `upsert(..., { onConflict: "id" })`,
--  cioe' un `INSERT ... ON CONFLICT DO UPDATE`: anche se la riga esiste
--  gia' ed e' l'UPDATE a scattare, Postgres valuta comunque le policy RLS
--  di INSERT sulla riga proposta (e' cosi' che funziona ON CONFLICT DO
--  UPDATE con RLS abilitata). La migrazione 20260817000000 aveva concesso
--  solo SELECT/UPDATE a "authenticated", quindi ogni salvataggio dal CMS
--  falliva con 42501 ("new row violates row-level security policy").
-- =====================================================================

grant insert on public.site_pages to authenticated;

create policy "site_pages_insert_authenticated"
  on public.site_pages for insert to authenticated with check (true);
