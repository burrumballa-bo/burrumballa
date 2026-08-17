-- =====================================================================
--  SITE CMS — contenuti editoriali del sito pubblico (Home, Corsi,
--  Eventi, Chi Siamo, Footer), gestibili da /admin/contenuti.
--
--  - site_pages: un blocco di testi/immagini per pagina (jsonb), righe
--    fisse identificate da slug ('home', 'corsi', 'eventi', 'chi-siamo',
--    'footer'). La forma del jsonb e' definita lato applicazione
--    (burrumballa-web/src/lib/cms/types.ts).
--  - courses / course_levels: le discipline dei corsi con i relativi
--    orari, fonte unica sia per la pagina Corsi che per il calendario
--    di Home.
--  - events: schede editoriali mostrate in Home/Eventi. Resta separato
--    dalla pagina di iscrizione dedicata di "Senti Come Suona" (che ha
--    il proprio event_info/registrations): qui c'e' solo il contenuto
--    di presentazione, con un cta_url opzionale che puo' puntare alla
--    pagina di iscrizione quando esiste.
--  - crew_groups: le card della sezione "La crew" in Chi Siamo.
--  - bucket storage pubblico "site-media" per immagini/gif/video
--    caricati dal CMS (distinto dal bucket privato "assets").
-- =====================================================================

