import { useEffect, useState } from "react"
import { CheckCircle2, Download, Eye, Loader2, Mail, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogCloseButton, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PaymentMethodSelect } from "@/components/PaymentMethodSelect"
import {
  formatReceiptNumber,
  useIssueReceipt,
  usePreviewReceipt,
  type IssueReceiptResult,
} from "@/hooks/useReceipts"
import { downloadBlob } from "@/lib/export"
import { formatCurrency } from "@/lib/format"
import type { IncassoMethod } from "@/lib/paymentMethods"
import { todayIso } from "@/lib/subscriptions"
import type { ReceiptDraftInput } from "@/types/receipt"

/** Voce proponibile con un clic (es. un abbonamento dell'iscritto). */
export interface ReceiptSuggestion {
  key: string
  description: string
  amount: number
  method: IncassoMethod | null
}

export interface ReceiptInitialValues {
  recipient_name?: string
  recipient_email?: string
  student_id?: string
}

interface ItemDraft {
  key: string
  description: string
  amount: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

let itemCounter = 0
const newItem = (description = "", amount = ""): ItemDraft => ({
  key: `item-${itemCounter++}`,
  description,
  amount,
})

interface ReceiptModalProps {
  initial?: ReceiptInitialValues
  suggestions?: ReceiptSuggestion[]
  onClose: () => void
}

export function ReceiptModal({ initial, suggestions = [], onClose }: ReceiptModalProps) {
  const preview = usePreviewReceipt()
  const issue = useIssueReceipt()

  const [name, setName] = useState(initial?.recipient_name ?? "")
  const [taxCode, setTaxCode] = useState("")
  const [address, setAddress] = useState("")
  const [email, setEmail] = useState(initial?.recipient_email ?? "")
  const [issuedOn, setIssuedOn] = useState(todayIso())
  const [method, setMethod] = useState<IncassoMethod | "">("")
  const [items, setItems] = useState<ItemDraft[]>(suggestions.length > 0 ? [] : [newItem()])
  const [usedSuggestions, setUsedSuggestions] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<IssueReceiptResult | null>(null)

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const amounts = items.map((it) => Number(it.amount.replace(",", ".")))
  const total = amounts.reduce((sum, a) => sum + (Number.isFinite(a) ? a : 0), 0)
  const itemsValid =
    items.length > 0 &&
    items.every((it, i) => it.description.trim() !== "" && it.amount.trim() !== "" && amounts[i] >= 0)
  const emailValid = email.trim() === "" || EMAIL_RE.test(email.trim())
  const isValid = name.trim() !== "" && itemsValid && emailValid && !!issuedOn
  const busy = preview.isPending || issue.isPending

  const updateItem = (key: string, patch: Partial<ItemDraft>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)))

  const addSuggestion = (s: ReceiptSuggestion) => {
    setItems((prev) => [
      ...prev.filter((it) => it.description.trim() || it.amount.trim()),
      newItem(s.description, String(s.amount)),
    ])
    setUsedSuggestions((prev) => new Set(prev).add(s.key))
    if (!method && s.method) setMethod(s.method)
  }

  const toDraft = (): ReceiptDraftInput => ({
    issued_on: issuedOn,
    recipient_name: name.trim(),
    recipient_tax_code: taxCode.trim() || null,
    recipient_address: address.trim() || null,
    recipient_email: email.trim() || null,
    items: items.map((it, i) => ({ description: it.description.trim(), amount: amounts[i] })),
    payment_method: method || null,
    notes: notes.trim() || null,
    student_id: initial?.student_id ?? null,
  })

  const handlePreview = () =>
    preview.mutate(toDraft(), {
      onSuccess: (blob) => setPreviewUrl(URL.createObjectURL(blob)),
      onError: (error) =>
        toast.error("Anteprima non riuscita.", { description: (error as Error).message }),
    })

  const filename = (r: IssueReceiptResult) =>
    `ricevuta-${r.receipt.year}-${String(r.receipt.number).padStart(4, "0")}.pdf`

  const handleIssue = (send: boolean) => {
    const confirmed = window.confirm(
      `Emettere la ricevuta di ${formatCurrency(total)} a ${name.trim()}?\n\n` +
        "Riceverà il numero progressivo e non potrà più essere modificata: in caso di errore andrà annullata ed emessa di nuovo."
    )
    if (!confirmed) return
    issue.mutate(
      { receipt: toDraft(), send },
      {
        onSuccess: (res) => {
          setResult(res)
          if (!send) downloadBlob(res.pdf, filename(res))
          if (res.email === "failed") {
            toast.error("Ricevuta emessa, ma l'invio email non è riuscito.", {
              description: res.emailError ?? undefined,
            })
          }
        },
        onError: (error) =>
          toast.error("Emissione non riuscita.", { description: (error as Error).message }),
      }
    )
  }

  if (result) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogHeader>
          <DialogTitle>Ricevuta emessa</DialogTitle>
          <DialogCloseButton onClick={onClose} />
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-green-600 bg-green-500/10 p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                Ricevuta n. {formatReceiptNumber(result.receipt)} · {formatCurrency(total)}
              </p>
              {result.email === "sent" && <p>Inviata via email a {email.trim()}.</p>}
              {result.email === "failed" && (
                <p className="text-destructive">
                  Email non inviata: puoi riprovare da Ricevute.
                </p>
              )}
              {result.email === "not_requested" && <p>PDF scaricato.</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => downloadBlob(result.pdf, filename(result))}>
              <Download />
              Scarica PDF
            </Button>
            <Button onClick={onClose}>Chiudi</Button>
          </div>
        </div>
      </Dialog>
    )
  }

  if (previewUrl) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogHeader>
          <DialogTitle>Anteprima ricevuta</DialogTitle>
          <DialogCloseButton onClick={onClose} />
        </DialogHeader>
        <div className="space-y-4">
          <iframe
            src={previewUrl}
            title="Anteprima ricevuta"
            className="h-[60vh] w-full rounded-md border bg-white"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setPreviewUrl(null)}>
              <Pencil />
              Modifica
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => handleIssue(false)}>
              {issue.isPending ? <Loader2 className="animate-spin" /> : <Download />}
              Emetti e scarica
            </Button>
            <Button disabled={busy || !email.trim()} onClick={() => handleIssue(true)}>
              {issue.isPending ? <Loader2 className="animate-spin" /> : <Mail />}
              Emetti e invia
            </Button>
          </div>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogHeader>
        <DialogTitle>Nuova ricevuta</DialogTitle>
        <DialogCloseButton onClick={onClose} />
      </DialogHeader>

      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Destinatario</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rc-name">Nome e cognome *</Label>
              <Input id="rc-name" value={name} onChange={(e) => setName(e.target.value)} />
              <p className="text-muted-foreground text-xs">
                Per un minore intesta a chi paga (es. il genitore) e indica il
                ragazzo nelle note.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rc-cf">Codice fiscale</Label>
              <Input
                id="rc-cf"
                className="uppercase"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rc-email">Email</Label>
              <Input
                id="rc-email"
                type="email"
                aria-invalid={!emailValid}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rc-address">Indirizzo</Label>
              <Input id="rc-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Voci</h3>
            <Button type="button" size="sm" variant="outline" onClick={() => setItems((p) => [...p, newItem()])}>
              <Plus />
              Aggiungi voce
            </Button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  disabled={usedSuggestions.has(s.key)}
                  onClick={() => addSuggestion(s)}
                  className="hover:bg-accent rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-40"
                >
                  + {s.description} · {formatCurrency(s.amount)}
                </button>
              ))}
            </div>
          )}
          {items.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Scegli una voce qui sopra o aggiungine una a mano.
            </p>
          )}
          {items.map((it) => (
            <div key={it.key} className="flex items-start gap-2">
              <Input
                aria-label="Descrizione voce"
                placeholder="Descrizione"
                className="flex-1"
                value={it.description}
                onChange={(e) => updateItem(it.key, { description: e.target.value })}
              />
              <Input
                aria-label="Importo voce"
                placeholder="€"
                type="number"
                min={0}
                step="0.01"
                className="w-28"
                value={it.amount}
                onChange={(e) => updateItem(it.key, { amount: e.target.value })}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-destructive shrink-0"
                aria-label="Rimuovi voce"
                onClick={() => setItems((p) => p.filter((x) => x.key !== it.key))}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <div className="flex justify-end text-sm">
            <span className="text-muted-foreground mr-3">Totale</span>
            <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rc-method">Pagato con</Label>
            <PaymentMethodSelect
              id="rc-method"
              allowEmpty
              emptyLabel="Non indicato"
              value={method}
              onChange={setMethod}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rc-date">Data ricevuta *</Label>
            <Input id="rc-date" type="date" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="rc-notes">Note</Label>
            <Textarea
              id="rc-notes"
              rows={2}
              placeholder="Es. pagamento per l'attività sportiva del minore ..., C.F. ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <p className="text-muted-foreground text-xs">
            Numero, timbro e firma vengono aggiunti all&apos;emissione.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="button" variant="outline" disabled={!isValid || busy} onClick={handlePreview}>
              {preview.isPending ? <Loader2 className="animate-spin" /> : <Eye />}
              Anteprima
            </Button>
            <Button type="button" variant="outline" disabled={!isValid || busy} onClick={() => handleIssue(false)}>
              {issue.isPending ? <Loader2 className="animate-spin" /> : <Download />}
              Emetti e scarica
            </Button>
            <Button type="button" disabled={!isValid || busy || !email.trim()} onClick={() => handleIssue(true)}>
              {issue.isPending ? <Loader2 className="animate-spin" /> : <Mail />}
              Emetti e invia
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
