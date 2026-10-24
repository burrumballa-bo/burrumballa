import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Ban, Download, FilePlus2, Loader2, Mail, Search } from "lucide-react"
import { toast } from "sonner"

import {
  formatReceiptNumber,
  useCancelReceipt,
  useDownloadReceipt,
  useReceipts,
  useSendReceipt,
} from "@/hooks/useReceipts"
import { formatDateOnly } from "@/lib/datetime"
import { downloadBlob } from "@/lib/export"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { INCASSO_METHOD_LABELS } from "@/lib/paymentMethods"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogCloseButton, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReceiptModal } from "@/components/ReceiptModal"
import type { Receipt } from "@/types/receipt"

const ALL = "tutti"

function SendReceiptDialog({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  const send = useSendReceipt()
  const [to, setTo] = useState(receipt.recipient_email ?? "")

  const handleSend = () =>
    send.mutate(
      { id: receipt.id, to: to.trim() },
      {
        onSuccess: () => {
          toast.success(`Ricevuta ${formatReceiptNumber(receipt)} inviata a ${to.trim()}.`)
          onClose()
        },
        onError: (error) =>
          toast.error("Invio non riuscito.", { description: (error as Error).message }),
      }
    )

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogHeader>
        <DialogTitle>Invia ricevuta {formatReceiptNumber(receipt)}</DialogTitle>
        <DialogCloseButton onClick={onClose} />
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="send-to">Email destinatario</Label>
          <Input id="send-to" type="email" value={to} onChange={(e) => setTo(e.target.value)} />
          <p className="text-muted-foreground text-xs">
            Viene allegato il PDF già emesso, senza modifiche.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button disabled={!to.trim() || send.isPending} onClick={handleSend}>
            {send.isPending ? <Loader2 className="animate-spin" /> : <Mail />}
            Invia
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default function RicevutePage() {
  const navigate = useNavigate()
  const receiptsQuery = useReceipts()
  const download = useDownloadReceipt()
  const cancel = useCancelReceipt()

  const [search, setSearch] = useState("")
  const [year, setYear] = useState<string>(ALL)
  const [creating, setCreating] = useState(false)
  const [sending, setSending] = useState<Receipt | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const receipts = useMemo(() => receiptsQuery.data ?? [], [receiptsQuery.data])
  const years = [...new Set(receipts.map((r) => r.year))]

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return receipts.filter(
      (r) =>
        (year === ALL || String(r.year) === year) &&
        (!term ||
          r.recipient_name.toLowerCase().includes(term) ||
          formatReceiptNumber(r).includes(term) ||
          (r.recipient_email ?? "").toLowerCase().includes(term))
    )
  }, [receipts, search, year])

  const handleDownload = (r: Receipt) => {
    setDownloadingId(r.id)
    download.mutate(r.id, {
      onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
      onError: (error) =>
        toast.error("Download non riuscito.", { description: (error as Error).message }),
      onSettled: () => setDownloadingId(null),
    })
  }

  const handleCancel = (r: Receipt) => {
    const ok = window.confirm(
      `Annullare la ricevuta ${formatReceiptNumber(r)} di ${r.recipient_name}?\n\n` +
        "Il numero resta usato e la ricevuta resta in archivio come annullata. L'operazione non si può annullare."
    )
    if (!ok) return
    cancel.mutate(r.id, {
      onSuccess: () => toast.success(`Ricevuta ${formatReceiptNumber(r)} annullata.`),
      onError: (error) =>
        toast.error("Annullamento non riuscito.", { description: (error as Error).message }),
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-semibold">Ricevute</h1>
        </div>
        <Button onClick={() => setCreating(true)}>
          <FilePlus2 />
          Nuova ricevuta
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        Numerazione unica per scuola ed eventi, che riparte ogni anno. Le
        ricevute dell&apos;evento vengono emesse in automatico alla conferma
        del pagamento; quelle della scuola dalla scheda iscritto o da qui.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
          <Input
            className="pl-9"
            placeholder="Cerca per nome, email o numero"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {years.length > 1 && (
          <div className="w-36">
            <Select aria-label="Anno" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value={ALL}>Tutti gli anni</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {receiptsQuery.isError && (
        <p className="text-destructive text-sm">
          Errore nel caricamento delle ricevute: {(receiptsQuery.error as Error).message}
        </p>
      )}
      {receiptsQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento ricevute...</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N.</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Destinatario</TableHead>
                <TableHead className="text-right">Totale</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>
                  <span className="sr-only">Azioni</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                    Nessuna ricevuta.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => {
                  const cancelled = !!r.cancelled_at
                  return (
                    <TableRow key={r.id} className={cancelled ? "opacity-60" : undefined}>
                      <TableCell className="font-medium whitespace-nowrap tabular-nums">
                        {formatReceiptNumber(r)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDateOnly(r.issued_on)}</TableCell>
                      <TableCell>
                        <p className={cancelled ? "line-through" : undefined}>{r.recipient_name}</p>
                        <p className="text-muted-foreground text-xs">
                          {r.registration_id ? "Evento" : r.student_id ? "Scuola" : "Libera"}
                          {r.payment_method && ` · ${INCASSO_METHOD_LABELS[r.payment_method]}`}
                        </p>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap tabular-nums">
                        {formatCurrency(r.total)}
                      </TableCell>
                      <TableCell>
                        {cancelled ? (
                          <Badge variant="outline" className="border-destructive text-destructive">
                            Annullata
                          </Badge>
                        ) : r.sent_at ? (
                          <span className="text-xs" title={r.sent_to ?? undefined}>
                            Inviata {formatDateTime(r.sent_at)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Non inviata</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Scarica PDF"
                            title="Scarica PDF"
                            disabled={downloadingId === r.id}
                            onClick={() => handleDownload(r)}
                          >
                            {downloadingId === r.id ? <Loader2 className="animate-spin" /> : <Download />}
                          </Button>
                          {!cancelled && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Invia per email"
                                title="Invia per email"
                                onClick={() => setSending(r)}
                              >
                                <Mail />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                aria-label="Annulla ricevuta"
                                title="Annulla ricevuta"
                                disabled={cancel.isPending}
                                onClick={() => handleCancel(r)}
                              >
                                <Ban />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {creating && <ReceiptModal onClose={() => setCreating(false)} />}
      {sending && <SendReceiptDialog receipt={sending} onClose={() => setSending(null)} />}
    </div>
  )
}
