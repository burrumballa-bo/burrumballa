// Ricevute: PDF, numerazione, archivio e invio email. Condiviso da
// `send-payment-confirmation` (evento) e `issue-receipt` (scuola e
// ricevute libere): la numerazione e' unica.
//
// Il numero lo assegna il database (trigger su public.receipts); qui si
// inserisce la riga, si genera il PDF e lo si salva in
// assets/ricevute/<anno>/<numero>.pdf. Il PDF salvato non viene piu'
// rigenerato: i reinvii allegano sempre lo stesso file.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2"
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "npm:pdf-lib@1.17.1"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

export const ASSETS_BUCKET = "assets"

export type IncassoMethod = "contanti" | "bonifico" | "pos"

export const INCASSO_METHOD_LABELS: Record<IncassoMethod, string> = {
  contanti: "Contanti",
  bonifico: "Bonifico",
  pos: "POS",
}

export interface ReceiptSettings {
  ricevuta_intestazione: string | null
  ricevuta_indirizzo: string | null
  ricevuta_piva_cf: string | null
  ricevuta_iban: string | null
  ricevuta_note: string | null
  timbro_url: string | null
  firma_url: string | null
  presidente_nome: string | null
  email_mittente_generale: string | null
}

export const RECEIPT_SETTINGS_COLUMNS =
  "ricevuta_intestazione, ricevuta_indirizzo, ricevuta_piva_cf, ricevuta_iban, ricevuta_note, timbro_url, firma_url, presidente_nome, email_mittente_generale"

export interface ReceiptItem {
  description: string
  /** null = voce senza importo (es. attivita' incluse in un prezzo forfettario). */
  amount: number | null
}

/** Dati della ricevuta prima dell'emissione. */
export interface ReceiptDraft {
  issued_on?: string
  recipient_name: string
  recipient_tax_code?: string | null
  recipient_address?: string | null
  recipient_email?: string | null
  items: ReceiptItem[]
  total: number
  payment_method?: IncassoMethod | null
  notes?: string | null
  student_id?: string | null
  registration_id?: string | null
}

export interface ReceiptRow extends Required<Omit<ReceiptDraft, "issued_on">> {
  id: string
  year: number
  number: number
  issued_on: string
  pdf_path: string | null
  sent_at: string | null
  sent_to: string | null
  cancelled_at: string | null
}

export function formatReceiptNumber(row: { year: number; number: number }): string {
  return `${row.year}/${String(row.number).padStart(4, "0")}`
}

export function receiptFilename(row: { year: number; number: number }): string {
  return `ricevuta-${row.year}-${String(row.number).padStart(4, "0")}.pdf`
}

// numeric di Postgres puo' arrivare come stringa: si converte sempre.
export function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(value))
}

function formatDate(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map(Number)
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(new Date(y, m - 1, d))
}

export function todayIso(): string {
  // Fuso italiano: un'emissione poco dopo mezzanotte non deve finire nel giorno prima.
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date())
}

// I font standard di pdf-lib (Helvetica) usano la codifica WinAnsi e vanno
// in errore su caratteri fuori da quel set (es. emoji in una nota admin).
// I testi arrivano da campi liberi: li sanifichiamo prima di disegnarli.
// Caratteri WinAnsi fuori dai blocchi ASCII/Latin-1 (euro, virgolette tipografiche, trattini...).
const WIN_ANSI_EXTRA = new Set(Array.from("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ"))

