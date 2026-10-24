// Edge Function invocata dalla dashboard admin quando lo stato di
// un'iscrizione passa a uno stato pagato ("pagato_bonifico" o
// "pagato_in_loco" / "pagato_pos"). Emette la ricevuta con la numerazione
// unica di public.receipts (vedi ../_shared/receipt.ts) e la invia via
// email all'iscritto,
// con guardia anti-doppio-invio su
// `registrations.email_conferma_bonifico_inviata_at` (il nome e' storico:
// vale per qualsiasi metodo di pagamento).
//
// Con `resend: true` (bottone "Rimanda ricevuta" nel modale iscritto) la
// ricevuta viene reinviata a prescindere dalla guardia, per qualsiasi
// iscrizione gia' pagata.
//
// Un'iscrizione ha al piu' una ricevuta valida: i reinvii riusano la
// stessa (stesso numero e stesso PDF). Se nel frattempo l'importo pagato
// e' cambiato (prezzo admin), la vecchia viene annullata e se ne emette
// una nuova.
//
// Deploy:
//   supabase functions deploy send-payment-confirmation
//
// Secret richiesti (Supabase -> Project Settings -> Edge Functions,
// oppure `supabase secrets set NOME=valore`), SMTP Tophost:
//   SMTP_HOST   - host del server SMTP (es. mail.tophost.it)
//   SMTP_PORT   - porta SMTP (465 = TLS implicito, 587 = STARTTLS)
//   SMTP_USER   - utente/casella SMTP
//   SMTP_PASS   - password della casella SMTP
//   SMTP_FROM   - mittente di fallback "Nome <email@dominio>", usato solo
//                 se event_info.email_mittente e
//                 app_settings.email_mittente_generale sono vuoti
//                 (opzionale, default SMTP_USER)
//
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono iniettate automaticamente
// da Supabase in ogni Edge Function: servono qui per leggere/scrivere
// `registrations` e `app_settings` bypassando la RLS (la function e' un
// processo server-to-server, non un client anon/authenticated) e per
// scaricare il timbro dal bucket privato "assets".

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2"
import {
  RECEIPT_SETTINGS_COLUMNS,
  ensureReceiptPdf,
  fromAddress,
  issueReceipt,
  markReceiptSent,
  pdfSafeText,
  receiptFilename,
  sendMail,
  smtpConfigFromEnv,
  type IncassoMethod,
  type ReceiptItem,
  type ReceiptRow,
  type ReceiptSettings,
} from "../_shared/receipt.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const EMAIL_SUBJECT = "Pagamento confermato — SENTI COME SUONA vol.3"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

interface RequestPayload {
  registrationId: string
  resend?: boolean
}

function isValidPayload(value: unknown): value is RequestPayload {
  if (!value || typeof value !== "object") return false
  const p = value as Record<string, unknown>
  return (
    typeof p.registrationId === "string" &&
    p.registrationId.length > 0 &&
    (p.resend === undefined || typeof p.resend === "boolean")
  )
}

interface Registration {
  id: string
  nome: string
  cognome: string
  email: string
  workshop: string | null
  battle_categories: string[]
  payment_method: "bonifico" | "sul_posto"
  payment_status: "da_pagare" | "pagato_bonifico" | "pagato_in_loco" | "pagato_pos"
  amount_workshop: number
  amount_battle: number
  surcharge_late: number
  surcharge_onsite: number
  amount_total: number
  prezzo_admin: number | null
  created_at: string
  email_conferma_bonifico_inviata_at: string | null
}

const INCASSO_BY_STATUS: Record<Registration["payment_status"], IncassoMethod | null> = {
  da_pagare: null,
  pagato_bonifico: "bonifico",
  pagato_in_loco: "contanti",
  pagato_pos: "pos",
}

// Il prezzo amministratore, se impostato, e' la cifra effettivamente
// pagata e sostituisce il totale calcolato dal listino.
function importoPagato(registration: Registration): number {
  return Number(registration.prezzo_admin ?? registration.amount_total)
}

