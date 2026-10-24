import { useMemo, useState, type ComponentProps } from "react"
import { Download, FileText, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogCloseButton, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ReceiptModal, type ReceiptSuggestion } from "@/components/ReceiptModal"
import { SchoolMembershipSection } from "@/components/SchoolMembershipSection"
import { StudentSubscriptionCard } from "@/components/StudentSubscriptionCard"
import { useAppSettings } from "@/hooks/useAppSettings"
import { useConfirm } from "@/hooks/useConfirm"
import { useCourses } from "@/hooks/useCourses"
import { formatReceiptNumber, useDownloadReceipt, useReceipts } from "@/hooks/useReceipts"
import {
  useChangeEntries,
  useDeleteSchoolStudent,
  useSaveSchoolStudent,
} from "@/hooks/useSchoolStudents"
import { formatDateOnly } from "@/lib/datetime"
import { downloadBlob } from "@/lib/export"
import { formatCurrency, isMinorenne } from "@/lib/format"
import {
  MEDICAL_CERT_BADGE_CLASSES,
  MEDICAL_CERT_LABELS,
  medicalCertStatus,
} from "@/lib/medicalCert"
import {
  CARD_STATUS_BADGE_CLASSES,
  CARD_STATUS_LABELS,
  draftToMembershipInput,
  emptyMembership,
  isMembershipDraftValid,
  membershipToDraft,
  type MembershipDraft,
} from "@/lib/memberships"
import { currentSeason, seasonLabel } from "@/lib/seasons"
import {
  draftToSubscriptionInput,
  emptySubscriptionDraft,
  pickFields,
  renewalDraft,
  subscriptionToDraft,
  type SubscriptionDraft,
} from "@/lib/subscriptionDrafts"
import {
  STUDENT_STATE_BADGE_CLASSES,
  STUDENT_STATE_LABELS,
  SUBSCRIPTION_KIND_LABELS,
  studentSubscriptionState,
  subscriptionValueLabel,
} from "@/lib/subscriptions"
import { cn } from "@/lib/utils"
import { weekdayLabel } from "@/lib/weekdays"
import type { SchoolStudent, SchoolStudentInput } from "@/types/school"

type Tab = "anagrafica" | "classi" | "abbonamenti" | "tessera" | "ricevute"

// Campi anagrafici come stringhe del form ("" = vuoto).
type ProfileFields = {
  [K in keyof SchoolStudentInput]: SchoolStudentInput[K] extends boolean ? boolean : string
}

function studentToProfile(s?: SchoolStudent): ProfileFields {
  return {
    first_name: s?.first_name ?? "",
    last_name: s?.last_name ?? "",
    email: s?.email ?? "",
    phone: s?.phone ?? "",
    birth_date: s?.birth_date ?? "",
    notes: s?.notes ?? "",
    tax_code: s?.tax_code ?? "",
    address: s?.address ?? "",
    guardian_name: s?.guardian_name ?? "",
    guardian_tax_code: s?.guardian_tax_code ?? "",
    guardian_email: s?.guardian_email ?? "",
    guardian_phone: s?.guardian_phone ?? "",
    medical_cert_expiry: s?.medical_cert_expiry ?? "",
    privacy_consent: s?.privacy_consent ?? false,
    photo_consent: s?.photo_consent ?? false,
  }
}

function profileToInput(p: ProfileFields): SchoolStudentInput {
  const text = (v: string) => v.trim() || null
  return {
    first_name: p.first_name.trim(),
    last_name: p.last_name.trim(),
    email: text(p.email),
    phone: text(p.phone),
    birth_date: p.birth_date || null,
    notes: text(p.notes),
    tax_code: text(p.tax_code)?.toUpperCase() ?? null,
    address: text(p.address),
    guardian_name: text(p.guardian_name),
    guardian_tax_code: text(p.guardian_tax_code)?.toUpperCase() ?? null,
    guardian_email: text(p.guardian_email),
    guardian_phone: text(p.guardian_phone),
    medical_cert_expiry: p.medical_cert_expiry || null,
    privacy_consent: p.privacy_consent,
    photo_consent: p.photo_consent,
  }
}

