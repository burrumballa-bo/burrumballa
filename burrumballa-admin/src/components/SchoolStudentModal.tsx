import { useState } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogCloseButton, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCourses } from "@/hooks/useCourses"
import { useDeleteSchoolStudent, useSaveSchoolStudent } from "@/hooks/useSchoolStudents"
import { formatDateOnly } from "@/lib/datetime"
import {
  SUBSCRIPTION_BOX_CLASSES,
  SUBSCRIPTION_STATUS_LABELS,
  subscriptionStatus,
  todayIso,
} from "@/lib/subscriptions"
import { cn } from "@/lib/utils"
import { weekdayLabel } from "@/lib/weekdays"
import type { SchoolStudent } from "@/types/school"

interface SubscriptionDraft {
  key: string
  description: string
  start_date: string
  end_date: string
}

interface SchoolStudentModalProps {
  /** undefined = nuovo iscritto. */
  student?: SchoolStudent
  onClose: () => void
}

let draftCounter = 0
const newKey = () => `draft-${draftCounter++}`

export function SchoolStudentModal({ student, onClose }: SchoolStudentModalProps) {
  const coursesQuery = useCourses()
  const save = useSaveSchoolStudent()
  const remove = useDeleteSchoolStudent()

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
      description: s.description,
      start_date: s.start_date,
      end_date: s.end_date,
    }))
  )

  const today = todayIso()
  const courses = coursesQuery.data ?? []

  const subsValid = subs.every(
    (s) => s.description.trim() && s.start_date && s.end_date && s.end_date >= s.start_date
  )
  const isValid = firstName.trim() !== "" && lastName.trim() !== "" && subsValid

  const toggleClass = (id: string, checked: boolean) =>
    setClassIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })

  const updateSub = (key: string, patch: Partial<SubscriptionDraft>) =>
    setSubs((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)))

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
        subscriptions: subs.map((s) => ({
          description: s.description.trim(),
          start_date: s.start_date,
          end_date: s.end_date,
        })),
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

  const handleDelete = () => {
    if (!student) return
    if (!window.confirm(`Eliminare ${student.first_name} ${student.last_name}?`)) return
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
                      {level.level} · {weekdayLabel(level.day_of_week)} {level.time}
                    </label>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Abbonamenti</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setSubs((prev) => [
                  ...prev,
                  { key: newKey(), description: "", start_date: today, end_date: "" },
                ])
              }
            >
              <Plus />
              Aggiungi abbonamento
            </Button>
          </div>
          {subs.length === 0 && (
            <p className="text-muted-foreground text-sm">Nessun abbonamento.</p>
          )}
          {subs.map((sub) => {
            const complete = sub.start_date && sub.end_date
            const status = complete ? subscriptionStatus(sub, today) : null
            const invalidRange = complete && sub.end_date < sub.start_date
            return (
              <div
                key={sub.key}
                className={cn(
                  "space-y-2 rounded-md border p-3",
                  status ? SUBSCRIPTION_BOX_CLASSES[status] : "border-dashed"
                )}
              >
                <div className="flex items-center gap-2">
                  <Input
                    aria-label="Descrizione abbonamento"
                    placeholder="es. Mensile, 10 ingressi, Trimestrale..."
                    className="bg-background/70"
                    value={sub.description}
                    onChange={(e) => updateSub(sub.key, { description: e.target.value })}
                  />
                  {status && (
                    <span className="text-xs font-medium whitespace-nowrap">
                      {SUBSCRIPTION_STATUS_LABELS[status]}
                    </span>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive shrink-0"
                    aria-label="Rimuovi abbonamento"
                    onClick={() => setSubs((prev) => prev.filter((s) => s.key !== sub.key))}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span>Dal</span>
                  <Input
                    type="date"
                    aria-label="Data inizio"
                    className="bg-background/70 w-auto"
                    value={sub.start_date}
                    onChange={(e) => updateSub(sub.key, { start_date: e.target.value })}
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
                {complete && !invalidRange && (
                  <p className="text-xs opacity-80">
                    {formatDateOnly(sub.start_date)} → {formatDateOnly(sub.end_date)}
                  </p>
                )}
                {invalidRange && (
                  <p className="text-destructive text-xs">
                    La data di fine deve essere successiva a quella di inizio.
                  </p>
                )}
              </div>
            )
          })}
        </div>

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
  )
}
