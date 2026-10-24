// Edge Function invocata dal form pubblico dopo un insert riuscito su
// `registrations`. Invia l'email di conferma iscrizione via SMTP.
//
// Deploy:
//   supabase functions deploy send-registration-email
//
// Secret richiesti (Supabase -> Project Settings -> Edge Functions,
// oppure `supabase secrets set NOME=valore`), SMTP Tophost:
//   SMTP_HOST   - host del server SMTP (es. mail.tophost.it)
//   SMTP_PORT   - porta SMTP (465 = TLS implicito, 587 = STARTTLS)
//   SMTP_USER   - utente/casella SMTP
//   SMTP_PASS   - password della casella SMTP
//   SMTP_FROM   - mittente "Nome <email@dominio>" di fallback (opzionale,
//                 default SMTP_USER), usato se l'evento e le Impostazioni
//                 non hanno un mittente
//
// Con `eventId` titolo e mittente arrivano dall'evento (event_info), con
// ricaduta sul mittente generale delle Impostazioni.

import { createClient } from "npm:@supabase/supabase-js@2"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

import { escapeHtml } from "../_shared/receipt.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const SMTP_HOST = Deno.env.get("SMTP_HOST")
const SMTP_PORT = Deno.env.get("SMTP_PORT")
const SMTP_USER = Deno.env.get("SMTP_USER")
const SMTP_PASS = Deno.env.get("SMTP_PASS")
const SMTP_FROM = Deno.env.get("SMTP_FROM") ?? SMTP_USER ?? ""

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface RegistrationEmailPayload {
  eventId?: number
  nome: string
  cognome: string
  email: string
  workshopLabel: string
  battleLabels: string[]
  paymentMethod: "bonifico" | "sul_posto"
  amountTotal: number
}

function isValidPayload(value: unknown): value is RegistrationEmailPayload {
  if (!value || typeof value !== "object") return false
  const p = value as Record<string, unknown>
  return (
    typeof p.nome === "string" &&
    typeof p.cognome === "string" &&
    typeof p.email === "string" &&
    typeof p.workshopLabel === "string" &&
    Array.isArray(p.battleLabels) &&
    p.battleLabels.every((label) => typeof label === "string") &&
    (p.paymentMethod === "bonifico" || p.paymentMethod === "sul_posto") &&
    typeof p.amountTotal === "number" &&
    (p.eventId === undefined || typeof p.eventId === "number")
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

function buildEmailHtml(payload: RegistrationEmailPayload, eventTitle: string): string {
  const battleText = payload.battleLabels.join(", ")
  const pagamentoText =
    payload.paymentMethod === "bonifico" ? "Bonifico bancario" : "Sul posto"

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="font-size: 20px;">Iscrizione confermata — ${escapeHtml(eventTitle)}</h1>
      <p>Ciao ${payload.nome},</p>
      <p>Abbiamo ricevuto la tua iscrizione a <strong>${escapeHtml(eventTitle)}</strong>. Ecco il riepilogo:</p>
      <ul>
        <li><strong>Nome:</strong> ${payload.nome} ${payload.cognome}</li>
        <li><strong>Workshop:</strong> ${payload.workshopLabel}</li>
        <li><strong>Battle:</strong> ${battleText}</li>
        <li><strong>Pagamento:</strong> ${pagamentoText}</li>
        <li><strong>Totale:</strong> ${formatCurrency(payload.amountTotal)}</li>
      </ul>
      ${
        payload.paymentMethod === "bonifico"
          ? "<p>Il posto è confermato solo dopo la ricezione del bonifico.</p>"
          : "<p>Ricordati di portare l'importo esatto il giorno dell'evento.</p>"
      }
      <p>A presto,<br />Burrumballa</p>
    </div>
  `
}

function buildEmailText(payload: RegistrationEmailPayload, eventTitle: string): string {
  const pagamentoText =
    payload.paymentMethod === "bonifico" ? "Bonifico bancario" : "Sul posto"

  return [
    `Iscrizione confermata — ${eventTitle}`,
    "",
    `Ciao ${payload.nome},`,
    `Abbiamo ricevuto la tua iscrizione a ${eventTitle}. Ecco il riepilogo:`,
    `Nome: ${payload.nome} ${payload.cognome}`,
    `Workshop: ${payload.workshopLabel}`,
    `Battle: ${payload.battleLabels.join(", ")}`,
    `Pagamento: ${pagamentoText}`,
    `Totale: ${formatCurrency(payload.amountTotal)}`,
    "",
    payload.paymentMethod === "bonifico"
      ? "Il posto è confermato solo dopo la ricezione del bonifico."
      : "Ricordati di portare l'importo esatto il giorno dell'evento.",
    "",
    "A presto,\nBurrumballa",
  ].join("\n")
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return new Response(
      JSON.stringify({
        error: "Configurazione SMTP incompleta (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS)",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Body non valido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  if (!isValidPayload(payload)) {
    return new Response(JSON.stringify({ error: "Payload non valido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Titolo e mittente dell'evento; senza eventId (form vecchio) l'evento 1.
  let eventTitle = "Senti Come Suona"
  let from = SMTP_FROM
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
    const [{ data: event }, { data: settings }] = await Promise.all([
      supabaseAdmin
        .from("event_info")
        .select("titolo, email_mittente")
        .eq("id", payload.eventId ?? 1)
        .maybeSingle<{ titolo: string; email_mittente: string | null }>(),
      supabaseAdmin
        .from("app_settings")
        .select("ricevuta_intestazione, email_mittente_generale")
        .eq("id", 1)
        .maybeSingle<{ ricevuta_intestazione: string | null; email_mittente_generale: string | null }>(),
    ])
    if (event?.titolo) eventTitle = event.titolo
    const address = event?.email_mittente?.trim() || settings?.email_mittente_generale?.trim()
    if (address) {
      from = settings?.ricevuta_intestazione ? `${settings.ricevuta_intestazione} <${address}>` : address
    }
  }

  const smtpClient = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: Number(SMTP_PORT),
      tls: Number(SMTP_PORT) === 465,
      auth: { username: SMTP_USER, password: SMTP_PASS },
    },
  })

  try {
    await smtpClient.send({
      from,
      to: payload.email,
      subject: `Iscrizione confermata — ${eventTitle}`,
      content: buildEmailText(payload, eventTitle),
      html: buildEmailHtml(payload, eventTitle),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore sconosciuto"
    return new Response(
      JSON.stringify({ error: "Invio email non riuscito", detail: message }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } finally {
    await smtpClient.close()
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
