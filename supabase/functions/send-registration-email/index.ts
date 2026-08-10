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
//   SMTP_FROM   - mittente "Nome <email@dominio>" (opzionale, default SMTP_USER)

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

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
    typeof p.amountTotal === "number"
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

function buildEmailHtml(payload: RegistrationEmailPayload): string {
  const battleText = payload.battleLabels.join(", ")
  const pagamentoText =
    payload.paymentMethod === "bonifico" ? "Bonifico bancario" : "Sul posto"

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="font-size: 20px;">Iscrizione confermata — Senti Come Suona</h1>
      <p>Ciao ${payload.nome},</p>
      <p>Abbiamo ricevuto la tua iscrizione a <strong>Senti Come Suona</strong>. Ecco il riepilogo:</p>
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

function buildEmailText(payload: RegistrationEmailPayload): string {
  const pagamentoText =
    payload.paymentMethod === "bonifico" ? "Bonifico bancario" : "Sul posto"

  return [
    "Iscrizione confermata — Senti Come Suona",
    "",
    `Ciao ${payload.nome},`,
    "Abbiamo ricevuto la tua iscrizione a Senti Come Suona. Ecco il riepilogo:",
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
      from: SMTP_FROM,
      to: payload.email,
      subject: "Iscrizione confermata — Senti Come Suona",
      content: buildEmailText(payload),
      html: buildEmailHtml(payload),
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
