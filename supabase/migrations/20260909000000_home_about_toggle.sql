-- =====================================================================
--  SEZIONE "CHI SIAMO" (SEO) IN HOME: INTERRUTTORE, VIA IL KICKER
--
--  La chiave "about" della riga 'home' (vedi
--  20260823000000_theme_and_home_about.sql) cambia forma:
--   - guadagna "enabled", l'interruttore mostra/nascondi gestito da
--     /admin/contenuti/home: a false il blocco sparisce dalla home;
--   - perde "kicker", che il blocco non ha mai renderizzato.
--
--  Come per le altre migration del CMS lo schema non cambia: la forma del
--  jsonb è definita lato applicazione (burrumballa-web/src/lib/cms/types.ts)
--  e i default applicativi coprono comunque una riga senza la chiave.
--  L'update è idempotente: aggiunge "enabled" solo dove manca (senza
--  spegnere una sezione già disattivata a mano) e toglie "kicker" sempre.
-- =====================================================================

update public.site_pages
set content = jsonb_set(
  content,
  '{about}',
  (content -> 'about')
    - 'kicker'
    || case
         when (content -> 'about') ? 'enabled' then '{}'::jsonb
         else '{"enabled": true}'::jsonb
       end
)
where id = 'home'
  and content ? 'about'
  and ((content -> 'about') ? 'kicker' or not ((content -> 'about') ? 'enabled'));
