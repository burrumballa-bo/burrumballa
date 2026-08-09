import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

import { formatCurrency, formatDate } from "@/lib/format"
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/paymentStatus"
import type { Registration } from "@/types/registration"

type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } }

interface ExportRegistrationsPdfInput {
  registrations: Registration[]
  workshopLabels: Record<string, string>
  battleLabels: Record<string, string>
  eventTitle?: string | null
  eventDate?: string | null
  statusLabel: string
  searchTerm: string
}

function battleLabel(registration: Registration, battleLabels: Record<string, string>) {
  return registration.battle_categories
    .map((chiave) => battleLabels[chiave] ?? chiave)
    .filter((label) => label && !/nessuna battle/i.test(label))
    .join(", ")
}

export function exportRegistrationsPdf({
  registrations,
  workshopLabels,
  battleLabels,
  eventTitle,
  eventDate,
  statusLabel,
  searchTerm,
}: ExportRegistrationsPdfInput) {
  const doc = new jsPDF({ orientation: "landscape" }) as DocWithAutoTable
  const margin = 14

  doc.setFontSize(16)
  doc.setTextColor(20)
  doc.text(eventTitle?.trim() || "Elenco iscritti", margin, 16)

  doc.setFontSize(10)
  doc.setTextColor(100)
  let headerY = 23
  if (eventDate) {
    doc.text(`Data evento: ${formatDate(eventDate)}`, margin, headerY)
    headerY += 5
  }
  const filterParts = [`Filtro stato: ${statusLabel}`]
  if (searchTerm.trim()) filterParts.push(`Ricerca: "${searchTerm.trim()}"`)
  doc.text(filterParts.join(" — "), margin, headerY)
  headerY += 5
  doc.text(`Esportato il ${formatDate(new Date().toISOString())}`, margin, headerY)
  headerY += 4

  const sorted = [...registrations].sort((a, b) => {
    const cognome = a.cognome.localeCompare(b.cognome, "it")
    if (cognome !== 0) return cognome
    return a.nome.localeCompare(b.nome, "it")
  })

  const rows = sorted.map((r) => [
    r.nome,
    r.cognome,
    r.aka || "—",
    r.email,
    (r.workshop && workshopLabels[r.workshop]) || r.workshop || "—",
    battleLabel(r, battleLabels) || "—",
    PAYMENT_METHOD_LABELS[r.payment_method],
    PAYMENT_STATUS_LABELS[r.payment_status],
    formatCurrency(r.amount_total),
  ])

  autoTable(doc, {
    startY: headerY + 4,
    margin: { left: margin, right: margin },
    head: [["Nome", "Cognome", "Aka", "Email", "Workshop", "Battle", "Metodo", "Stato", "Totale"]],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    columnStyles: {
      8: { halign: "right" },
    },
  })

  const totale = registrations.length
  const incassato = registrations
    .filter((r) => r.payment_status !== "da_pagare")
    .reduce((sum, r) => sum + r.amount_total, 0)
  const daIncassare = registrations
    .filter((r) => r.payment_status === "da_pagare")
    .reduce((sum, r) => sum + r.amount_total, 0)

  const finalY = doc.lastAutoTable?.finalY ?? headerY + 4
  let footerY = finalY + 8
  if (footerY > doc.internal.pageSize.getHeight() - 14) {
    doc.addPage()
    footerY = 16
  }

  doc.setFontSize(10)
  doc.setTextColor(20)
  doc.text(`Iscritti in elenco: ${totale}`, margin, footerY)
  doc.text(`Incassato: ${formatCurrency(incassato)}`, margin, footerY + 5)
  doc.text(`Da incassare: ${formatCurrency(daIncassare)}`, margin, footerY + 10)

  const fileNameParts = [
    "iscritti",
    eventTitle?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    new Date().toISOString().slice(0, 10),
  ].filter(Boolean)

  doc.save(`${fileNameParts.join("-")}.pdf`)
}
