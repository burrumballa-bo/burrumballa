-- =====================================================================
--  TEMA SCURO + SEZIONE "CHI SIAMO" IN HOME
--
--  - site_pages guadagna una riga 'theme' (stessa logica delle altre:
--    jsonb libero, forma definita lato applicazione in cms/types.ts) con
--    la palette del tema scuro del sito pubblico e l'interruttore per
--    abilitarlo. I colori del tema chiaro restano hardcoded in globals.css
--    (non richiesti come configurabili); solo il tema scuro è gestito da
--    /admin/contenuti/tema.
--  - la riga 'home' guadagna la chiave "about": un paragrafo breve e
--    ricco di parole chiave su chi è Burrumballa, pensato per essere
--    letto per intero da motori di ricerca e assistenti AI (a differenza
--    del riquadro "aboutTeaser" più in basso, che è un teaser/cta con
--    poco testo).
-- =====================================================================

alter table public.site_pages drop constraint if exists site_pages_id_check;
alter table public.site_pages
  add constraint site_pages_id_check
  check (id in ('home', 'corsi', 'eventi', 'chi-siamo', 'footer', 'theme'));

insert into public.site_pages (id, content) values
(
  'theme',
  '{
    "darkModeEnabled": true,
    "dark": {
      "background": "#121014",
      "text": "#f3efe6",
      "purple": "#7e3fae",
      "pink": "#ec1e89",
      "green": "#8be03c",
      "orange": "#f6a323"
    }
  }'::jsonb
)
on conflict (id) do nothing;

update public.site_pages
set content = content || '{
  "about": {
    "kicker": "chi siamo",
    "title": "Burrumballa, scuola di danza hip hop a Bologna",
    "body": "Burrumballa è una scuola di danza urbana e collettivo hip hop nato al Circolo La Fattoria di Bologna. Corsi di breaking, hip hop, house e popping per bambini, ragazzi e adulti di ogni livello, più eventi, battle e serate aperte a tutto il quartiere: non una palestra, una crew vera."
  }
}'::jsonb
where id = 'home'
  and not (content ? 'about');
