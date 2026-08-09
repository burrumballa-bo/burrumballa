// Edge Function invocata dalla dashboard admin quando lo stato di
// un'iscrizione passa a "pagato_bonifico". Genera la ricevuta PDF
// (dati dinamici da `app_settings` + timbro da Storage) e la invia via
// email all'iscritto, con guardia anti-doppio-invio su
// `registrations.email_conferma_bonifico_inviata_at`.
//
// Deploy:
//   supabase functions deploy send-payment-confirmation
//
// Secret richiesti (Supabase -> Project Settings -> Edge Functions,
// oppure `supabase secrets set NOME=valore`):
//   RESEND_API_KEY   - API key di Resend (obbligatoria)
//   EMAIL_MITTENTE   - mittente di fallback "Nome <email@dominio>",
//                      usato solo se app_settings.email_mittente e' vuoto
//                      (opzionale, default onboarding@resend.dev)
//
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono iniettate automaticamente
// da Supabase in ogni Edge Function: servono qui per leggere/scrivere
// `registrations` e `app_settings` bypassando la RLS (la function e' un
// processo server-to-server, non un client anon/authenticated) e per
// scaricare il timbro dal bucket privato "assets".

import { createClient } from "npm:@supabase/supabase-js@2"
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "npm:pdf-lib@1.17.1"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const EMAIL_MITTENTE_FALLBACK =
  Deno.env.get("EMAIL_MITTENTE") ?? "Burrumballa <onboarding@resend.dev>"

const TIMBRO_BUCKET = "assets"
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
}

function isValidPayload(value: unknown): value is RequestPayload {
  if (!value || typeof value !== "object") return false
  const p = value as Record<string, unknown>
  return typeof p.registrationId === "string" && p.registrationId.length > 0
}

interface Registration {
  id: string
  nome: string
  cognome: string
  email: string
  workshop: string | null
  battle_categories: string[]
  payment_method: "bonifico" | "sul_posto"
  payment_status: "da_pagare" | "pagato_bonifico" | "pagato_in_loco"
  amount_workshop: number
  amount_battle: number
  surcharge_late: number
  surcharge_onsite: number
  amount_total: number
  created_at: string
  email_conferma_bonifico_inviata_at: string | null
}

interface AppSettings {
  email_mittente: string | null
  ricevuta_intestazione: string | null
  ricevuta_indirizzo: string | null
  ricevuta_piva_cf: string | null
  ricevuta_iban: string | null
  ricevuta_note: string | null
  timbro_url: string | null
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(date)
}

function receiptNumber(registration: Registration): string {
  return `SCS3-${registration.id.slice(0, 8).toUpperCase()}`
}

// I font standard di pdf-lib (Helvetica) usano la codifica WinAnsi e vanno
// in errore su caratteri fuori da quel set (es. emoji in una nota admin).
// I testi qui sotto arrivano da campi liberi (note, indirizzo, nomi): li
// sanifichiamo prima di disegnarli per non far fallire l'intera ricevuta.
function pdfSafeText(text: string): string {
  return Array.from(text)
    .map((char) => {
      const code = char.codePointAt(0) ?? 0
      const isSafe = (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff)
      return isSafe ? char : "?"
    })
    .join("")
}

function toBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

interface ReceiptLine {
  label: string
  amount: number
}

function buildReceiptLines(
  registration: Registration,
  workshopLabel: string | null,
  battleLabels: string[]
): ReceiptLine[] {
  const lines: ReceiptLine[] = []

  if (registration.amount_workshop > 0) {
    lines.push({
      label: pdfSafeText(`Workshop: ${workshopLabel ?? registration.workshop ?? "-"}`),
      amount: registration.amount_workshop,
    })
  }

  if (registration.amount_battle > 0) {
    const label = battleLabels.length > 0 ? battleLabels.join(", ") : "Battle"
    lines.push({
      label: pdfSafeText(`Battle: ${label}`),
      amount: registration.amount_battle,
    })
  }

  if (registration.surcharge_late > 0) {
    lines.push({
      label: "Maggiorazione iscrizione in ritardo",
      amount: registration.surcharge_late,
    })
  }

  if (registration.surcharge_onsite > 0) {
    lines.push({
      label: "Maggiorazione pagamento sul posto",
      amount: registration.surcharge_onsite,
    })
  }

  return lines
}

