import { useState } from "react"
import { Check, Download, FileText, Loader2, Minus, Pencil, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogCloseButton, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PaymentMethodSelect } from "@/components/PaymentMethodSelect"
import { ReceiptModal, type ReceiptSuggestion } from "@/components/ReceiptModal"
import { SchoolMembershipSection } from "@/components/SchoolMembershipSection"
import { useAppSettings } from "@/hooks/useAppSettings"
import { useConfirm } from "@/hooks/useConfirm"
import { useCourses } from "@/hooks/useCourses"
import { formatReceiptNumber, useDownloadReceipt, useReceipts } from "@/hooks/useReceipts"
import {
  useDeleteSchoolStudent,
  useDeleteSubscription,
  useSaveSchoolStudent,
  useSaveSubscription,
  useUpdateEntriesUsed,
} from "@/hooks/useSchoolStudents"
import { formatDateOnly } from "@/lib/datetime"
import { downloadBlob } from "@/lib/export"
import { formatCurrency } from "@/lib/format"
import {
  draftToMembershipInput,
  emptyMembership,
  isMembershipDraftValid,
  membershipToDraft,
  type MembershipDraft,
} from "@/lib/memberships"
import { INCASSO_METHOD_LABELS, type IncassoMethod } from "@/lib/paymentMethods"
import { currentSeason, seasonLabel } from "@/lib/seasons"
import {
  MAX_SUBSCRIPTION_ENTRIES,
  SUBSCRIPTION_BOX_CLASSES,
  SUBSCRIPTION_KIND_LABELS,
  subscriptionStatus,
  subscriptionValueLabel,
  suggestedEndDate,
  todayIso,
} from "@/lib/subscriptions"
import { cn } from "@/lib/utils"
import { weekdayLabel } from "@/lib/weekdays"
import type { SchoolStudent, SubscriptionInput, SubscriptionKind } from "@/types/school"

interface SubscriptionFields {
  kind: SubscriptionKind
  entries: string
  entries_used: number
  price: string
  start_date: string
  end_date: string
  /** "" = da pagare. */
  payment_method: IncassoMethod | ""
  paid_at: string
}

// "new" = in creazione (non ancora confermato), "edit" = in modifica,
// "saved" = confermato (sola lettura). `backup` e' lo stato da ripristinare
// se la modifica viene annullata.
interface SubscriptionDraft extends SubscriptionFields {
  key: string
  mode: "new" | "edit" | "saved"
  backup?: SubscriptionFields
}

function isSubscriptionValid(s: SubscriptionFields): boolean {
  const entries = Number(s.entries)
  return (
    s.price !== "" &&
    Number(s.price) >= 0 &&
    !!s.start_date &&
    !!s.end_date &&
    s.end_date >= s.start_date &&
    (s.payment_method === "" || !!s.paid_at) &&
    (s.kind !== "entries" ||
      (Number.isInteger(entries) &&
        entries >= 1 &&
        entries <= MAX_SUBSCRIPTION_ENTRIES &&
        s.entries_used <= entries))
  )
}

interface SchoolStudentModalProps {
  /** undefined = nuovo iscritto. */
  student?: SchoolStudent
  onClose: () => void
}

let draftCounter = 0
const newKey = () => `draft-${draftCounter++}`

