-- =====================================================================
--  EMAIL: MITTENTE DELL'EVENTO ≠ EMAIL DEI CONTATTI
--
--  Fino a qui `app_settings.email_mittente` era l'unico indirizzo
--  configurabile e faceva due lavori diversi: mittente delle email di
--  "Senti Come Suona" (conferma iscrizione + ricevuta di pagamento) e
--  indirizzo di contatto pubblico dell'associazione (view `org_info`,
--  usata dalla pagina privacy e dal JSON-LD del sito).
--
--  Con il form contatti del sito pubblico i due usi si separano:
--
--   - event_info.email_mittente   -> mittente delle email dell'evento.
--     Il valore viene COPIATO da app_settings (oggi
--     senticomesuona@burrumballa.it) invece di essere reinserito a mano:
--     le email che mandiamo e riceviamo per l'evento devono continuare a
--     partire e tornare esattamente da quell'indirizzo.
--
--   - app_settings.email_contatti -> destinatario dei messaggi inviati
--     dal form contatti, e indirizzo di contatto pubblico.
--
--  Nota sulla view `org_info` (creata a mano sul progetto, non presente
--  in queste migrazioni): espone `app_settings.email_mittente as
--  email_contatto`. PostgreSQL riscrive da sé le view dipendenti quando
--  una colonna viene rinominata, quindi la view continua a funzionare e
--  da ora punta — correttamente — all'email dei contatti.
-- =====================================================================

-- ---- 1. Mittente a livello di evento ---------------------------------
alter table public.event_info
  add column if not exists email_mittente text;

comment on column public.event_info.email_mittente is
  'Mittente delle email dell''evento (conferma iscrizione, ricevuta di pagamento). Se vuoto le Edge Functions ricadono sul secret SMTP_FROM.';

-- ---- 2. Travaso del valore attuale + rinomina -------------------------
-- Un unico blocco perché i due passi vanno fatti in quest'ordine e devono
-- restare ri-eseguibili: dopo la rinomina `app_settings.email_mittente`
-- non esiste più, quindi la copia va saltata invece di andare in errore.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'app_settings'
      and column_name = 'email_mittente'
  ) then
    execute $copy$
      update public.event_info ei
      set email_mittente = s.email_mittente
      from public.app_settings s
      where ei.id = 1
        and s.id = 1
        and ei.email_mittente is null
    $copy$;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'app_settings'
        and column_name = 'email_contatti'
    ) then
      alter table public.app_settings
        rename column email_mittente to email_contatti;
    end if;
  end if;
end $$;

comment on column public.app_settings.email_contatti is
  'Indirizzo a cui arrivano i messaggi del form contatti del sito, e contatto pubblico dell''associazione (view org_info).';

-- ---- 3. Copy della sezione contatti in home --------------------------
-- Stessa logica del seed FAQ (20260907000000_home_faq.sql): la forma del
-- jsonb è definita lato applicazione (burrumballa-web/src/lib/cms/types.ts)
-- e i default applicativi coprono comunque il caso in cui la chiave manchi,
-- quindi qui serve solo a partire con dei testi veri. Idempotente.
update public.site_pages
set content = content || '{
  "contact": {
    "kicker": "scrivici",
    "title": "Parliamone",
    "subtitle": "Vuoi iscriverti, prenotare una lezione di prova o solo capire se fa per te? Scrivici qui: ti rispondiamo noi, non un bot.",
    "note": "Ti rispondiamo via email, di solito entro un paio di giorni."
  }
}'::jsonb
where id = 'home'
  and not (content ? 'contact');