-- ---- site_pages -------------------------------------------------------
create table public.site_pages (
  id          text primary key
              check (id in ('home', 'corsi', 'eventi', 'chi-siamo', 'footer')),
  content     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create trigger trg_site_pages_updated_at
  before update on public.site_pages
  for each row execute function public.set_updated_at();

alter table public.site_pages enable row level security;

grant select on public.site_pages to anon, authenticated;
grant update on public.site_pages to authenticated;

create policy "site_pages_select_anon"
  on public.site_pages for select to anon using (true);

create policy "site_pages_select_authenticated"
  on public.site_pages for select to authenticated using (true);

create policy "site_pages_update_authenticated"
  on public.site_pages for update to authenticated using (true) with check (true);

-- ---- courses ------------------------------------------------------------
create table public.courses (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  color         text not null default '#7E3FAE',
  body          text,
  teachers      text,
  image_url     text,
  order_index   int not null default 0,
  published     boolean not null default true,
  updated_at    timestamptz not null default now()
);

create trigger trg_courses_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

alter table public.courses enable row level security;

grant select on public.courses to anon, authenticated;
grant insert, update, delete on public.courses to authenticated;

create policy "courses_select_anon"
  on public.courses for select to anon using (published);

create policy "courses_select_authenticated"
  on public.courses for select to authenticated using (true);

create policy "courses_insert_authenticated"
  on public.courses for insert to authenticated with check (true);

create policy "courses_update_authenticated"
  on public.courses for update to authenticated using (true) with check (true);

create policy "courses_delete_authenticated"
  on public.courses for delete to authenticated using (true);

-- ---- course_levels --------------------------------------------------------
-- Un corso ha piu' livelli (Base/Intermedio/Avanzato/Kids...), ciascuno con
-- un proprio giorno/orario settimanale. day_of_week segue la convenzione di
-- Date.prototype.getDay() in JS: 0 = domenica ... 6 = sabato.
create table public.course_levels (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.courses(id) on delete cascade,
  level         text not null,
  day_of_week   smallint not null check (day_of_week between 0 and 6),
  time          text not null,
  order_index   int not null default 0,
  updated_at    timestamptz not null default now()
);

create index idx_course_levels_course_id on public.course_levels(course_id);

create trigger trg_course_levels_updated_at
  before update on public.course_levels
  for each row execute function public.set_updated_at();

alter table public.course_levels enable row level security;

grant select on public.course_levels to anon, authenticated;
grant insert, update, delete on public.course_levels to authenticated;

create policy "course_levels_select_anon"
  on public.course_levels for select to anon using (true);

create policy "course_levels_select_authenticated"
  on public.course_levels for select to authenticated using (true);

create policy "course_levels_insert_authenticated"
  on public.course_levels for insert to authenticated with check (true);

create policy "course_levels_update_authenticated"
  on public.course_levels for update to authenticated using (true) with check (true);

create policy "course_levels_delete_authenticated"
  on public.course_levels for delete to authenticated using (true);

-- ---- events ---------------------------------------------------------------
-- event_date/event_end_date sono opzionali e servono solo a piazzare
-- l'evento nel calendario "cosa succede" di Home (finestra di 14 giorni).
-- subtitle/event_time/note restano testo libero perche' molti eventi sono
-- ricorrenti ("Venerdi dalle 18:30") e non hanno una data singola sensata.
create table public.events (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title              text not null,
  subtitle           text,
  body               text,
  image_url          text,
  tags               text[] not null default '{}',
  event_date         date,
  event_end_date     date,
  event_time         text,
  note               text,
  color              text not null default '#7E3FAE',
  featured           boolean not null default false,
  show_in_calendar   boolean not null default true,
  cta_label          text,
  cta_url            text,
  order_index        int not null default 0,
  published          boolean not null default true,
  updated_at         timestamptz not null default now()
);

create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;

create policy "events_select_anon"
  on public.events for select to anon using (published);

create policy "events_select_authenticated"
  on public.events for select to authenticated using (true);

create policy "events_insert_authenticated"
  on public.events for insert to authenticated with check (true);

create policy "events_update_authenticated"
  on public.events for update to authenticated using (true) with check (true);

create policy "events_delete_authenticated"
  on public.events for delete to authenticated using (true);

-- ---- crew_groups ------------------------------------------------------------
create table public.crew_groups (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text,
  image_url     text,
  order_index   int not null default 0,
  published     boolean not null default true,
  updated_at    timestamptz not null default now()
);

create trigger trg_crew_groups_updated_at
  before update on public.crew_groups
  for each row execute function public.set_updated_at();

alter table public.crew_groups enable row level security;

grant select on public.crew_groups to anon, authenticated;
grant insert, update, delete on public.crew_groups to authenticated;

create policy "crew_groups_select_anon"
  on public.crew_groups for select to anon using (published);

create policy "crew_groups_select_authenticated"
  on public.crew_groups for select to authenticated using (true);

create policy "crew_groups_insert_authenticated"
  on public.crew_groups for insert to authenticated with check (true);

create policy "crew_groups_update_authenticated"
  on public.crew_groups for update to authenticated using (true) with check (true);

create policy "crew_groups_delete_authenticated"
  on public.crew_groups for delete to authenticated using (true);

-- =====================================================================
--  SUPABASE STORAGE: bucket pubblico "site-media"
--
--  Immagini/gif/video caricati dal CMS per il sito pubblico. A differenza
--  del bucket privato "assets" (timbro ricevute, foto giuria evento), qui
--  il contenuto e' pubblicitario/editoriale e non sensibile: il bucket e'
--  pubblico cosi' il sito puo' usare direttamente l'URL pubblico, senza
--  passare da signed URL.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

create policy "site_media_select_public"
  on storage.objects for select
  using (bucket_id = 'site-media');

create policy "site_media_insert_authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media');

create policy "site_media_update_authenticated"
  on storage.objects for update to authenticated
  using (bucket_id = 'site-media')
  with check (bucket_id = 'site-media');

create policy "site_media_delete_authenticated"
  on storage.objects for delete to authenticated
  using (bucket_id = 'site-media');

-- =====================================================================
--  SEED — contenuti di default (copy allineata al mockup di design).
--  Le immagini restano vuote: si caricano da /admin/contenuti dopo il
--  deploy, il sito pubblico mostra un placeholder finche' non sono
--  impostate.
-- =====================================================================

insert into public.site_pages (id, content) values
(
  'home',
  '{
    "hero": {
      "kicker": "scuola di danza urbana · bologna",
      "titleLine1": "L''HIP HOP",
      "titleLine2": "NON È SPORT.",
      "titleLine3": "È CASA.",
      "subtitle": "Breaking, hip hop, house e popping. Dal principiante all''avanzato, in una crew vera al Circolo La Fattoria.",
      "badgeText": "EST. BOLOGNA",
      "imageUrl": null
    },
    "marquee": { "text": "ISCRIZIONI APERTE ✦ OPEN CLASS ✦ BATTLE NIGHT ✦ APERICREATIVO ✦ FREEDAY TRAINING ✦ " },
    "calendar": { "kicker": "il programma", "title": "Cosa succede", "subLabel": "Lezioni ed eventi" },
    "corsiSection": { "kicker": "quattro discipline, tutti i livelli", "title": "I corsi" },
    "eventsSection": { "kicker": "non solo lezioni", "title": "Eventi" },
    "aboutTeaser": {
      "kicker": "chi siamo",
      "title": "Una scuola che è anche casa.",
      "body": "Burrumballa nasce a Bologna come scuola e collettivo hip hop. Insegnanti che vengono dalla scena, una community che balla, organizza eventi e si prende cura del quartiere.",
      "imageUrl": null
    },
    "ctaBand": { "title": "Entra nella crew.", "subtitle": "Prima lezione di prova gratuita. Tessera ARCI obbligatoria." }
  }'::jsonb
),
(
  'corsi',
  '{
    "hero": {
      "kicker": "quattro discipline · tutti i livelli",
      "title": "I corsi",
      "subtitle": "Breaking, hip hop, house e popping. Lezioni settimanali al Circolo La Fattoria, dal principiante all''avanzato. Scegli la tua disciplina e il tuo livello."
    },
    "calendar": {
      "kicker": "orari settimanali",
      "title": "Il settimanale",
      "subtitle": "Le lezioni dei corsi, lun–dom. Gli eventi li trovi nella pagina Eventi."
    },
    "join": {
      "kicker": "pronti?",
      "title": "Iscriviti a un corso",
      "body": "Prima lezione di prova gratuita. Scrivici su Instagram o passa al Circolo per fissare il tuo posto. Tessera ARCI obbligatoria.",
      "ctaLabel": "Prenota la prova",
      "note": "o scrivi a @burrumballa"
    }
  }'::jsonb
),
(
  'eventi',
  '{
    "hero": {
      "kicker": "battle, party, workshop & community",
      "title": "Eventi",
      "subtitle": "La scuola è anche un collettivo: battle, spettacoli, open class e serate aperte a tutto il quartiere. Tessera ARCI obbligatoria."
    },
    "ctaBand": { "title": "Vieni a ballare con noi.", "subtitle": "Iscriviti a un corso o passa a un evento. La porta è aperta." }
  }'::jsonb
),
(
  'chi-siamo',
  '{
    "hero": {
      "kicker": "chi siamo",
      "title": "Non una scuola e basta. Una casa dove l''hip hop si vive.",
      "subtitle": "Burrumballa è una scuola di danza urbana e un collettivo nato a Bologna, al Circolo La Fattoria. Crediamo che ballare sia un modo di stare insieme, prendersi cura del quartiere e dare spazio ai giovani."
    },
    "story": {
      "title": "Come è nata",
      "paragraph1": "Tutto parte da un gruppo di ballerini e ballerine che volevano un posto vero dove allenarsi, condividere e crescere. Non una palestra, ma una crew: con i suoi insegnanti, i suoi eventi, la sua musica alta a porte aperte.",
      "paragraph2": "Oggi Burrumballa porta avanti corsi per tutti i livelli, battle, open class e serate aperte a tutto il quartiere — sempre con lo stesso spirito: energia, passione e divertimento.",
      "imageUrl": null
    },
    "valori": {
      "kicker": "in cosa crediamo",
      "title": "I nostri valori",
      "items": [
        { "title": "CULTURA", "body": "L''hip hop è una cultura, non solo passi. Foundation, storia e rispetto vengono prima di tutto." },
        { "title": "COMMUNITY", "body": "Qui nessuno balla da solo. La crew si sostiene, dentro e fuori dalla sala." },
        { "title": "QUARTIERE", "body": "Diamo spazio ai giovani del quartiere. La porta è sempre aperta." },
        { "title": "DIVERTIMENTO", "body": "Si fa sul serio, ma ci si diverte. Lo dicono anche i nostri insegnanti." }
      ]
    },
    "crew": {
      "kicker": "questi chi sono?",
      "title": "La crew",
      "subtitle": "Insegnanti che vengono dalla scena, ognuno con il suo stile. Energia, passione, esperienza — e quelle cose che dicono servano a un insegnante."
    },
    "kids": {
      "kicker": "le nuove leve",
      "title": "Anche i più piccoli ballano",
      "body": "Corsi kids per crescere con la cultura hip hop dal primo passo. Disciplina, gioco e tanta energia — perché il futuro della crew comincia da loro.",
      "imageUrl": null
    },
    "place": {
      "title": "La nostra casa",
      "body": "Ci alleniamo al Circolo La Fattoria, uno spazio che i ragazzi del quartiere stanno facendo rivivere a colpi di murales, dj set e danza.",
      "imageUrl": null,
      "locationName": "Circolo La Fattoria",
      "addressLine1": "Via Pirandello 6",
      "addressLine2": "Bologna"
    },
    "ctaBand": { "title": "Fai parte di tutto questo.", "subtitle": "Prima lezione di prova gratuita. Tessera ARCI obbligatoria." }
  }'::jsonb
),
(
  'footer',
  '{
    "tagline": "Scuola di danza urbana e collettivo hip hop al Circolo La Fattoria.",
    "locationName": "Circolo La Fattoria",
    "addressLine1": "Via Pirandello 6",
    "addressLine2": "Bologna",
    "instagramHandle": "burrumballa",
    "contactNote": "Tessera ARCI obbligatoria",
    "rightsNote": "Tutti i diritti riservati"
  }'::jsonb
)
on conflict (id) do nothing;

