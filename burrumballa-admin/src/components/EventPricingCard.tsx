import { useState } from "react"
import { Loader2, Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { EventInfo, EventInfoPatch } from "@/types/eventInfo"

const MAX_TIERS = 10

// Accetta anche la virgola decimale ("12,50").
const toNumber = (v: string) => Number(v.trim().replace(",", "."))
const isAmount = (v: string) => v.trim() !== "" && Number.isFinite(toNumber(v)) && toNumber(v) >= 0

interface EventPricingCardProps {
  event: EventInfo
  onSave: (patch: EventInfoPatch) => void
  isSaving: boolean
}

// Regole di prezzo usate dal form pubblico e dall'admin: la battle si paga
// in base a quante categorie si scelgono, oltre l'ultimo scaglione vale
// l'ultimo prezzo; le maggiorazioni valgono solo per chi fa la battle.
export function EventPricingCard({ event, onSave, isSaving }: EventPricingCardProps) {
  const [tiers, setTiers] = useState(() => event.battle_prezzi.map(String))
  const [ritardo, setRitardo] = useState(String(event.maggiorazione_ritardo))
  const [sulPosto, setSulPosto] = useState(String(event.maggiorazione_sul_posto))

  const valid = tiers.length > 0 && tiers.every(isAmount) && isAmount(ritardo) && isAmount(sulPosto)
  const dirty =
    tiers.join("|") !== event.battle_prezzi.map(String).join("|") ||
    toNumber(ritardo) !== event.maggiorazione_ritardo ||
    toNumber(sulPosto) !== event.maggiorazione_sul_posto

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prezzi</CardTitle>
        <CardDescription>
          Il prezzo dei workshop si imposta su ogni opzione. La battle si paga in base al numero
          di categorie scelte; con più categorie dell&apos;ultimo scaglione vale l&apos;ultimo
          prezzo. Le maggiorazioni si applicano solo a chi partecipa alla battle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Battle</Label>
          <div className="flex flex-wrap items-end gap-3">
            {tiers.map((value, i) => (
              <div key={i} className="w-28 space-y-1">
                <span className="text-muted-foreground text-xs">
                  {i + 1} {i === 0 ? "categoria" : "categorie"}
                  {i === tiers.length - 1 && tiers.length > 1 ? " o più" : ""}
                </span>
                <Input
                  inputMode="decimal"
                  aria-label={`Prezzo battle con ${i + 1} categorie`}
                  aria-invalid={!isAmount(value)}
                  value={value}
                  onChange={(e) => setTiers((prev) => prev.map((t, j) => (j === i ? e.target.value : t)))}
                />
              </div>
            ))}
            <div className="flex gap-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Togli uno scaglione"
                disabled={tiers.length <= 1}
                onClick={() => setTiers((prev) => prev.slice(0, -1))}
              >
                <Minus />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Aggiungi uno scaglione"
                disabled={tiers.length >= MAX_TIERS}
                onClick={() => setTiers((prev) => [...prev, prev[prev.length - 1] ?? "0"])}
              >
                <Plus />
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="magg-ritardo">Maggiorazione dopo la scadenza (€)</Label>
            <Input
              id="magg-ritardo"
              inputMode="decimal"
              aria-invalid={!isAmount(ritardo)}
              value={ritardo}
              onChange={(e) => setRitardo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="magg-posto">Maggiorazione pagamento sul posto (€)</Label>
            <Input
              id="magg-posto"
              inputMode="decimal"
              aria-invalid={!isAmount(sulPosto)}
              value={sulPosto}
              onChange={(e) => setSulPosto(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={!valid || !dirty || isSaving}
            onClick={() =>
              onSave({
                battle_prezzi: tiers.map(toNumber),
                maggiorazione_ritardo: toNumber(ritardo),
                maggiorazione_sul_posto: toNumber(sulPosto),
              })
            }
          >
            {isSaving && <Loader2 className="animate-spin" />}
            Salva prezzi
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