export function pdfSafeText(text: string): string {
  return Array.from(text)
    .map((char) => {
      const code = char.codePointAt(0) ?? 0
      if (code === 0x202f) return " " // spazio stretto usato da Intl in alcuni formati
      const isSafe =
        (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.has(char)
      return isSafe ? char : "?"
    })
    .join("")
}

async function tryEmbedImage(pdfDoc: PDFDocument, bytes: Uint8Array | null): Promise<PDFImage | null> {
  if (!bytes) return null
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

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = []
  for (const paragraph of text.split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    let line = ""
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
        out.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    out.push(line)
  }
  return out
}

export interface ReceiptImages {
  stampBytes: Uint8Array | null
  signatureBytes: Uint8Array | null
}

async function downloadAsset(supabaseAdmin: SupabaseClient, path: string | null) {
  if (!path) return null
  const { data, error } = await supabaseAdmin.storage.from(ASSETS_BUCKET).download(path)
  if (error || !data) return null
  return new Uint8Array(await data.arrayBuffer())
}

export async function loadReceiptImages(
  supabaseAdmin: SupabaseClient,
  settings: ReceiptSettings
): Promise<ReceiptImages> {
  const [stampBytes, signatureBytes] = await Promise.all([
    downloadAsset(supabaseAdmin, settings.timbro_url),
    downloadAsset(supabaseAdmin, settings.firma_url),
  ])
  return { stampBytes, signatureBytes }
}

const PAGE_SIZE: [number, number] = [595.28, 841.89]
const MARGIN_X = 50
// Sotto questa quota c'e' lo spazio per timbro e firma.
const FOOTER_TOP = 170

export async function buildReceiptPdf(params: {
  settings: ReceiptSettings
  images: ReceiptImages
  /** "2026/0001" oppure "ANTEPRIMA". */
  numberLabel: string
  issuedOn: string
  receipt: Omit<ReceiptDraft, "issued_on">
}): Promise<Uint8Array> {
  const { settings, images, numberLabel, issuedOn, receipt } = params

  const pdfDoc = await PDFDocument.create()
  let page: PDFPage = pdfDoc.addPage(PAGE_SIZE)
  const { width } = page.getSize()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const contentWidth = width - MARGIN_X * 2
  const black = rgb(0.1, 0.1, 0.1)
  const gray = rgb(0.4, 0.4, 0.4)
  const lightGray = rgb(0.8, 0.8, 0.8)

  let y = 780

  // Voci lunghe o tante note: si continua su una nuova pagina.
  const ensureSpace = (needed: number) => {
    if (y - needed >= FOOTER_TOP) return
    page = pdfDoc.addPage(PAGE_SIZE)
    y = 780
  }

  const text = (
    value: string,
    opts: { x?: number; size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {}
  ) =>
    page.drawText(pdfSafeText(value), {
      x: opts.x ?? MARGIN_X,
      y,
      size: opts.size ?? 11,
      font: opts.bold ? fontBold : font,
      color: opts.color ?? black,
    })

  // Intestazione associazione
  text(settings.ricevuta_intestazione ?? "Burrumballa APS", { size: 18, bold: true })
  y -= 22
  for (const line of [settings.ricevuta_indirizzo, settings.ricevuta_piva_cf]) {
    if (!line) continue
    text(line, { size: 10, color: gray })
    y -= 14
  }

  y -= 20
  page.drawLine({ start: { x: MARGIN_X, y }, end: { x: width - MARGIN_X, y }, thickness: 1, color: lightGray })
  y -= 28

  text("RICEVUTA DI PAGAMENTO", { size: 14, bold: true })
  y -= 20
  text(`N. ricevuta: ${numberLabel}`)
  y -= 16
  text(`Data: ${formatDate(issuedOn)}`)
  y -= 30

  text("Ricevuto da", { size: 10, bold: true, color: gray })
  y -= 15
  text(receipt.recipient_name, { size: 12 })
  y -= 15
  for (const line of [
    receipt.recipient_tax_code ? `C.F. ${receipt.recipient_tax_code}` : null,
    receipt.recipient_address,
    receipt.recipient_email,
  ]) {
    if (!line) continue
    text(line, { color: gray })
    y -= 15
  }
  y -= 20

  // Tabella voci
  const colAmountX = width - MARGIN_X - 80
  const descWidth = colAmountX - MARGIN_X - 15

  text("Descrizione", { size: 10, bold: true, color: gray })
  text("Importo", { x: colAmountX, size: 10, bold: true, color: gray })
  y -= 10
  page.drawLine({ start: { x: MARGIN_X, y }, end: { x: width - MARGIN_X, y }, thickness: 0.75, color: lightGray })
  y -= 20

  for (const item of receipt.items) {
    const lines = wrapText(pdfSafeText(item.description), font, 11, descWidth)
    ensureSpace(lines.length * 14 + 6)
    if (item.amount !== null) text(formatCurrency(item.amount), { x: colAmountX })
    for (const line of lines) {
      text(line)
      y -= 14
    }
    y -= 6
  }

  ensureSpace(80)
  page.drawLine({ start: { x: MARGIN_X, y }, end: { x: width - MARGIN_X, y }, thickness: 1, color: rgb(0.6, 0.6, 0.6) })
  y -= 25
  text("Totale pagato", { size: 13, bold: true })
  text(formatCurrency(receipt.total), { x: colAmountX, size: 13, bold: true })
  y -= 22
  if (receipt.payment_method) {
    text(`Pagamento: ${INCASSO_METHOD_LABELS[receipt.payment_method]}`, { size: 10, color: gray })
    y -= 16
  }
  y -= 14

  const notes = [receipt.notes, settings.ricevuta_note].filter((n): n is string => !!n?.trim())
  if (receipt.payment_method === "bonifico" && settings.ricevuta_iban) {
    notes.unshift(`IBAN: ${settings.ricevuta_iban}`)
  }
  for (const note of notes) {
    for (const line of wrapText(pdfSafeText(note), font, 9, contentWidth)) {
      ensureSpace(12)
      text(line, { size: 9, color: gray })
      y -= 12
    }
    y -= 8
  }

  // Firma del presidente (in basso a destra) e timbro alla sua sinistra.
  const stamp = await tryEmbedImage(pdfDoc, images.stampBytes)
  const signature = await tryEmbedImage(pdfDoc, images.signatureBytes)
  const hasSignatureBlock = !!signature || !!settings.presidente_nome
  const sigWidth = 170
  const sigX = width - MARGIN_X - sigWidth

  if (hasSignatureBlock) {
    if (signature) {
      const scale = Math.min(160 / signature.width, 60 / signature.height, 1)
      const w = signature.width * scale
      const h = signature.height * scale
      page.drawImage(signature, { x: sigX + (sigWidth - w) / 2, y: 92, width: w, height: h })
    }
    page.drawLine({ start: { x: sigX, y: 88 }, end: { x: sigX + sigWidth, y: 88 }, thickness: 0.75, color: gray })
    const centered = (value: string, yPos: number, f: PDFFont) => {
      const safe = pdfSafeText(value)
      const w = f.widthOfTextAtSize(safe, 10)
      page.drawText(safe, { x: sigX + (sigWidth - w) / 2, y: yPos, size: 10, font: f, color: black })
    }
    centered("Il Presidente", 74, fontBold)
    if (settings.presidente_nome) centered(settings.presidente_nome, 60, font)
  }

  if (stamp) {
    const scale = Math.min(110 / stamp.width, 110 / stamp.height, 1)
    const w = stamp.width * scale
    const h = stamp.height * scale
    page.drawImage(stamp, {
      x: hasSignatureBlock ? sigX - w - 15 : width - MARGIN_X - w,
      y: 55,
      width: w,
      height: h,
    })
  }

  return pdfDoc.save()
}

/**
 * Emette una ricevuta: inserisce la riga (numero dal trigger), genera il PDF
 * e lo salva nello Storage. Se il PDF fallisce la riga resta senza pdf_path
 * e viene rigenerata al primo invio/download (vedi ensureReceiptPdf).
 */
export async function issueReceipt(
  supabaseAdmin: SupabaseClient,
  draft: ReceiptDraft,
  createdBy: string | null
): Promise<{ row: ReceiptRow; pdf: Uint8Array }> {
  const { data: row, error } = await supabaseAdmin
    .from("receipts")
    .insert({
      issued_on: draft.issued_on ?? todayIso(),
      recipient_name: draft.recipient_name.trim(),
      recipient_tax_code: draft.recipient_tax_code?.trim() || null,
      recipient_address: draft.recipient_address?.trim() || null,
      recipient_email: draft.recipient_email?.trim() || null,
      items: draft.items,
      total: draft.total,
      payment_method: draft.payment_method ?? null,
      notes: draft.notes?.trim() || null,
      student_id: draft.student_id ?? null,
      registration_id: draft.registration_id ?? null,
      created_by: createdBy,
    })
    .select("*")
    .single<ReceiptRow>()

  if (error || !row) throw new Error(`Emissione ricevuta non riuscita: ${error?.message}`)

  const pdf = await ensureReceiptPdf(supabaseAdmin, row)
  return { row, pdf }
}

async function loadSettings(supabaseAdmin: SupabaseClient): Promise<ReceiptSettings> {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select(RECEIPT_SETTINGS_COLUMNS)
    .eq("id", 1)
    .single<ReceiptSettings>()
  if (error || !data) throw new Error(`Impostazioni non disponibili: ${error?.message}`)
  return data
}

/** PDF archiviato della ricevuta; se manca lo genera e lo salva. */
export async function ensureReceiptPdf(
  supabaseAdmin: SupabaseClient,
  row: ReceiptRow
): Promise<Uint8Array> {
  if (row.pdf_path) {
    const stored = await downloadAsset(supabaseAdmin, row.pdf_path)
    if (stored) return stored
  }

  const settings = await loadSettings(supabaseAdmin)
  const pdf = await buildReceiptPdf({
    settings,
    images: await loadReceiptImages(supabaseAdmin, settings),
    numberLabel: formatReceiptNumber(row),
    issuedOn: row.issued_on,
    receipt: row,
  })

  const path = `ricevute/${row.year}/${String(row.number).padStart(4, "0")}.pdf`
  const { error: uploadError } = await supabaseAdmin.storage
    .from(ASSETS_BUCKET)
    .upload(path, pdf, { upsert: true, contentType: "application/pdf" })
  if (!uploadError) {
    await supabaseAdmin.from("receipts").update({ pdf_path: path }).eq("id", row.id)
    row.pdf_path = path
  }
  return pdf
}

/** Anteprima senza numero e senza scritture. */
export async function previewReceiptPdf(
  supabaseAdmin: SupabaseClient,
  draft: ReceiptDraft
): Promise<Uint8Array> {
  const settings = await loadSettings(supabaseAdmin)
  return buildReceiptPdf({
    settings,
    images: await loadReceiptImages(supabaseAdmin, settings),
    numberLabel: "ANTEPRIMA (non valida)",
    issuedOn: draft.issued_on ?? todayIso(),
    receipt: draft,
  })
}

export async function markReceiptSent(supabaseAdmin: SupabaseClient, id: string, to: string) {
  await supabaseAdmin
    .from("receipts")
    .update({ sent_at: new Date().toISOString(), sent_to: to })
    .eq("id", id)
}

// ---- Email ------------------------------------------------------------

export interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  fallbackFrom: string
}

export function smtpConfigFromEnv(): SmtpConfig | null {
  const host = Deno.env.get("SMTP_HOST")
  const port = Deno.env.get("SMTP_PORT")
  const user = Deno.env.get("SMTP_USER")
  const pass = Deno.env.get("SMTP_PASS")
  if (!host || !port || !user || !pass) return null
  return { host, port: Number(port), user, pass, fallbackFrom: Deno.env.get("SMTP_FROM") ?? user }
}

/** "Intestazione <indirizzo>", oppure il mittente di fallback dei secret. */
export function fromAddress(
  smtp: SmtpConfig,
  senderAddress: string | null | undefined,
  intestazione: string | null
): string {
  const address = senderAddress?.trim()
  if (!address) return smtp.fallbackFrom
  return intestazione ? `${intestazione} <${address}>` : address
}

export async function sendMail(
  smtp: SmtpConfig,
  mail: {
    from: string
    to: string
    subject: string
    text: string
    html: string
    attachment: { filename: string; content: Uint8Array }
  }
) {
  const client = new SMTPClient({
    connection: {
      hostname: smtp.host,
      port: smtp.port,
      tls: smtp.port === 465,
      auth: { username: smtp.user, password: smtp.pass },
    },
  })
  try {
    await client.send({
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      content: mail.text,
      html: mail.html,
      attachments: [
        {
          filename: mail.attachment.filename,
          content: mail.attachment.content,
          contentType: "application/pdf",
          encoding: "binary",
        },
      ],
    })
  } finally {
    await client.close()
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