function buildReceiptLines(
  registration: Registration,
  workshopLabel: string | null,
  battleLabels: string[]
): ReceiptItem[] {
  const lines: ReceiptItem[] = []

  // Con un prezzo amministratore gli importi di listino non corrispondono
  // a quanto pagato: elenchiamo le attivita' senza prezzi (niente
  // sovrapprezzi) e mostriamo solo il totale pagato.
  if (registration.prezzo_admin !== null) {
    if (registration.workshop) {
      lines.push({
        description: pdfSafeText(`Workshop: ${workshopLabel ?? registration.workshop}`),
        amount: null,
      })
    }
    if (battleLabels.length > 0) {
      lines.push({ description: pdfSafeText(`Battle: ${battleLabels.join(", ")}`), amount: null })
    }
    return lines
  }

  if (registration.amount_workshop > 0) {
    lines.push({
      description: pdfSafeText(`Workshop: ${workshopLabel ?? registration.workshop ?? "-"}`),
      amount: Number(registration.amount_workshop),
    })
  }

  if (registration.amount_battle > 0) {
    const label = battleLabels.length > 0 ? battleLabels.join(", ") : "Battle"
    lines.push({
      description: pdfSafeText(`Battle: ${label}`),
      amount: Number(registration.amount_battle),
    })
  }

  if (registration.surcharge_late > 0) {
    lines.push({
      description: "Maggiorazione iscrizione in ritardo",
      amount: Number(registration.surcharge_late),
    })
  }

  if (registration.surcharge_onsite > 0) {
    lines.push({
      description: "Maggiorazione pagamento sul posto",
      amount: Number(registration.surcharge_onsite),
    })
  }

  // Iscrizione senza voci a pagamento: la ricevuta deve comunque avere una riga.
  if (lines.length === 0) lines.push({ description: "Iscrizione SENTI COME SUONA vol.3", amount: null })

  return lines
}