export function SchoolStudentModal({ student, onClose }: SchoolStudentModalProps) {
  const confirm = useConfirm()
  const coursesQuery = useCourses()
  const save = useSaveSchoolStudent()
  const remove = useDeleteSchoolStudent()
  const saveSubscription = useSaveSubscription()
  const deleteSubscription = useDeleteSubscription()
  const updateEntriesUsed = useUpdateEntriesUsed()

  const [firstName, setFirstName] = useState(student?.first_name ?? "")
  const [lastName, setLastName] = useState(student?.last_name ?? "")
  const [email, setEmail] = useState(student?.email ?? "")
  const [phone, setPhone] = useState(student?.phone ?? "")
  const [birthDate, setBirthDate] = useState(student?.birth_date ?? "")
  const [notes, setNotes] = useState(student?.notes ?? "")
  const [classIds, setClassIds] = useState<Set<string>>(new Set(student?.classIds ?? []))
  const [subs, setSubs] = useState<SubscriptionDraft[]>(
    (student?.subscriptions ?? []).map((s) => ({
      key: s.id,
      mode: "saved" as const,
      kind: s.kind,
      entries: s.entries != null ? String(s.entries) : "",
      entries_used: s.entries_used,
      price: String(s.price),
      start_date: s.start_date,
      end_date: s.end_date,
      payment_method: s.payment_method ?? "",
      paid_at: s.paid_at ?? "",
    }))
  )

  const settings = useAppSettings().data
  const thisSeason = currentSeason(settings?.stagione_mese_inizio ?? 9)
  // null = stagione in corso (calcolata quando arrivano le impostazioni).
  const [pickedSeason, setPickedSeason] = useState<number | null>(null)
  const season = pickedSeason ?? thisSeason
  const [memberships, setMemberships] = useState<Record<number, MembershipDraft>>(() =>
    Object.fromEntries((student?.memberships ?? []).map((m) => [m.season, membershipToDraft(m)]))
  )
  // Solo le stagioni toccate vengono scritte al salvataggio.
  const [dirtySeasons, setDirtySeasons] = useState<Set<number>>(new Set())
  const membershipDraft = memberships[season] ?? membershipToDraft(emptyMembership(season))
  const seasons = [
    ...new Set([thisSeason + 1, thisSeason, thisSeason - 1, ...Object.keys(memberships).map(Number)]),
  ].sort((a, b) => b - a)

  const updateMembership = (patch: Partial<MembershipDraft>) => {
    setMemberships((prev) => ({
      ...prev,
      [season]: { ...(prev[season] ?? membershipToDraft(emptyMembership(season))), ...patch },
    }))
    setDirtySeasons((prev) => new Set(prev).add(season))
  }

  const [receiptOpen, setReceiptOpen] = useState(false)
  const receiptsQuery = useReceipts()
  const downloadReceipt = useDownloadReceipt()
  const studentReceipts = student
    ? (receiptsQuery.data ?? []).filter((r) => r.student_id === student.id)
    : []

  // Voci gia' pagate (dati salvati) proposte nella ricevuta con un clic.
  const receiptSuggestions: ReceiptSuggestion[] = student
    ? [
        ...student.subscriptions
          .filter((s) => s.payment_method)
          .map((s) => ({
            key: `sub-${s.id}`,
            description: `Abbonamento ${SUBSCRIPTION_KIND_LABELS[s.kind].toLowerCase()} (${subscriptionValueLabel(s)}) dal ${formatDateOnly(s.start_date)} al ${formatDateOnly(s.end_date)}`,
            amount: s.price,
            method: s.payment_method,
          })),
        ...student.memberships.flatMap((m) => [
          ...(m.card_status === "pagata"
            ? [
                {
                  key: `card-${m.id}`,
                  description: `Tessera stagione ${seasonLabel(m.season)}`,
                  amount: m.card_price ?? 0,
                  method: m.card_payment_method,
                },
              ]
            : []),
          ...(m.fee_paid
            ? [
                {
                  key: `fee-${m.id}`,
                  description: `Quota di iscrizione stagione ${seasonLabel(m.season)}`,
                  amount: m.fee_price ?? 0,
                  method: m.fee_payment_method,
                },
              ]
            : []),
        ]),
      ]
    : []

  const today = todayIso()
  const courses = coursesQuery.data ?? []

  // Le card ancora in creazione/modifica vanno confermate o annullate prima di salvare.
  const subsPending = subs.some((s) => s.mode !== "saved")
  const membershipsValid = [...dirtySeasons].every((s) => isMembershipDraftValid(memberships[s]))
  const isValid =
    firstName.trim() !== "" && lastName.trim() !== "" && !subsPending && membershipsValid

  // Piu' recente prima; le bozze nuove restano in cima.
  const sortedSubs = [...subs].sort((a, b) => {
    if ((a.mode === "new") !== (b.mode === "new")) return a.mode === "new" ? -1 : 1
    return b.start_date.localeCompare(a.start_date)
  })

  const toggleClass = (id: string, checked: boolean) =>
    setClassIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })

  const updateSub = (key: string, patch: Partial<SubscriptionDraft>) =>
    setSubs((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)))

  const addSub = () =>
    setSubs((prev) => [
      ...prev,
      {
        key: newKey(),
        mode: "new",
        kind: "monthly",
        entries: "",
        entries_used: 0,
        price: "",
        start_date: today,
        end_date: suggestedEndDate("monthly", today),
        payment_method: "",
        paid_at: "",
      },
    ])

  // Cambio tipo / data inizio: per mensile e trimestrale la fine e' proposta in automatico.
  const changeKind = (sub: SubscriptionDraft, kind: SubscriptionKind) =>
    updateSub(sub.key, {
      kind,
      end_date: kind === "entries" ? "" : suggestedEndDate(kind, sub.start_date),
    })
  const changeStart = (sub: SubscriptionDraft, start_date: string) =>
    updateSub(sub.key, {
      start_date,
      ...(sub.kind !== "entries" && { end_date: suggestedEndDate(sub.kind, start_date) }),
    })

  const startEdit = (sub: SubscriptionDraft) =>
    updateSub(sub.key, {
      mode: "edit",
      backup: {
        kind: sub.kind,
        entries: sub.entries,
        entries_used: sub.entries_used,
        price: sub.price,
        start_date: sub.start_date,
        end_date: sub.end_date,
        payment_method: sub.payment_method,
        paid_at: sub.paid_at,
      },
    })

  // Scegliendo un metodo la data di pagamento parte da oggi; "da pagare" la azzera.
  const changePayment = (sub: SubscriptionDraft, payment_method: IncassoMethod | "") =>
    updateSub(sub.key, {
      payment_method,
      paid_at: payment_method === "" ? "" : sub.paid_at || today,
    })

  const toInput = (s: SubscriptionFields): SubscriptionInput => ({
    kind: s.kind,
    entries: s.kind === "entries" ? Number(s.entries) : null,
    entries_used: s.kind === "entries" ? Math.min(s.entries_used, Number(s.entries)) : 0,
    price: Number(s.price),
    start_date: s.start_date,
    end_date: s.end_date,
    payment_method: s.payment_method || null,
    paid_at: s.payment_method ? s.paid_at : null,
  })

  // Per un iscritto esistente l'abbonamento viene salvato subito; per un nuovo
  // iscritto resta nella modale e viene scritto insieme all'anagrafica.
  const confirmSub = (sub: SubscriptionDraft) => {
    const done = (id: string) =>
      setSubs((prev) =>
        prev.map((s) =>
          s.key === sub.key ? { ...s, key: id, mode: "saved", backup: undefined } : s
        )
      )
    if (!student) return done(sub.key)
    saveSubscription.mutate(
      {
        studentId: student.id,
        id: sub.key.startsWith("draft-") ? undefined : sub.key,
        input: toInput(sub),
      },
      {
        onSuccess: done,
        onError: (error) =>
          toast.error("Salvataggio abbonamento non riuscito.", {
            description: (error as Error).message,
          }),
      }
    )
  }

  const removeSub = async (sub: SubscriptionDraft) => {
    const ok = await confirm({
      title: "Eliminare questo abbonamento?",
      description: `${SUBSCRIPTION_KIND_LABELS[sub.kind]} dal ${formatDateOnly(sub.start_date)} al ${formatDateOnly(sub.end_date)}, ${formatCurrency(Number(sub.price))}.`,
    })
    if (!ok) return
    const done = () => setSubs((prev) => prev.filter((s) => s.key !== sub.key))
    if (!student) return done()
    deleteSubscription.mutate(sub.key, {
      onSuccess: done,
      onError: (error) =>
        toast.error("Eliminazione abbonamento non riuscita.", {
          description: (error as Error).message,
        }),
    })
  }

  const changeUsed = (sub: SubscriptionDraft, delta: number) => {
    const total = Number(sub.entries)
    const next = Math.min(Math.max(sub.entries_used + delta, 0), total)
    if (next === sub.entries_used) return
    updateSub(sub.key, { entries_used: next })
    if (!student) return
    updateEntriesUsed.mutate(
      { id: sub.key, entries_used: next },
      {
        onError: (error) => {
          updateSub(sub.key, { entries_used: sub.entries_used })
          toast.error("Aggiornamento ingressi non riuscito.", {
            description: (error as Error).message,
          })
        },
      }
    )
  }

  const cancelSub = (sub: SubscriptionDraft) => {
    if (sub.mode === "new") setSubs((prev) => prev.filter((s) => s.key !== sub.key))
    else updateSub(sub.key, { ...sub.backup, mode: "saved", backup: undefined })
  }

  const handleSave = () => {
    save.mutate(
      {
        id: student?.id,
        student: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          birth_date: birthDate || null,
          notes: notes.trim() || null,
        },
        classIds: [...classIds],
        subscriptions: subs.map(toInput),
        memberships: [...dirtySeasons].map((s) => draftToMembershipInput(memberships[s])),
      },
      {
        onSuccess: () => {
          toast.success(student ? "Iscritto salvato." : "Iscritto creato.")
          onClose()
        },
        onError: (error) =>
          toast.error("Salvataggio non riuscito.", { description: (error as Error).message }),
      }
    )
  }

  const handleDelete = async () => {
    if (!student) return
    const ok = await confirm({
      title: `Eliminare ${student.first_name} ${student.last_name}?`,
      description:
        "Vengono eliminati anche classi, abbonamenti, tessere e quote. Le ricevute emesse restano in archivio.",
    })
    if (!ok) return
    remove.mutate(student.id, {
      onSuccess: () => {
        toast.success("Iscritto eliminato.")
        onClose()
      },
      onError: (error) =>
        toast.error("Eliminazione non riuscita.", { description: (error as Error).message }),
    })
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogHeader>
          <DialogTitle>{student ? `${student.first_name} ${student.last_name}` : "Nuovo iscritto"}</DialogTitle>
          <DialogCloseButton onClick={onClose} />
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="st-first">Nome *</Label>
              <Input id="st-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-last">Cognome *</Label>
              <Input id="st-last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-email">Email</Label>
              <Input id="st-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-phone">Telefono</Label>
              <Input id="st-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-birth">Data di nascita</Label>
              <Input id="st-birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="st-notes">Note</Label>
              <Textarea id="st-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-medium">Classi</h3>
            {coursesQuery.isLoading && <p className="text-muted-foreground text-sm">Caricamento...</p>}
            {courses.every((c) => c.levels.length === 0) && !coursesQuery.isLoading && (
              <p className="text-muted-foreground text-sm">
                Nessuna classe disponibile: aggiungile da Gestione corsi → Corsi.
              </p>
            )}
            {courses
              .filter((c) => c.levels.length > 0)
              .map((course) => (
                <div key={course.id} className="space-y-1.5">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className="border-input size-3 rounded-sm border"
                      style={{ backgroundColor: course.color }}
                      aria-hidden
                    />
                    {course.name}
                  </p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {course.levels.map((level) => (
                      <label key={level.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={classIds.has(level.id)}
                          onCheckedChange={(checked) => toggleClass(level.id, checked)}
                        />
                        {level.level} · {weekdayLabel(level.day_of_week)}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          <div className="border-t pt-4">
            <SchoolMembershipSection
              draft={membershipDraft}
              seasons={seasons}
              onSeasonChange={setPickedSeason}
              onChange={updateMembership}
              defaultCardPrice={settings?.prezzo_tessera ?? null}
              defaultFeePrice={settings?.prezzo_quota_iscrizione ?? null}
            />
            {!membershipsValid && (
              <p className="text-destructive mt-2 text-xs">
                Completa importo, metodo e data dei pagamenti di tessera e quota
                (anche nelle altre stagioni modificate).
              </p>
            )}
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Abbonamenti</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={subs.some((s) => s.mode === "new")}
                onClick={addSub}
              >
                <Plus />
                Aggiungi abbonamento
              </Button>
            </div>
            {subs.length === 0 && (
              <p className="text-muted-foreground text-sm">Nessun abbonamento.</p>
            )}
            {sortedSubs.map((sub) => {
              const editing = sub.mode !== "saved"
              const valid = isSubscriptionValid(sub)
              const complete = sub.start_date && sub.end_date
              const status = complete && !editing ? subscriptionStatus(sub, today) : null
              const invalidRange = complete && sub.end_date < sub.start_date
              return (
                <div
                  key={sub.key}
                  className={cn(
                    "space-y-3 rounded-md border p-3",
                    sub.mode === "new" && "border-primary border-2 border-dashed bg-primary/5",
                    sub.mode === "edit" && "border-primary border-2 bg-primary/5",
                    status && SUBSCRIPTION_BOX_CLASSES[status]
                  )}
                >
                  {editing ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold tracking-wide uppercase">
                          {sub.mode === "new" ? "Nuovo abbonamento" : "Modifica abbonamento"}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="shrink-0"
                          aria-label="Annulla abbonamento"
                          onClick={() => cancelSub(sub)}
                        >
                          <X />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>Tipo</Label>
                          <Select
                            aria-label="Tipo abbonamento"
                            className="bg-background/70"
                            value={sub.kind}
                            disabled={sub.mode === "edit"}
                            onChange={(e) => changeKind(sub, e.target.value as SubscriptionKind)}
                          >
                            {(Object.keys(SUBSCRIPTION_KIND_LABELS) as SubscriptionKind[]).map((k) => (
                              <option key={k} value={k}>
                                {SUBSCRIPTION_KIND_LABELS[k]}
                              </option>
                            ))}
                          </Select>
                        </div>
                        {sub.kind === "entries" && (
                          <div className="space-y-1.5">
                            <Label>Ingressi (max {MAX_SUBSCRIPTION_ENTRIES})</Label>
                            <Input
                              type="number"
                              min={1}
                              max={MAX_SUBSCRIPTION_ENTRIES}
                              step={1}
                              aria-label="Numero ingressi"
                              className="bg-background/70"
                              value={sub.entries}
                              onChange={(e) => updateSub(sub.key, { entries: e.target.value })}
                            />
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <Label>Prezzo (€) *</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            aria-label="Prezzo"
                            className="bg-background/70"
                            value={sub.price}
                            onChange={(e) => updateSub(sub.key, { price: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Pagamento</Label>
                          <PaymentMethodSelect
                            allowEmpty
                            emptyLabel="Da pagare"
                            aria-label="Metodo di pagamento abbonamento"
                            className="bg-background/70"
                            value={sub.payment_method}
                            onChange={(method) => changePayment(sub, method)}
                          />
                        </div>
                        {sub.payment_method !== "" && (
                          <div className="space-y-1.5">
                            <Label>Pagato il *</Label>
                            <Input
                              type="date"
                              aria-label="Data pagamento"
                              className="bg-background/70"
                              value={sub.paid_at}
                              onChange={(e) => updateSub(sub.key, { paid_at: e.target.value })}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span>Dal</span>
                        <Input
                          type="date"
                          aria-label="Data inizio"
                          className="bg-background/70 w-auto"
                          value={sub.start_date}
                          onChange={(e) => changeStart(sub, e.target.value)}
                        />
                        <span>al</span>
                        <Input
                          type="date"
                          aria-label="Data fine"
                          className="bg-background/70 w-auto"
                          value={sub.end_date}
                          onChange={(e) => updateSub(sub.key, { end_date: e.target.value })}
                        />
                      </div>
                      {invalidRange && (
                        <p className="text-destructive text-xs">
                          La data di fine deve essere successiva a quella di inizio.
                        </p>
                      )}
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          disabled={!valid || saveSubscription.isPending}
                          onClick={() => confirmSub(sub)}
                        >
                          {saveSubscription.isPending ? <Loader2 className="animate-spin" /> : <Check />}
                          Salva abbonamento
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">
                            {SUBSCRIPTION_KIND_LABELS[sub.kind]}
                            <span className="ml-2 rounded-full border px-2 py-0.5 text-xs font-medium">
                              {subscriptionValueLabel({
                                kind: sub.kind,
                                entries: sub.kind === "entries" ? Number(sub.entries) : null,
                              })}
                            </span>
                          </p>
                          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                            {formatCurrency(Number(sub.price))}
                            {sub.payment_method ? (
                              <span className="bg-background/60 rounded-full border px-2 py-0.5 text-xs font-normal">
                                Pagato {INCASSO_METHOD_LABELS[sub.payment_method]} ·{" "}
                                {formatDateOnly(sub.paid_at)}
                              </span>
                            ) : (
                              <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                Da pagare
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="shrink-0"
                            aria-label="Modifica abbonamento"
                            onClick={() => startEdit(sub)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive shrink-0"
                            aria-label="Rimuovi abbonamento"
                            disabled={deleteSubscription.isPending}
                            onClick={() => removeSub(sub)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs opacity-80">
                        {formatDateOnly(sub.start_date)} → {formatDateOnly(sub.end_date)}
                      </p>
                      {sub.kind === "entries" && (
                        <div className="bg-background/60 flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                          <div className="text-sm">
                            <p className="font-medium">
                              Rimasti: {Number(sub.entries) - sub.entries_used}
                            </p>
                            <p className="text-xs opacity-80">
                              Fatti {sub.entries_used} su {sub.entries}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="size-8"
                              aria-label="Togli un ingresso"
                              disabled={sub.entries_used <= 0}
                              onClick={() => changeUsed(sub, -1)}
                            >
                              <Minus />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="size-8"
                              aria-label="Aggiungi un ingresso"
                              disabled={sub.entries_used >= Number(sub.entries)}
                              onClick={() => changeUsed(sub, 1)}
                            >
                              <Plus />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
            {subsPending && (
              <p className="text-muted-foreground text-xs">
                Conferma o annulla gli abbonamenti in modifica per poter salvare l'iscritto.
              </p>
            )}
          </div>

          {student && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Ricevute</h3>
                <Button type="button" size="sm" variant="outline" onClick={() => setReceiptOpen(true)}>
                  <FileText />
                  Crea ricevuta
                </Button>
              </div>
              {studentReceipts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nessuna ricevuta emessa.</p>
              ) : (
                <ul className="divide-y rounded-md border text-sm">
                  {studentReceipts.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className={cn(r.cancelled_at && "text-muted-foreground line-through")}>
                        N. {formatReceiptNumber(r)} · {formatDateOnly(r.issued_on)} ·{" "}
                        {formatCurrency(r.total)}
                        {r.cancelled_at && " (annullata)"}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        aria-label={`Scarica ricevuta ${formatReceiptNumber(r)}`}
                        disabled={downloadReceipt.isPending}
                        onClick={() =>
                          downloadReceipt.mutate(r.id, {
                            onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
                            onError: (error) =>
                              toast.error("Download non riuscito.", {
                                description: (error as Error).message,
                              }),
                          })
                        }
                      >
                        <Download />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            {student ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                disabled={remove.isPending}
                onClick={handleDelete}
              >
                {remove.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
                Elimina
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="button" disabled={!isValid || save.isPending} onClick={handleSave}>
                {save.isPending && <Loader2 className="animate-spin" />}
                Salva
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
      {receiptOpen && student && (
        <ReceiptModal
          initial={{
            recipient_name: `${student.first_name} ${student.last_name}`,
            recipient_email: student.email ?? undefined,
            student_id: student.id,
          }}
          suggestions={receiptSuggestions}
          onClose={() => setReceiptOpen(false)}
        />
      )}
    </>
  )
}
