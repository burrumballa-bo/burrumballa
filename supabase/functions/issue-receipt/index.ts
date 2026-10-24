// Edge Function per le ricevute create dall'admin (scuola e ricevute
// libere). Azioni:
//
//   { action: "preview", receipt }          -> PDF di anteprima, senza numero
//   { action: "issue", receipt, send? }      -> emette (numero progressivo),
//                                               archivia il PDF e, con
//                                               send: true, lo invia per email
//   { action: "send", receiptId, to? }      -> (re)invia il PDF archiviato
//   { action: "download", receiptId }       -> PDF archiviato (generato se manca)
//
// I PDF tornano in base64 nel campo `pdf`.
//
// Solo per utenti autenticati (gli admin): il token viene verificato con
// auth.getUser, non basta la anon key.
//
// Deploy:
//   supabase functions deploy issue-receipt
//
// Secret: gli stessi SMTP_* di send-payment-confirmation. Mittente:
// app_settings.email_mittente_generale, poi SMTP_FROM.

import { createClient } from "npm:@supabase/supabase-js@2"
import { encodeBase64 } from "jsr:@std/encoding@1/base64"
import {
  RECEIPT_SETTINGS_COLUMNS,
  ensureReceiptPdf,
  escapeHtml,
  formatCurrency,
  formatReceiptNumber,
  fromAddress,
  issueReceipt,
  markReceiptSent,
  previewReceiptPdf,
  receiptFilename,
  sendMail,
  smtpConfigFromEnv,
  type IncassoMethod,
  type ReceiptDraft,
  type ReceiptRow,
  type ReceiptSettings,
} from "../_shared/receipt.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const MAX_ITEMS = 30

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

const METHODS: IncassoMethod[] = ["contanti", "bonifico", "pos"]
const isStr = (v: unknown): v is string => typeof v === "string"
const optStr = (v: unknown) => v === undefined || v === null || isStr(v)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Valida e normalizza la bozza arrivata dal client. Il totale e' sempre
// ricalcolato qui come somma delle voci.
function parseDraft(value: unknown): ReceiptDraft | string {
  if (!value || typeof value !== "object") return "Ricevuta mancante"
  const r = value as Record<string, unknown>
  if (!isStr(r.recipient_name) || !r.recipient_name.trim()) return "Destinatario obbligatorio"
  for (const k of ["recipient_tax_code", "recipient_address", "recipient_email", "notes", "student_id"]) {
    if (!optStr(r[k])) return `Campo ${k} non valido`
  }
  if (isStr(r.recipient_email) && r.recipient_email.trim() && !EMAIL_RE.test(r.recipient_email.trim())) {
    return "Email del destinatario non valida"
  }
  if (r.issued_on !== undefined && !(isStr(r.issued_on) && /^\d{4}-\d{2}-\d{2}$/.test(r.issued_on))) {
    return "Data non valida"
  }
  if (r.payment_method != null && !METHODS.includes(r.payment_method as IncassoMethod)) {
    return "Metodo di pagamento non valido"
  }
  if (!Array.isArray(r.items) || r.items.length === 0 || r.items.length > MAX_ITEMS) {
    return `Inserisci da 1 a ${MAX_ITEMS} voci`
  }
  const items = []
  for (const raw of r.items) {
    const it = raw as Record<string, unknown>
    if (!isStr(it?.description) || !it.description.trim()) return "Ogni voce deve avere una descrizione"
    const amount = Number(it.amount)
    if (!Number.isFinite(amount) || amount < 0) return "Importo di una voce non valido"
    items.push({ description: it.description.trim(), amount: Math.round(amount * 100) / 100 })
  }
  const total = Math.round(items.reduce((sum, it) => sum + it.amount, 0) * 100) / 100
  return {
    issued_on: r.issued_on as string | undefined,
    recipient_name: r.recipient_name.trim(),
    recipient_tax_code: (r.recipient_tax_code as string | null | undefined)?.trim().toUpperCase() || null,
    recipient_address: (r.recipient_address as string | null | undefined)?.trim() || null,
    recipient_email: (r.recipient_email as string | null | undefined)?.trim() || null,
    items,
    total,
    payment_method: (r.payment_method as IncassoMethod | null | undefined) ?? null,
    notes: (r.notes as string | null | undefined)?.trim() || null,
    student_id: (r.student_id as string | null | undefined) || null,
  }
}