async function tryEmbedImage(pdfDoc: PDFDocument, bytes: Uint8Array) {
  try {
    return await pdfDoc.embedPng(bytes)
  } catch {
    try {
      return await pdfDoc.embedJpg(bytes)
    } catch {
      return null
    }
  }
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  options: {
    x: number
    y: number
    maxWidth: number
    font: PDFFont
    size: number
    lineHeight: number
    color?: ReturnType<typeof rgb>
  }
): number {
  const words = text.split(/\s+/).filter(Boolean)
  let line = ""
  let y = options.y
  const color = options.color ?? rgb(0.35, 0.35, 0.35)

  const flushLine = () => {
    if (!line) return
    page.drawText(line, { x: options.x, y, size: options.size, font: options.font, color })
    y -= options.lineHeight
    line = ""
  }

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (options.font.widthOfTextAtSize(candidate, options.size) > options.maxWidth) {
      flushLine()
      line = word
    } else {
      line = candidate
    }
  }
  flushLine()

  return y
}

async function buildReceiptPdf(params: {
  registration: Registration
  settings: AppSettings
  workshopLabel: string | null
  battleLabels: string[]
  stampBytes: Uint8Array | null
}): Promise<Uint8Array> {
  const { registration, settings, workshopLabel, battleLabels, stampBytes } = params

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89])
  const { width } = page.getSize()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const marginX = 50
  const contentWidth = width - marginX * 2
  const black = rgb(0.1, 0.1, 0.1)
  const gray = rgb(0.4, 0.4, 0.4)

  let y = 780

  // Intestazione associazione
  page.drawText(pdfSafeText(settings.ricevuta_intestazione ?? "Burrumballa APS"), {
    x: marginX,
    y,
    size: 18,
    font: fontBold,
    color: black,
  })
  y -= 22

  if (settings.ricevuta_indirizzo) {
    page.drawText(pdfSafeText(settings.ricevuta_indirizzo), {
      x: marginX,
      y,
      size: 10,
      font,
      color: gray,
    })
    y -= 14
  }
  if (settings.ricevuta_piva_cf) {
    page.drawText(pdfSafeText(settings.ricevuta_piva_cf), {
      x: marginX,
      y,
      size: 10,
      font,
      color: gray,
    })
    y -= 14
  }

  y -= 20
  page.drawLine({
    start: { x: marginX, y },
    end: { x: width - marginX, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  })
  y -= 28

  page.drawText("RICEVUTA DI PAGAMENTO", { x: marginX, y, size: 14, font: fontBold, color: black })
  y -= 20

  page.drawText(`N. ricevuta: ${receiptNumber(registration)}`, {
    x: marginX,
    y,
    size: 11,
    font,
    color: black,
  })
  y -= 16
  page.drawText(`Data: ${formatDate(new Date())}`, { x: marginX, y, size: 11, font, color: black })
  y -= 30

  page.drawText("Iscritto/a", { x: marginX, y, size: 10, font: fontBold, color: gray })
  y -= 15
  page.drawText(pdfSafeText(`${registration.nome} ${registration.cognome}`), {
    x: marginX,
    y,
    size: 12,
    font,
    color: black,
  })
  y -= 15
  page.drawText(pdfSafeText(registration.email), { x: marginX, y, size: 11, font, color: gray })
  y -= 35

  // Tabella voci
  const colDescX = marginX
  const colAmountX = width - marginX - 80

  page.drawText("Descrizione", { x: colDescX, y, size: 10, font: fontBold, color: gray })
  page.drawText("Importo", { x: colAmountX, y, size: 10, font: fontBold, color: gray })
  y -= 10
  page.drawLine({
    start: { x: marginX, y },
    end: { x: width - marginX, y },
    thickness: 0.75,
    color: rgb(0.8, 0.8, 0.8),
  })
  y -= 20

  const lines = buildReceiptLines(registration, workshopLabel, battleLabels)
  for (const line of lines) {
    page.drawText(line.label, { x: colDescX, y, size: 11, font, color: black })
    page.drawText(formatCurrency(line.amount), {
      x: colAmountX,
      y,
      size: 11,
      font,
      color: black,
    })
    y -= 20
  }

  y -= 5
  page.drawLine({
    start: { x: marginX, y },
    end: { x: width - marginX, y },
    thickness: 1,
    color: rgb(0.6, 0.6, 0.6),
  })
  y -= 25

  page.drawText("Totale pagato", { x: colDescX, y, size: 13, font: fontBold, color: black })
  page.drawText(formatCurrency(registration.amount_total), {
    x: colAmountX,
    y,
    size: 13,
    font: fontBold,
    color: black,
  })
  y -= 40

  if (settings.ricevuta_iban) {
    page.drawText(pdfSafeText(`IBAN: ${settings.ricevuta_iban}`), {
      x: marginX,
      y,
      size: 10,
      font,
      color: gray,
    })
    y -= 25
  }

  if (settings.ricevuta_note) {
    y = drawWrappedText(page, pdfSafeText(settings.ricevuta_note), {
      x: marginX,
      y,
      maxWidth: contentWidth,
      font,
      size: 9,
      lineHeight: 12,
    })
  }

  // Timbro: posizione fissa in basso a destra.
  if (stampBytes) {
    const stampImage = await tryEmbedImage(pdfDoc, stampBytes)
    if (stampImage) {
      const maxStampSize = 110
      const scale = Math.min(
        maxStampSize / stampImage.width,
        maxStampSize / stampImage.height,
        1
      )
      const stampWidth = stampImage.width * scale
      const stampHeight = stampImage.height * scale
      page.drawImage(stampImage, {
        x: width - marginX - stampWidth,
        y: 60,
        width: stampWidth,
        height: stampHeight,
      })
    }
  }

  return pdfDoc.save()
}

