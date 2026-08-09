// Edge Function invocata dal form pubblico dopo un insert riuscito su
// `registrations`. Invia l'email di conferma iscrizione tramite Resend.
//
// Deploy:
//   supabase functions deploy send-registration-email
//
// Secret richiesti (Supabase -> Project Settings -> Edge Functions,
// oppure `supabase secrets set NOME=valore`):
//   RESEND_API_KEY   - API key di Resend (obbligatoria)
//   EMAIL_MITTENTE   - mittente "Nome <email@dominio>" (opzionale,
//                      default onboarding@resend.dev)

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const EMAIL_MITTENTE =
  Deno.env.get("EMAIL_MITTENTE") ?? "Burrumballa <onboarding@resend.dev>"

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

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY non configurata" }),
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

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_MITTENTE,
      to: [payload.email],
      subject: "Iscrizione confermata — Senti Come Suona",
      html: buildEmailHtml(payload),
    }),
  })

  if (!resendResponse.ok) {
    const errorBody = await resendResponse.text()
    return new Response(
      JSON.stringify({ error: "Invio email non riuscito", detail: errorBody }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
