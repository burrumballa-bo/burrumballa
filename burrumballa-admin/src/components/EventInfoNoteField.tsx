import { useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface EventInfoNoteFieldProps {
  id: string
  label: string
  description?: string
  value: string
  onSave: (value: string) => void
  isSaving: boolean
}

// Campo di testo autonomo, con salvataggio dedicato indipendente dal form
// "Info evento": permette di tenere queste note vicino alla sezione a cui
// si riferiscono (es. dentro le card "Opzioni form — Workshop/Battle").
export function EventInfoNoteField({
  id,
  label,
  description,
  value,
  onSave,
  isSaving,
}: EventInfoNoteFieldProps) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const isDirty = draft !== value

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      {description && <p className="text-muted-foreground text-xs">{description}</p>}
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant={isDirty ? "default" : "outline"}
          disabled={!isDirty || isSaving}
          onClick={() => onSave(draft)}
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          Salva nota
        </Button>
      </div>
    </div>
  )
}