function buildEmailHtml(registration: Registration, settings: AppSettings): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="font-size: 20px;">Pagamento confermato — SENTI COME SUONA vol.3</h1>
      <p>Ciao ${registration.nome},</p>
      <p>Abbiamo ricevuto il tuo bonifico: la tua iscrizione a <strong>Senti Come Suona vol.3</strong> è confermata.</p>
      <p>In allegato trovi la ricevuta di pagamento in PDF.</p>
      <p>A presto,<br />${settings.ricevuta_intestazione ?? "Burrumballa"}</p>
    </div>
  `
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
  if (!RESEND_API_KEY) {
    return jsonResponse({ error: "RESEND_API_KEY non configurata" }, 500)
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
      "id, nome, cognome, email, workshop, battle_categories, payment_method, payment_status, amount_workshop, amount_battle, surcharge_late, surcharge_onsite, amount_total, created_at, email_conferma_bonifico_inviata_at"
    )
    .eq("id", payload.registrationId)
    .maybeSingle<Registration>()

  if (fetchError) {
    return jsonResponse({ error: "Errore lettura iscrizione", detail: fetchError.message }, 500)
  }
  if (!registration) {
    return jsonResponse({ error: "Iscrizione non trovata" }, 404)
  }
  if (registration.payment_status !== "pagato_bonifico") {
    return jsonResponse(
      { error: "L'iscrizione non è nello stato 'pagato_bonifico'" },
      409
    )
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
    .eq("payment_status", "pagato_bonifico")
    .is("email_conferma_bonifico_inviata_at", null)
    .select("id")
    .maybeSingle()

  if (claimError) {
    return jsonResponse({ error: "Errore aggiornamento iscrizione", detail: claimError.message }, 500)
  }
  if (!claimed) {
    return jsonResponse({ ok: true, skipped: true, reason: "already_sent" })
  }

  try {
    const { data: settingsRow, error: settingsError } = await supabaseAdmin
      .from("app_settings")
      .select(
        "email_mittente, ricevuta_intestazione, ricevuta_indirizzo, ricevuta_piva_cf, ricevuta_iban, ricevuta_note, timbro_url"
      )
      .eq("id", 1)
      .single<AppSettings>()

    if (settingsError) throw new Error(`Impostazioni non disponibili: ${settingsError.message}`)

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

    let stampBytes: Uint8Array | null = null
    if (settingsRow.timbro_url) {
      const { data: stampBlob, error: stampError } = await supabaseAdmin.storage
        .from(TIMBRO_BUCKET)
        .download(settingsRow.timbro_url)

      if (!stampError && stampBlob) {
        stampBytes = new Uint8Array(await stampBlob.arrayBuffer())
      }
    }

    const pdfBytes = await buildReceiptPdf({
      registration,
      settings: settingsRow,
      workshopLabel,
      battleLabels,
      stampBytes,
    })

    const fromAddress = settingsRow.email_mittente
      ? settingsRow.ricevuta_intestazione
        ? `${settingsRow.ricevuta_intestazione} <${settingsRow.email_mittente}>`
        : settingsRow.email_mittente
      : EMAIL_MITTENTE_FALLBACK

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [registration.email],
        subject: EMAIL_SUBJECT,
        html: buildEmailHtml(registration, settingsRow),
        attachments: [
          {
            filename: `ricevuta-${receiptNumber(registration)}.pdf`,
            content: toBase64(pdfBytes),
          },
        ],
      }),
    })

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text()
      throw new Error(`Invio email non riuscito: ${errorBody}`)
    }

    return jsonResponse({ ok: true, skipped: false })
  } catch (error) {
    // Rollback della guardia: la riga torna "non inviata" cosi' un
    // nuovo tentativo (cambio stato o retry manuale) puo' reinviare.
    await supabaseAdmin
      .from("registrations")
      .update({ email_conferma_bonifico_inviata_at: null })
      .eq("id", registration.id)

    const message = error instanceof Error ? error.message : "Errore sconosciuto"
    return jsonResponse({ error: "Invio ricevuta non riuscito", detail: message }, 502)
  }
})
