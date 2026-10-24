export function nomeFile(...parti: string[]): string {
  return parti
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function cellaCsv(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Separatore ";" e BOM UTF-8: è il formato che Excel in italiano apre
// direttamente in colonne, con gli accenti corretti.
export function downloadCsv(filename: string, rows: string[][]) {
  const linee = rows.map((cells) => cells.map(cellaCsv).join(";"))
  downloadBlob(new Blob(["﻿" + linee.join("\r\n")], { type: "text/csv;charset=utf-8" }), `${filename}.csv`)
}
