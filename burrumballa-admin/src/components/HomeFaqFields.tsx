import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { emptyFaqItemFormValues, type HomeContentFormValues } from "@/lib/cms/schemas"

interface HomeFaqFieldsProps {
  control: Control<HomeContentFormValues>
  register: UseFormRegister<HomeContentFormValues>
  errors: FieldErrors<HomeContentFormValues>
}

// Elenco domande/risposte della home. A differenza di corsi ed eventi (righe
// vere su tabelle dedicate) le FAQ vivono dentro il jsonb di site_pages
// "home": sono quindi un array del form, gestito con useFieldArray e salvato
// insieme al resto della pagina dal bottone "Salva Home".
export function HomeFaqFields({ control, register, errors }: HomeFaqFieldsProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name: "faq.items" })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Kicker</Label>
          <Input {...register("faq.kicker")} />
        </div>
        <div className="space-y-1.5">
          <Label>Titolo sezione</Label>
          <Input aria-invalid={!!errors.faq?.title} {...register("faq.title")} />
          {errors.faq?.title && (
            <p className="text-destructive text-sm">{errors.faq.title.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Sottotitolo</Label>
        <Textarea rows={2} {...register("faq.subtitle")} />
      </div>

      <div className="space-y-3">
        {fields.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
            Nessuna domanda: la sezione non viene mostrata sul sito.
          </p>
        ) : (
          fields.map((field, index) => {
            const itemErrors = errors.faq?.items?.[index]
            return (
              <div key={field.id} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-muted-foreground text-xs">
                    Domanda {String(index + 1).padStart(2, "0")}
                  </Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Sposta su"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Sposta giù"
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      <ChevronDown />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Elimina domanda"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <Input
                  placeholder="Domanda (es. Serve la tessera ARCI?)"
                  aria-invalid={!!itemErrors?.question}
                  {...register(`faq.items.${index}.question` as const)}
                />
                {itemErrors?.question && (
                  <p className="text-destructive text-sm">{itemErrors.question.message}</p>
                )}
                <Textarea
                  rows={3}
                  placeholder="Risposta"
                  aria-invalid={!!itemErrors?.answer}
                  {...register(`faq.items.${index}.answer` as const)}
                />
                {itemErrors?.answer && (
                  <p className="text-destructive text-sm">{itemErrors.answer.message}</p>
                )}
              </div>
            )
          })
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ ...emptyFaqItemFormValues })}
      >
        <Plus />
        Aggiungi domanda
      </Button>
    </div>
  )
}