-- ---- courses + course_levels ------------------------------------------

with c as (
  insert into public.courses (slug, name, color, body, teachers, order_index) values
  ('breaking', 'Breaking', '#7E3FAE', 'Toprock, footwork, freeze e power move. Il cuore della cultura hip hop, dal primo passo al cypher.', null, 0),
  ('hip-hop', 'Hip Hop', '#EC1E89', 'Groove, musicalità e foundation. Lo stile che dà il nome a tutto: dritto dalla scena, con energia e divertimento.', 'con Pizzo & Still', 1),
  ('house', 'House', '#8BE03C', 'Jacking, footwork e lofting sui ritmi house. Velocità e fluidità per chi vuole sciogliersi sulla cassa dritta.', null, 2),
  ('popping', 'Popping', '#F6A323', 'Contrazioni, hit e illusioni. Controllo del corpo e funk per spezzare ogni movimento.', null, 3)
  returning id, slug
)
insert into public.course_levels (course_id, level, day_of_week, time, order_index)
select c.id, lv.level, lv.day_of_week, lv.time, lv.order_index
from c
join (values
  ('breaking', 'Base', 3, '18:00', 0),
  ('breaking', 'Intermedio', 1, '19:30', 1),
  ('breaking', 'Avanzato', 4, '20:00', 2),
  ('hip-hop', 'Base', 1, '18:00', 0),
  ('hip-hop', 'Intermedio', 2, '20:00', 1),
  ('hip-hop', 'Avanzato', 3, '21:00', 2),
  ('hip-hop', 'Kids', 5, '17:30', 3),
  ('house', 'Base', 2, '18:30', 0),
  ('house', 'Intermedio', 4, '18:30', 1),
  ('popping', 'Base', 3, '19:30', 0)
) as lv(slug, level, day_of_week, time, order_index)
  on lv.slug = c.slug;