function buildEmail(row: ReceiptRow, settings: ReceiptSettings) {
  const org = settings.ricevuta_intestazione ?? "Burrumballa"
  const number = formatReceiptNumber(row)
  const total = formatCurrency(row.total)
  return {
    subject: `Ricevuta n. ${number} — ${org}`,
    text: [
      `Ciao ${row.recipient_name},`,
      "",
      `in allegato trovi la ricevuta n. ${number} di ${total}.`,
      "",
      `Grazie,\n${org}`,
    ].join("\n"),
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <p>Ciao ${escapeHtml(row.recipient_name)},</p>
        <p>in allegato trovi la ricevuta n. <strong>${number}</strong> di <strong>${total}</strong>.</p>
        <p>Grazie,<br />${escapeHtml(org)}</p>
      </div>
    `,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405)

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY non configurate" }, 500)
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "")
  const { data: auth } = token ? await supabaseAdmin.auth.getUser(token) : { data: null }
  const user = auth?.user
  if (!user) return jsonResponse({ error: "Accesso non autorizzato" }, 401)

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: "Body non valido" }, 400)
  }

  const loadRow = async (id: unknown) => {
    if (!isStr(id)) return null
    const { data } = await supabaseAdmin.from("receipts").select("*").eq("id", id).maybeSingle<ReceiptRow>()
    return data
  }

  const loadSettings = async () => {
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select(RECEIPT_SETTINGS_COLUMNS)
      .eq("id", 1)
      .single<ReceiptSettings>()
    if (error || !data) throw new Error(`Impostazioni non disponibili: ${error?.message}`)
    return data
  }

  // Invia il PDF e registra l'invio. Errori restituiti, non lanciati: una
  // ricevuta gia' emessa resta valida anche se l'email non parte.
  const send = async (row: ReceiptRow, pdf: Uint8Array, to: string): Promise<string | null> => {
    const smtp = smtpConfigFromEnv()
    if (!smtp) return "Configurazione SMTP incompleta (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS)"
    try {
      const settings = await loadSettings()
      await sendMail(smtp, {
        from: fromAddress(smtp, settings.email_mittente_generale, settings.ricevuta_intestazione),
        to,
        ...buildEmail(row, settings),
        attachment: { filename: receiptFilename(row), content: pdf },
      })
      await markReceiptSent(supabaseAdmin, row.id, to)
      return null
    } catch (error) {
      return error instanceof Error ? error.message : "Errore sconosciuto"
    }
  }

  try {
    switch (payload.action) {
      case "preview": {
        const draft = parseDraft(payload.receipt)
        if (typeof draft === "string") return jsonResponse({ error: draft }, 400)
        const pdf = await previewReceiptPdf(supabaseAdmin, draft)
        return jsonResponse({ ok: true, pdf: encodeBase64(pdf) })
      }

      case "issue": {
        const draft = parseDraft(payload.receipt)
        if (typeof draft === "string") return jsonResponse({ error: draft }, 400)
        const wantsSend = payload.send === true
        if (wantsSend && !draft.recipient_email) {
          return jsonResponse({ error: "Per inviare la ricevuta serve l'email del destinatario" }, 400)
        }
        const { row, pdf } = await issueReceipt(supabaseAdmin, draft, user.id)
        const emailError = wantsSend ? await send(row, pdf, draft.recipient_email!) : null
        return jsonResponse({
          ok: true,
          receipt: { id: row.id, year: row.year, number: row.number },
          pdf: encodeBase64(pdf),
          email: wantsSend ? (emailError ? "failed" : "sent") : "not_requested",
          emailError,
        })
      }

      case "send": {
        const row = await loadRow(payload.receiptId)
        if (!row) return jsonResponse({ error: "Ricevuta non trovata" }, 404)
        if (row.cancelled_at) return jsonResponse({ error: "La ricevuta è annullata" }, 409)
        const to = (isStr(payload.to) && payload.to.trim()) || row.recipient_email
        if (!to || !EMAIL_RE.test(to)) return jsonResponse({ error: "Email del destinatario non valida" }, 400)
        const pdf = await ensureReceiptPdf(supabaseAdmin, row)
        const emailError = await send(row, pdf, to)
        if (emailError) return jsonResponse({ error: "Invio non riuscito", detail: emailError }, 502)
        return jsonResponse({ ok: true })
      }

      case "download": {
        const row = await loadRow(payload.receiptId)
        if (!row) return jsonResponse({ error: "Ricevuta non trovata" }, 404)
        const pdf = await ensureReceiptPdf(supabaseAdmin, row)
        return jsonResponse({ ok: true, pdf: encodeBase64(pdf), filename: receiptFilename(row) })
      }

      default:
        return jsonResponse({ error: "Azione non valida" }, 400)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore sconosciuto"
    return jsonResponse({ error: "Operazione non riuscita", detail: message }, 500)
  }
})
