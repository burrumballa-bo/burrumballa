-- =====================================================================
--  IMPOSTAZIONI: mittente generale, presidente/firma, scuola
--
--  - email_mittente_generale: mittente delle email che non appartengono
--    a un evento (ricevute della scuola, ricevute libere). Le email
--    dell'evento usano event_info.email_mittente e ricadono su questo
--    se vuoto; ultimo fallback il secret SMTP_FROM.
--  - presidente_nome / firma_url: firma del presidente sulle ricevute,
--    gestita come il timbro (bucket privato "assets", path in tabella).
--  - stagione_mese_inizio: mese (1..12) in cui inizia la stagione della
--    scuola (default settembre). Tessere e quote sono per stagione.
--  - prezzo_tessera / prezzo_quota_iscrizione: importi proposti in
--    automatico nella scheda iscritto (modificabili caso per caso).
-- =====================================================================

alter table public.app_settings
  add column if not exists email_mittente_generale text,
  add column if not exists presidente_nome text,
  add column if not exists firma_url text,
  add column if not exists stagione_mese_inizio smallint not null default 9
    check (stagione_mese_inizio between 1 and 12),
  add column if not exists prezzo_tessera numeric(8,2) check (prezzo_tessera >= 0),
  add column if not exists prezzo_quota_iscrizione numeric(8,2)
    check (prezzo_quota_iscrizione >= 0);

-- Si parte dal mittente attuale dell'evento: e' l'unico indirizzo da cui
-- oggi partono le email, quindi e' sicuramente abilitato sull'SMTP.
update public.app_settings s
set email_mittente_generale = ei.email_mittente
from public.event_info ei
where s.id = 1
  and ei.id = 1
  and s.email_mittente_generale is null;

comment on column public.app_settings.email_mittente_generale is
  'Mittente delle email non legate a un evento (ricevute scuola/libere) e fallback del mittente evento.';
comment on column public.app_settings.firma_url is
  'Path della firma del presidente nel bucket privato assets (come timbro_url).';
