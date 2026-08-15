import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import {
  getOptionAvailability,
  OPTION_AVAILABILITY_BADGE_CLASSES,
  OPTION_AVAILABILITY_LABELS,
} from "@/lib/optionAvailability"
import type { EventOptionStato } from "@/types/eventOption"

interface EventOptionCardsProps {
  options: EventOptionStato[]
}

export function EventOptionCards({ options }: EventOptionCardsProps) {
  if (options.length === 0) {
    return <p className="text-muted-foreground text-sm">Nessuna opzione configurata.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {options.map((option) => {
        const availability = getOptionAvailability(option)
        return (
          <Card key={option.id} className="py-4">
            <CardContent className="space-y-1.5">
              <CardDescription>{option.label}</CardDescription>
              <CardTitle className="text-2xl">
                {option.iscritti} / {option.max_posti ?? "∞"}
              </CardTitle>
              <Badge variant="outline" className={OPTION_AVAILABILITY_BADGE_CLASSES[availability]}>
                {OPTION_AVAILABILITY_LABELS[availability]}
              </Badge>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
