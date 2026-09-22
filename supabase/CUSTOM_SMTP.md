# Custom SMTP per le email di Supabase Auth (reset password e non solo)

## Perché serve

Di default Supabase invia le email di autenticazione (conferma iscrizione
utente, magic link, **reset password**, ecc.) tramite il proprio servizio
SMTP condiviso, con un mittente generico di Supabase e limiti di invio molto
bassi (poche email/ora), pensati solo per lo sviluppo.

Per far sì che **tutte** le email di Supabase Auth — inclusa quella
generata da `supabase.auth.resetPasswordForEmail(...)` — arrivino
dall'indirizzo ufficiale di Burrumballa (lo stesso salvato in
`app_settings.email_contatti`, non un indirizzo hardcoded nel codice),
bisogna configurare un **Custom SMTP** nel progetto Supabase.

> **Due indirizzi, due ruoli.** `app_settings.email_contatti` è
> l'indirizzo generale di Burrumballa: destinatario del form contatti del
> sito, contatto pubblico dell'informativa privacy e mittente delle email
> di Auth. Le email di un evento (conferma iscrizione e ricevuta di
> pagamento di "Senti Come Suona") partono invece da
> `event_info.email_mittente`, gestito in admin → Evento → Modifica pagina
> evento, e devono continuare a partire da `senticomesuona@burrumballa.it`.

Questo è un passaggio di configurazione lato dashboard Supabase: non è
possibile farlo via codice client-side (l'app admin non deve avere accesso a
credenziali SMTP o alle API di management del progetto).

## 1. Procurati le credenziali SMTP

