-- =====================================================================
--  LOGO HEADER: scelta tra logo_black.png e logo_white.png, gia'
--  caricati a mano nel bucket privato "assets", da usare nell'header del
--  sito pubblico.
--
--  - site_pages.content->'theme' guadagna "headerLogo" ('black' | 'white'),
--    gestito da /admin/contenuti/impostazioni-generali.
--  - il bucket "assets" resta privato di default (solo authenticated puo'
--    leggere/scrivere): questa policy apre la SELECT anonima ai soli due
--    file del logo header, cosi' il sito pubblico puo' generare una
--    signed URL server-side senza esporre il resto del bucket (stesso
--    pattern gia' in uso per la cartella 'senti_come_suona/').
-- =====================================================================

update public.site_pages
set content = content || jsonb_build_object('headerLogo', 'black')
where id = 'theme'
  and not (content ? 'headerLogo');

create policy "assets_select_anon_header_logo"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'assets' and name in ('logo_black.png', 'logo_white.png'));
