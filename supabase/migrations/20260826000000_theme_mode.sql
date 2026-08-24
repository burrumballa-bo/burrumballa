-- =====================================================================
--  TEMA: da "interruttore che abilita lo switch utente" a scelta fissa
--  dell'admin.
--
--  Prima: site_pages.content->'theme' aveva "darkModeEnabled" (bool) che
--  mostrava o nascondeva un pulsante nella nav con cui il VISITATORE
--  sceglieva chiaro/scuro (salvato in localStorage lato browser).
--
--  Ora: l'admin decide direttamente il tema dell'intero sito con
--  "mode" ('light' | 'dark'), niente più scelta lato utente. Si
--  rinomina il campo mantenendo il sito in tema chiaro (comportamento
--  visivo di fatto invariato per la stragrande maggioranza dei
--  visitatori, che vedevano il chiaro di default).
-- =====================================================================

update public.site_pages
set content = (content - 'darkModeEnabled') || jsonb_build_object('mode', 'light')
where id = 'theme'
  and not (content ? 'mode');