interface SchoolStudentModalProps {
  /** undefined = nuovo iscritto. */
  student?: SchoolStudent
  onClose: () => void
  /** Tab da aprire (default anagrafica). */
  initialTab?: Tab
}

export function SchoolStudentModal({ student, onClose, initialTab = "anagrafica" }: SchoolStudentModalProps) {
  const confirm = useConfirm()
  const coursesQuery = useCourses()
  const save = useSaveSchoolStudent()
  const remove = useDeleteSchoolStudent()
  const changeEntries = useChangeEntries()
  const settings = useAppSettings().data
  const receiptsQuery = useReceipts()
  const downloadReceipt = useDownloadReceipt()

  const [tab, setTab] = useState<Tab>(initialTab)
  const [profile, setProfile] = useState(() => studentToProfile(student))
  const [classIds, setClassIds] = useState<Set<string>>(new Set(student?.classIds ?? []))
  const [subs, setSubs] = useState<SubscriptionDraft[]>(() =>
    (student?.subscriptions ?? []).map(subscriptionToDraft)
  )
  const [deletedSubIds, setDeletedSubIds] = useState<string[]>([])

  const thisSeason = currentSeason(settings?.stagione_mese_inizio ?? 9)
  // null = stagione in corso (calcolata quando arrivano le impostazioni).
  const [pickedSeason, setPickedSeason] = useState<number | null>(null)
  const season = pickedSeason ?? thisSeason
  const [memberships, setMemberships] = useState<Record<number, MembershipDraft>>(() =>
    Object.fromEntries((student?.memberships ?? []).map((m) => [m.season, membershipToDraft(m)]))
  )
  // Solo le stagioni toccate vengono scritte al salvataggio.
  const [dirtySeasons, setDirtySeasons] = useState<Set<number>>(new Set())
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [entriesPendingId, setEntriesPendingId] = useState<string | null>(null)

  // Fotografia iniziale per sapere se ci sono modifiche non salvate.
  const [initialSnapshot] = useState(() =>
    JSON.stringify({
      profile: studentToProfile(student),
      classIds: [...(student?.classIds ?? [])].sort(),
      subs: (student?.subscriptions ?? []).map((s) => pickFields(subscriptionToDraft(s))),
    })
  )
  const isDirty =
    dirtySeasons.size > 0 ||
    deletedSubIds.length > 0 ||
    subs.some((s) => s.mode !== "view" || !s.id) ||
    JSON.stringify({
      profile,
      classIds: [...classIds].sort(),
      subs: subs.filter((s) => s.id).map(pickFields),
    }) !== initialSnapshot

  const courses = coursesQuery.data ?? []
  const serverSubs = useMemo(
    () => new Map((student?.subscriptions ?? []).map((s) => [s.id, s])),
    [student?.subscriptions]
  )
  const membershipDraft = memberships[season] ?? membershipToDraft(emptyMembership(season))
  const seasons = [
    ...new Set([thisSeason + 1, thisSeason, thisSeason - 1, ...Object.keys(memberships).map(Number)]),
  ].sort((a, b) => b - a)

  const set = <K extends keyof ProfileFields>(key: K, value: ProfileFields[K]) =>
    setProfile((prev) => ({ ...prev, [key]: value }))

  const minor = !!profile.birth_date && isMinorenne(profile.birth_date)
  const certStatus = medicalCertStatus(profile.medical_cert_expiry || null)

  // ---- Validazione per tab -----------------------------------------------
  const profileValid = profile.first_name.trim() !== "" && profile.last_name.trim() !== ""
  const subsPending = subs.some((s) => s.mode !== "view")
  const membershipsValid = [...dirtySeasons].every((s) => isMembershipDraftValid(memberships[s]))
  const tabErrors: Partial<Record<Tab, boolean>> = {
    anagrafica: !profileValid,
    abbonamenti: subsPending,
    tessera: !membershipsValid,
  }
  const isValid = !Object.values(tabErrors).some(Boolean)

  // ---- Abbonamenti --------------------------------------------------------
  // Piu' recente prima; le bozze nuove restano in cima.
  const sortedSubs = [...subs].sort((a, b) => {
    if ((a.mode === "new") !== (b.mode === "new")) return a.mode === "new" ? -1 : 1
    return b.start_date.localeCompare(a.start_date)
  })

  const updateSub = (key: string, patch: Partial<SubscriptionDraft>) =>
    setSubs((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)))

  const removeSub = async (sub: SubscriptionDraft) => {
    const ok = await confirm({
      title: "Eliminare questo abbonamento?",
      description: `${SUBSCRIPTION_KIND_LABELS[sub.kind]} dal ${formatDateOnly(sub.start_date)} al ${formatDateOnly(sub.end_date)}, ${formatCurrency(Number(sub.price))}.${sub.id ? "\n\nVerrà eliminato al salvataggio della scheda." : ""}`,
    })
    if (!ok) return
    setSubs((prev) => prev.filter((s) => s.key !== sub.key))
    if (sub.id) setDeletedSubIds((prev) => [...prev, sub.id!])
  }

  const cancelSub = (sub: SubscriptionDraft) => {
    if (sub.mode === "new") setSubs((prev) => prev.filter((s) => s.key !== sub.key))
    else updateSub(sub.key, { ...sub.backup, mode: "view", backup: undefined })
  }

  // Gli ingressi si segnano subito (con la data di oggi), anche con altre
  // modifiche in sospeso nella scheda.
  const handleEntries = (sub: SubscriptionDraft, delta: 1 | -1) => {
    if (!sub.id) return
    setEntriesPendingId(sub.id)
    changeEntries.mutate(
      { id: sub.id, delta },
      {
        onError: (error) =>
          toast.error("Aggiornamento ingressi non riuscito.", { description: (error as Error).message }),
        onSettled: () => setEntriesPendingId(null),
      }
    )
  }

  // ---- Tessera e quota ------------------------------------------------------
  const updateMembership = (patch: Partial<MembershipDraft>) => {
    setMemberships((prev) => ({
      ...prev,
      [season]: { ...(prev[season] ?? membershipToDraft(emptyMembership(season))), ...patch },
    }))
    setDirtySeasons((prev) => new Set(prev).add(season))
  }

  // ---- Ricevute -------------------------------------------------------------
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

  // Con un genitore indicato la ricevuta e' intestata a lui, con il
  // ragazzo in nota (serve per la detrazione delle spese sportive).
  const receiptInitial = student
    ? student.guardian_name
      ? {
          recipient_name: student.guardian_name,
          recipient_tax_code: student.guardian_tax_code ?? undefined,
          recipient_address: student.address ?? undefined,
          recipient_email: student.guardian_email ?? student.email ?? undefined,
          notes: `Per l'attività sportiva di ${student.first_name} ${student.last_name}${student.tax_code ? `, C.F. ${student.tax_code}` : ""}.`,
          student_id: student.id,
        }
      : {
          recipient_name: `${student.first_name} ${student.last_name}`,
          recipient_tax_code: student.tax_code ?? undefined,
          recipient_address: student.address ?? undefined,
          recipient_email: student.email ?? undefined,
          student_id: student.id,
        }
    : undefined

  // ---- Salvataggio / chiusura ----------------------------------------------
  const handleSave = () => {
    save.mutate(
      {
        id: student?.id,
        student: profileToInput(profile),
        classIds: [...classIds],
        subscriptions: subs.map((s) => ({ id: s.id, input: draftToSubscriptionInput(s) })),
        deletedSubscriptionIds: deletedSubIds,
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

  const requestClose = async () => {
    if (isDirty) {
      const ok = await confirm({
        title: "Uscire senza salvare?",
        description: "Le modifiche fatte in questa scheda andranno perse.",
        confirmLabel: "Esci senza salvare",
      })
      if (!ok) return
    }
    onClose()
  }

  const handleDelete = async () => {
    if (!student) return
    const ok = await confirm({
      title: `Eliminare ${student.first_name} ${student.last_name}?`,
      description:
        "Vengono eliminati anche classi, abbonamenti, ingressi, tessere e quote. Le ricevute emesse restano in archivio.",
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "anagrafica", label: "Anagrafica" },
    { id: "classi", label: `Classi (${classIds.size})` },
    { id: "abbonamenti", label: `Abbonamenti (${subs.length})` },
    { id: "tessera", label: "Tessera e quota" },
    ...(student ? [{ id: "ricevute" as Tab, label: `Ricevute (${studentReceipts.length})` }] : []),
  ]

  const subState = studentSubscriptionState(student?.subscriptions ?? [])
  const cardStatus = memberships[thisSeason]?.card_status ?? "da_fare"

  const field = (key: keyof ProfileFields, label: string, props: ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`st-${key}`}>{label}</Label>
      <Input
        id={`st-${key}`}
        value={profile[key] as string}
        onChange={(e) => set(key, e.target.value as never)}
        {...props}
      />
    </div>
  )

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && requestClose()} className="max-w-3xl">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle>
              {student
                ? `${profile.first_name || student.first_name} ${profile.last_name || student.last_name}`
                : "Nuovo iscritto"}
            </DialogTitle>
            {student && (
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className={STUDENT_STATE_BADGE_CLASSES[subState]}>
                  {STUDENT_STATE_LABELS[subState]}
                </Badge>
                <Badge variant="outline" className={CARD_STATUS_BADGE_CLASSES[cardStatus]}>
                  Tessera: {CARD_STATUS_LABELS[cardStatus].toLowerCase()}
                </Badge>
                {certStatus !== "ok" && (
                  <Badge variant="outline" className={MEDICAL_CERT_BADGE_CLASSES[certStatus]}>
                    {MEDICAL_CERT_LABELS[certStatus]}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <DialogCloseButton onClick={requestClose} />
        </DialogHeader>

        <div className="-mx-6 mb-5 overflow-x-auto border-b px-6" role="tablist">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative -mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors",
                  tab === t.id
                    ? "border-primary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                )}
              >
                {t.label}
                {tabErrors[t.id] && (
                  <span className="bg-destructive absolute top-1.5 right-0.5 size-1.5 rounded-full" aria-label="da completare" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[18rem] space-y-6">
          {tab === "anagrafica" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {field("first_name", "Nome *")}
                {field("last_name", "Cognome *")}
                {field("email", "Email", { type: "email" })}
                {field("phone", "Telefono", { type: "tel" })}
                {field("birth_date", "Data di nascita", { type: "date" })}
                {field("tax_code", "Codice fiscale", { className: "uppercase" })}
                <div className="sm:col-span-2">{field("address", "Indirizzo")}</div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div>
                  <h3 className="text-sm font-medium">Genitore / tutore</h3>
                  <p className="text-muted-foreground text-xs">
                    {minor
                      ? "Iscritto minorenne: indica chi paga, le ricevute saranno intestate a lui."
                      : "Facoltativo. Se compilato, le ricevute vengono intestate al genitore."}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {field("guardian_name", "Nome e cognome")}
                  {field("guardian_tax_code", "Codice fiscale", { className: "uppercase" })}
                  {field("guardian_email", "Email", { type: "email" })}
                  {field("guardian_phone", "Telefono", { type: "tel" })}
                </div>
              </div>

              <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="st-medical">Scadenza certificato medico</Label>
                  <Input
                    id="st-medical"
                    type="date"
                    value={profile.medical_cert_expiry}
                    onChange={(e) => set("medical_cert_expiry", e.target.value)}
                  />
                  <Badge variant="outline" className={MEDICAL_CERT_BADGE_CLASSES[certStatus]}>
                    {MEDICAL_CERT_LABELS[certStatus]}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                    Consenso privacy
                    <Switch
                      checked={profile.privacy_consent}
                      onCheckedChange={(v) => set("privacy_consent", v)}
                      aria-label="Consenso privacy"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                    Consenso foto e video
                    <Switch
                      checked={profile.photo_consent}
                      onCheckedChange={(v) => set("photo_consent", v)}
                      aria-label="Consenso foto e video"
                    />
                  </label>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="st-notes">Note</Label>
                  <Textarea
                    id="st-notes"
                    rows={2}
                    value={profile.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {tab === "classi" && (
            <div className="space-y-3">
              {coursesQuery.isLoading && <p className="text-muted-foreground text-sm">Caricamento...</p>}
              {courses.every((c) => c.levels.length === 0) && !coursesQuery.isLoading && (
                <p className="text-muted-foreground text-sm">
                  Nessuna classe disponibile: aggiungile da Scuola → Corsi e classi.
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
                            onCheckedChange={(checked) =>
                              setClassIds((prev) => {
                                const next = new Set(prev)
                                if (checked) next.add(level.id)
                                else next.delete(level.id)
                                return next
                              })
                            }
                          />
                          {level.level} · {weekdayLabel(level.day_of_week)}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab === "abbonamenti" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs">
                  Gli ingressi si segnano subito; il resto viene salvato con &quot;Salva&quot;.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={subs.some((s) => s.mode === "new")}
                  onClick={() => setSubs((prev) => [...prev, emptySubscriptionDraft()])}
                >
                  <Plus />
                  Aggiungi abbonamento
                </Button>
              </div>
              {subs.length === 0 && <p className="text-muted-foreground text-sm">Nessun abbonamento.</p>}
              {sortedSubs.map((sub) => {
                const server = sub.id ? serverSubs.get(sub.id) : undefined
                return (
                  <StudentSubscriptionCard
                    key={sub.key}
                    sub={sub}
                    entriesUsed={server?.entries_used ?? 0}
                    entryDates={server?.entry_dates ?? []}
                    onChange={(patch) => updateSub(sub.key, patch)}
                    onEdit={() => updateSub(sub.key, { mode: "edit", backup: pickFields(sub) })}
                    onDone={() => updateSub(sub.key, { mode: "view", backup: undefined })}
                    onCancel={() => cancelSub(sub)}
                    onRemove={() => removeSub(sub)}
                    onRenew={() => setSubs((prev) => [...prev, renewalDraft(sub)])}
                    onEntries={server ? (delta) => handleEntries(sub, delta) : undefined}
                    entriesPending={entriesPendingId === sub.id}
                  />
                )
              })}
              {subsPending && (
                <p className="text-destructive text-xs">
                  Premi &quot;Fatto&quot; o annulla gli abbonamenti in modifica per poter salvare.
                </p>
              )}
            </div>
          )}

          {tab === "tessera" && (
            <div>
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
                  Completa importo, metodo e data dei pagamenti di tessera e quota (anche nelle
                  altre stagioni modificate).
                </p>
              )}
            </div>
          )}

          {tab === "ricevute" && student && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs">
                  {isDirty
                    ? "Salva prima le modifiche: la ricevuta usa i dati salvati."
                    : student.guardian_name
                      ? `Le ricevute vengono intestate a ${student.guardian_name}.`
                      : "Le voci già pagate si aggiungono con un clic."}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isDirty}
                  onClick={() => setReceiptOpen(true)}
                >
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
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
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
          <div className="flex items-center gap-2">
            {isDirty && <span className="text-muted-foreground text-xs">Modifiche non salvate</span>}
            <Button type="button" variant="outline" onClick={requestClose}>
              Annulla
            </Button>
            <Button type="button" disabled={!isValid || save.isPending || !isDirty} onClick={handleSave}>
              {save.isPending && <Loader2 className="animate-spin" />}
              Salva
            </Button>
          </div>
        </div>
      </Dialog>
      {receiptOpen && receiptInitial && (
        <ReceiptModal
          initial={receiptInitial}
          suggestions={receiptSuggestions}
          onClose={() => setReceiptOpen(false)}
        />
      )}
    </>
  )
}