Il progetto usa già [Resend](https://resend.com) per l'email di conferma
iscrizione (vedi `supabase/functions/send-registration-email`, che chiama
l'API HTTP di Resend). Resend offre anche un **relay SMTP**, quindi puoi
riusare lo stesso account/dominio verificato invece di aggiungere un altro
provider:

- Host: `smtp.resend.com`
- Porta: `465` (SSL) oppure `587` (STARTTLS)
- Username: `resend`
- Password: la tua Resend API key (`re_...`)

In alternativa va bene qualsiasi altro provider SMTP transazionale (SendGrid,
Postmark, Mailgun, Amazon SES, ecc.): l'importante è che il **dominio del
mittente** sia verificato (SPF/DKIM/DMARC) presso quel provider, altrimenti
le email finiscono in spam o vengono rifiutate.

## 2. Recupera l'indirizzo mittente da `app_settings`

L'indirizzo da usare come mittente è quello configurato dall'admin
nell'applicazione, salvato in Supabase:

```sql
select email_contatti from public.app_settings where id = 1;
```

Usa **esattamente questo valore** (non un indirizzo diverso o placeholder)
come "Sender email" nello step successivo.

## 3. Configura il Custom SMTP nella dashboard Supabase

1. Vai su **Supabase Dashboard → il tuo progetto → Project Settings →
   Authentication → SMTP Settings**.
2. Attiva **"Enable Custom SMTP"**.
3. Compila i campi:
   - **Sender email**: il valore di `app_settings.email_contatti` recuperato
     al punto 2 (es. `info@burrumballa.it`).
   - **Sender name**: `Burrumballa` (o il nome che preferisci mostrare come
     mittente).
   - **Host**: `smtp.resend.com` (o l'host del provider scelto).
   - **Port**: `465` o `587`.
   - **Username** / **Password**: le credenziali SMTP del provider (vedi
     punto 1).
4. Salva. Supabase invierà da questo momento **tutte** le email di
   Authentication (reset password, invito, conferma email, magic link,
   ecc.) tramite questo SMTP, con il mittente configurato — non più tramite
   il servizio condiviso di Supabase.

## 4. Verifica il dominio presso il provider SMTP

Perché il mittente `email_contatti` venga accettato e non finisca in spam,
il **dominio** di quell'indirizzo deve essere verificato presso il provider
SMTP scelto (es. in Resend: Dashboard → Domains → Add Domain, poi aggiungi i
record DNS SPF/DKIM/DMARC indicati). Se l'indirizzo mittente cambia dominio,
va verificato di nuovo.

## 5. Testa il flusso

1. Nell'app admin, vai su `/admin/login`, clicca "Password dimenticata?" e
   invia il reset per un'email di test.
2. Controlla che l'email ricevuta abbia come **From** l'indirizzo
   configurato al punto 3, non un indirizzo Supabase generico.
3. Segui il link: deve portare a `/admin/reset-password` e permettere di
   impostare una nuova password.

## 6. Mantenere allineati mittente Auth e mittente delle altre email

Attenzione: ci sono **sistemi separati** che inviano email da Burrumballa,
e non partono tutti dallo stesso indirizzo:

| Email | Meccanismo | Da quale indirizzo parte |
|---|---|---|
| Reset password, invito, conferma email, magic link | Supabase Auth (Custom SMTP) | Configurazione statica: Dashboard → Authentication → SMTP Settings → *Sender email* (vedi sopra) |
| Conferma iscrizione all'evento | Edge Function `send-registration-email` → SMTP | Secret `SMTP_FROM` (`supabase secrets set SMTP_FROM="Nome <email@dominio>"`), default `SMTP_USER` |
| Conferma pagamento (ricevuta PDF in allegato) | Edge Function `send-payment-confirmation` → SMTP | Legge `event_info.email_mittente` **ad ogni invio**; fallback sul secret `SMTP_FROM` se il campo è vuoto |
| Messaggio dal form contatti del sito | Route `POST /api/contatti` del sito (Next.js + nodemailer) → SMTP | Parte dalla casella SMTP autenticata (`SMTP_FROM`) e **arriva** a `app_settings.email_contatti`, con Reply-To di chi ha scritto |

### Perché il form contatti parte dal sito e non da una Edge Function

Una route dello stesso sito è same-origin, quindi il browser non fa il
preflight CORS: una sola chiamata per invio. In più il runtime edge di
Supabase concede a ogni worker un paio di secondi di CPU, e una sessione
SMTP può sfondarli: nei log compare `CPU Time exceeded` e il client si vede
tornare `546 WORKER_RESOURCE_LIMIT` (il boot non c'entra — si misura in
decine di millisecondi). Le due Edge Functions dell'evento
(`send-registration-email` e `send-payment-confirmation`) usano `denomailer`
e sono esposte a questo limite: se conferme o ricevute smettessero di
arrivare, il posto dove guardare sono i log di quelle functions.

Conseguenza pratica: le credenziali SMTP servono in **due posti**, come
variabili d'ambiente dell'hosting del sito (`SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`, `SMTP_PASS`, opzionale `SMTP_FROM`) per il form contatti e
come secret Supabase per le due functions dell'evento. Quando cambiano,
vanno aggiornate in entrambi.

**Il campo "Sender email" della dashboard Supabase non legge
dinamicamente il database ad ogni invio**: è una configurazione statica.
Quindi, se in futuro l'admin cambia `email_contatti` nelle impostazioni
dell'app, va aggiornato a mano anche il campo "Sender email" in
Authentication → SMTP Settings (punto 3 sopra). Allo stesso modo, se cambia
il mittente dell'evento (`event_info.email_mittente`), va aggiornato a mano
il secret `SMTP_FROM` (`supabase secrets set SMTP_FROM="Nome
<nuovo-indirizzo@dominio.it>"`), così anche la conferma iscrizione riparte
dallo stesso indirizzo. Il mittente della function della ricevuta, invece,
segue il database da solo.

Un aggiornamento completamente automatico (che propaghi il cambio da
`app_settings` alla configurazione SMTP di Supabase Auth) richiederebbe un
token di Management API con accesso a livello di progetto/organizzazione:
per la sicurezza del progetto, questo token non deve mai essere esposto
all'app admin (che gira lato browser con la sola anon key) né eseguito da un
endpoint raggiungibile da utenti autenticati generici. Se in futuro si vuole
automatizzare, va fatto con uno script eseguito manualmente da chi ha
accesso all'account Supabase (o in una pipeline CI protetta), mai dal
client.
