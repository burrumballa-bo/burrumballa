# Custom SMTP per le email di Supabase Auth (reset password e non solo)

## Perché serve

Di default Supabase invia le email di autenticazione (conferma iscrizione
utente, magic link, **reset password**, ecc.) tramite il proprio servizio
SMTP condiviso, con un mittente generico di Supabase e limiti di invio molto
bassi (poche email/ora), pensati solo per lo sviluppo.

Per far sì che **tutte** le email di Supabase Auth — inclusa quella
generata da `supabase.auth.resetPasswordForEmail(...)` — arrivino
dall'indirizzo ufficiale di Burrumballa (lo stesso salvato in
`app_settings.email_mittente`, non un indirizzo hardcoded nel codice),
bisogna configurare un **Custom SMTP** nel progetto Supabase.

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
select email_mittente from public.app_settings where id = 1;
```

Usa **esattamente questo valore** (non un indirizzo diverso o placeholder)
come "Sender email" nello step successivo.

## 3. Configura il Custom SMTP nella dashboard Supabase

1. Vai su **Supabase Dashboard → il tuo progetto → Project Settings →
   Authentication → SMTP Settings**.
2. Attiva **"Enable Custom SMTP"**.
3. Compila i campi:
   - **Sender email**: il valore di `app_settings.email_mittente` recuperato
     al punto 2 (es. `iscrizioni@burrumballa.it`).
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

Perché il mittente `email_mittente` venga accettato e non finisca in spam,
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

Attenzione: ci sono **due sistemi separati** che inviano email da
Burrumballa, ed entrambi vanno tenuti allineati a `app_settings.email_mittente`
quando quest'ultimo cambia:

| Email | Meccanismo | Dove si configura il mittente |
|---|---|---|
| Reset password, invito, conferma email, magic link | Supabase Auth (Custom SMTP) | Dashboard → Authentication → SMTP Settings → *Sender email* (vedi sopra) |
| Conferma iscrizione all'evento | Edge Function `send-registration-email` → API HTTP Resend | Secret `EMAIL_MITTENTE` (`supabase secrets set EMAIL_MITTENTE="Burrumballa <...>"`) |

**Il campo "Sender email" della dashboard Supabase non legge
dinamicamente il database ad ogni invio**: è una configurazione statica.
Quindi, se in futuro l'admin cambia `email_mittente` nelle impostazioni
dell'app, è necessario aggiornare manualmente anche:

1. Il campo "Sender email" in Authentication → SMTP Settings (punto 3 sopra).
2. Il secret `EMAIL_MITTENTE` della Edge Function (`supabase secrets set
   EMAIL_MITTENTE="Nome <nuovo-indirizzo@dominio.it>"`), così anche l'email
   di conferma iscrizione riparte dallo stesso mittente.

Un aggiornamento completamente automatico (che propaghi il cambio da
`app_settings` alla configurazione SMTP di Supabase Auth) richiederebbe un
token di Management API con accesso a livello di progetto/organizzazione:
per la sicurezza del progetto, questo token non deve mai essere esposto
all'app admin (che gira lato browser con la sola anon key) né eseguito da un
endpoint raggiungibile da utenti autenticati generici. Se in futuro si vuole
automatizzare, va fatto con uno script eseguito manualmente da chi ha
accesso all'account Supabase (o in una pipeline CI protetta), mai dal
client.