// Ricevuta valida dell'iscrizione: riusata se l'importo e' lo stesso,
// altrimenti annullata e sostituita da una nuova.
async function getOrIssueReceipt(
  supabaseAdmin: SupabaseClient,
  registration: Registration,
  items: ReceiptItem[]
): Promise<{ row: ReceiptRow; pdf: Uint8Array }> {
  const total = importoPagato(registration)
  const { data: existing } = await supabaseAdmin
    .from("receipts")
    .select("*")
    .eq("registration_id", registration.id)
    .is("cancelled_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ReceiptRow>()

  if (existing && Number(existing.total) === total) {
    return { row: existing, pdf: await ensureReceiptPdf(supabaseAdmin, existing) }
  }
  if (existing) {
    await supabaseAdmin
      .from("receipts")
      .update({ cancelled_at: new Date().toISOString() })
      .eq("id", existing.id)
  }

  return issueReceipt(
    supabaseAdmin,
    {
      recipient_name: `${registration.nome} ${registration.cognome}`,
      recipient_email: registration.email,
      items,
      total,
      payment_method: INCASSO_BY_STATUS[registration.payment_status],
      registration_id: registration.id,
    },
    null
  )
}

function confermaPagamento(registration: Registration): string {
  return registration.payment_status === "pagato_bonifico"
    ? "Abbiamo ricevuto il tuo bonifico"
    : "Abbiamo ricevuto il tuo pagamento"
}

function buildEmailHtml(registration: Registration, settings: ReceiptSettings): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="font-size: 20px;">Pagamento confermato — SENTI COME SUONA vol.3</h1>
      <p>Ciao ${registration.nome},</p>
      <p>${confermaPagamento(registration)}: la tua iscrizione a <strong>Senti Come Suona vol.3</strong> è confermata.</p>
      <p>In allegato trovi la ricevuta di pagamento in PDF.</p>
      <p>A presto,<br />${settings.ricevuta_intestazione ?? "Burrumballa"}</p>
    </div>
  `
}

function buildEmailText(registration: Registration, settings: ReceiptSettings): string {
  return [
    "Pagamento confermato — SENTI COME SUONA vol.3",
    "",
    `Ciao ${registration.nome},`,
    `${confermaPagamento(registration)}: la tua iscrizione a Senti Come Suona vol.3 è confermata.`,
    "In allegato trovi la ricevuta di pagamento in PDF.",
    "",
    `A presto,\n${settings.ricevuta_intestazione ?? "Burrumballa"}`,
  ].join("\n")
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { error: "SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY non configurate" },
      500
    )
  }
  const smtp = smtpConfigFromEnv()
  if (!smtp) {
    return jsonResponse(
      { error: "Configurazione SMTP incompleta (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS)" },
      500
    )
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: "Body non valido" }, 400)
  }

  if (!isValidPayload(payload)) {
    return jsonResponse({ error: "Payload non valido: atteso { registrationId }" }, 400)
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const { data: registration, error: fetchError } = await supabaseAdmin
    .from("registrations")
    .select(
      "id, nome, cognome, email, workshop, battle_categories, payment_method, payment_status, amount_workshop, amount_battle, surcharge_late, surcharge_onsite, amount_total, prezzo_admin, created_at, email_conferma_bonifico_inviata_at"
    )
    .eq("id", payload.registrationId)
    .maybeSingle<Registration>()

  if (fetchError) {
    return jsonResponse({ error: "Errore lettura iscrizione", detail: fetchError.message }, 500)
  }
  if (!registration) {
    return jsonResponse({ error: "Iscrizione non trovata" }, 404)
  }
  const resend = payload.resend === true

  if (resend) {
    if (registration.payment_status === "da_pagare") {
      return jsonResponse({ error: "L'iscrizione non risulta ancora pagata" }, 409)
    }
  } else {
    if (registration.payment_status === "da_pagare") {
      return jsonResponse({ error: "L'iscrizione non risulta ancora pagata" }, 409)
    }
    if (registration.email_conferma_bonifico_inviata_at) {
      return jsonResponse({ ok: true, skipped: true, reason: "already_sent" })
    }

    // Guardia anti-doppio-invio: reclama atomicamente la riga. Se un'altra
    // richiesta concorrente l'ha già reclamata (update non trova righe),
    // ci fermiamo qui senza inviare una seconda email.
    const nowIso = new Date().toISOString()
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from("registrations")
      .update({ email_conferma_bonifico_inviata_at: nowIso })
      .eq("id", registration.id)
      .neq("payment_status", "da_pagare")
      .is("email_conferma_bonifico_inviata_at", null)
      .select("id")
      .maybeSingle()

    if (claimError) {
      return jsonResponse(
        { error: "Errore aggiornamento iscrizione", detail: claimError.message },
        500
      )
    }
    if (!claimed) {
      return jsonResponse({ ok: true, skipped: true, reason: "already_sent" })
    }
  }

  try {
    const { data: settingsRow, error: settingsError } = await supabaseAdmin
      .from("app_settings")
      .select(RECEIPT_SETTINGS_COLUMNS)
      .eq("id", 1)
      .single<ReceiptSettings>()

    if (settingsError) throw new Error(`Impostazioni non disponibili: ${settingsError.message}`)

    // Il mittente e' quello dell'evento (event_info.email_mittente); se
    // vuoto si ricade sul mittente generale delle Impostazioni.
    const { data: eventInfo } = await supabaseAdmin
      .from("event_info")
      .select("email_mittente")
      .eq("id", 1)
      .maybeSingle<{ email_mittente: string | null }>()

    const senderAddress =
      eventInfo?.email_mittente?.trim() || settingsRow.email_mittente_generale?.trim() || null

    const chiavi = [
      ...(registration.workshop ? [registration.workshop] : []),
      ...registration.battle_categories,
    ]
    const { data: options } = await supabaseAdmin
      .from("event_options")
      .select("chiave, tipo, label")
      .in("chiave", chiavi.length > 0 ? chiavi : ["__none__"])

    const workshopLabel =
      options?.find((o) => o.tipo === "workshop" && o.chiave === registration.workshop)
        ?.label ?? null
    const battleLabels = registration.battle_categories.map(
      (chiave) => options?.find((o) => o.tipo === "battle" && o.chiave === chiave)?.label ?? chiave
    )

    const { row: receipt, pdf } = await getOrIssueReceipt(
      supabaseAdmin,
      registration,
      buildReceiptLines(registration, workshopLabel, battleLabels)
    )

    await sendMail(smtp, {
      from: fromAddress(smtp, senderAddress, settingsRow.ricevuta_intestazione),
      to: registration.email,
      subject: EMAIL_SUBJECT,
      text: buildEmailText(registration, settingsRow),
      html: buildEmailHtml(registration, settingsRow),
      attachment: { filename: receiptFilename(receipt), content: pdf },
    })
    await markReceiptSent(supabaseAdmin, receipt.id, registration.email)

    return jsonResponse({ ok: true, skipped: false })
  } catch (error) {
    // Rollback della guardia: la riga torna "non inviata" cosi' un
    // nuovo tentativo (cambio stato o retry manuale) puo' reinviare. Un
    // reinvio non ha reclamato la guardia, quindi non c'e' nulla da
    // ripristinare.
    if (!resend) {
      await supabaseAdmin
        .from("registrations")
        .update({ email_conferma_bonifico_inviata_at: null })
        .eq("id", registration.id)
    }

    const message = error instanceof Error ? error.message : "Errore sconosciuto"
    return jsonResponse({ error: "Invio ricevuta non riuscito", detail: message }, 502)
  }
})
