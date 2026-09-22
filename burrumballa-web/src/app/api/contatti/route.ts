import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

import { contactRequestSchema, type ContactRequest } from "@/lib/contact/schema"
import { getOrgInfo } from "@/lib/org-info"

// Invio del form contatti del sito. Sta qui e non in una Edge Function
// Supabase per due motivi, entrambi emersi sul campo:
//
//  1. una route dello stesso sito è same-origin, quindi il browser non fa
//     il preflight CORS: una sola chiamata per invio, non due;
//  2. il runtime edge di Supabase dà a ogni worker un tetto di CPU di
//     un paio di secondi, e una sessione SMTP lo sfonda ("CPU Time
//     exceeded" → 546 WORKER_RESOURCE_LIMIT). Qui gira su Node, dove
//     nodemailer è a casa sua.
//
// Il destinatario NON arriva dal client: lo legge il server dalla view
// pubblica `org_info` (cioè `app_settings.email_contatti`, gestita in admin
// → Impostazioni), così l'indirizzo non finisce nell'HTML pubblico e il
// form non può essere dirottato verso terzi.
//
// Variabili d'ambiente richieste sull'hosting del sito (le stesse credenziali
// già usate dalle Edge Functions dell'evento):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
//   SMTP_FROM (opzionale, default SMTP_USER) — è la casella autenticata e
//   resta lei il From tecnico: l'email di chi scrive va in Reply-To, perché
//   molti provider rifiutano un From di terzi.

export const runtime = "nodejs"

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_FROM = process.env.SMTP_FROM ?? SMTP_USER ?? ""

// Il messaggio arriva da un form pubblico e finisce dentro un'email HTML:
// va escapato, altrimenti chi scrive può iniettare markup nella casella di
// chi legge.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// Oggetto e indirizzi finiscono in header SMTP: un a capo iniettato lì
// permetterebbe di aggiungere header arbitrari (header injection).
function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim()
}

function buildSubject(payload: ContactRequest): string {
  const argomento = payload.argomento || "Richiesta di informazioni"
  return singleLine(`[Sito] ${argomento} — ${payload.nome}`)
}

function buildText(payload: ContactRequest): string {
  return [
    payload.argomento || "Richiesta di informazioni",
    "",
    `Nome: ${payload.nome}`,
    `Email: ${payload.email}`,
    payload.telefono ? `Telefono: ${payload.telefono}` : null,
    payload.pagina ? `Pagina: ${payload.pagina}` : null,
    "",
    "Messaggio:",
    payload.messaggio,
  ]
    .filter((line) => line !== null)
    .join("\n")
}

function buildHtml(payload: ContactRequest): string {
  const righe = [
    ["Nome", payload.nome],
    ["Email", payload.email],
    ...(payload.telefono ? [["Telefono", payload.telefono]] : []),
    ...(payload.pagina ? [["Pagina", payload.pagina]] : []),
  ]
    .map(
      ([label, value]) =>
        `<li><strong>${label}:</strong> ${escapeHtml(value)}</li>`,
    )
    .join("")

  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h1 style="font-size: 18px;">${escapeHtml(
        payload.argomento || "Richiesta di informazioni",
      )}</h1>
      <ul>${righe}</ul>
      <p style="white-space: pre-wrap;">${escapeHtml(payload.messaggio)}</p>
      <hr style="border: none; border-top: 1px solid #ddd;" />
      <p style="font-size: 12px; color: #666;">
        Messaggio inviato dal form contatti del sito. Rispondendo a questa
        email scrivi direttamente a ${escapeHtml(payload.email)}.
      </p>
    </div>
  `
}

export async function POST(request: Request) {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error("[contatti] configurazione SMTP incompleta")
    return NextResponse.json(
      { error: "Configurazione email incompleta" },
      { status: 500 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body non valido" }, { status: 400 })
  }

  const parsed = contactRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 })
  }
  const payload = parsed.data

  // Honeypot compilato: è un bot. Rispondiamo ok senza inviare nulla, così
  // non impara che il campo è una trappola.
  if (payload.website) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const { email_contatto: destinatario } = await getOrgInfo()
  if (!destinatario) {
    console.error("[contatti] nessuna email contatti configurata")
    return NextResponse.json(
      { error: "Destinatario non configurato" },
      { status: 500 },
    )
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: singleLine(destinatario),
      replyTo: singleLine(payload.email),
      subject: buildSubject(payload),
      text: buildText(payload),
      html: buildHtml(payload),
    })
  } catch (error) {
    console.error("[contatti] invio non riuscito", error)
    return NextResponse.json(
      { error: "Invio del messaggio non riuscito" },
      { status: 502 },
    )
  } finally {
    transporter.close()
  }

  return NextResponse.json({ ok: true })
}