-- ---- events -------------------------------------------------------------

insert into public.events (
  slug, title, subtitle, body, tags, event_date, event_end_date, event_time,
  note, color, featured, show_in_calendar, cta_label, cta_url, order_index
) values
(
  'senti-come-suona',
  'Senti Come Suona',
  '12–13 ottobre',
  'Due giorni di pura cultura hip hop al Circolo La Fattoria: workshop con guest, battle, apericena e party fino a tardi.',
  array['Workshop', 'Battle', 'Apericena', 'Party'],
  '2026-10-12', '2026-10-13', null, null,
  '#7E3FAE', true, true, 'Scopri di più', '/eventi/senti-come-suona', 0
),
(
  'dentro-lo-specchio',
  'Dentro lo Specchio',
  'SABATO 13/06',
  'Lo spettacolissimo di fine anno: tutti i corsi sul palco, in scena "Mirror mirror on the wall".',
  '{}', '2027-06-13', null, '19:00',
  'a seguire cibo, musica e gente felice',
  '#EC1E89', false, true, null, null, 1
),
(
  'apericreativo',
  'Apericreativo',
  'VENERDÌ · DALLE 18:30',
  'Musica, birrette e pennelli. Bar aperto per un aperitivo a tema pittura e falegnameria.',
  '{}', null, null, null,
  'Circolo La Fattoria · Via Pirandello 6',
  '#F6A323', false, false, null, null, 2
),
(
  'open-day-sala-vetri',
  'Open Day · Sala Vetri',
  'SABATO 11 APRILE · DALLE 16:00',
  'Apertura della Sala Vetri: uno spazio che sta nascendo, una nuova casa per i giovani del quartiere.',
  '{}', null, null, null,
  'Giochi, dj set, merenda',
  '#7E3FAE', false, false, null, null, 3
),
(
  'freeday-training',
  'Freeday Training',
  'VENERDÌ',
  'Torna l''allenamento gratuito e autogestito. Musica alta, porte aperte e birrette. Aperto a tutti.',
  '{}', null, null, '21:00–23:00',
  'aperto a tutti · tessera ARCI',
  '#EC1E89', false, true, null, null, 4
),
(
  'soundcheck-open-class',
  'Soundcheck · Open Class',
  'OPEN CLASS',
  'Allenamento collettivo aperto: si balla insieme, si condivide, si cresce. Il momento in cui la crew diventa famiglia.',
  '{}', null, null, null,
  'seguici su @burrumballa per le date',
  '#8BE03C', false, false, null, null, 5
)
on conflict (slug) do nothing;

-- ---- crew_groups ----------------------------------------------------------

insert into public.crew_groups (title, body, order_index) values
('Presidente & La Vice', 'La guida del collettivo, tra hip hop e organizzazione.', 0),
('Breaking & Waacking', 'Gli insegnanti che spingono ogni livello a dare il massimo.', 1)
on conflict do nothing;
