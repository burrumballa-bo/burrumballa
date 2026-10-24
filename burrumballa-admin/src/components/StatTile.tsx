import { ArrowDown, ArrowUp } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatTileProps {
  label: string
  value: string
  hint?: string
  /** Variazione rispetto a un periodo precedente (con segno). */
  delta?: { value: number; label: string; format?: (v: number) => string }
  onClick?: () => void
}

export function StatTile({ label, value, hint, delta, onClick }: StatTileProps) {
  const up = delta && delta.value > 0
  const down = delta && delta.value < 0
  return (
    <Card
      className={cn("py-4", onClick && "hover:border-primary/50 cursor-pointer transition-colors")}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <CardContent className="space-y-1">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {delta && (
          <p className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
            {up && <ArrowUp className="size-3 text-green-700 dark:text-green-400" aria-hidden />}
            {down && <ArrowDown className="size-3 text-red-700 dark:text-red-400" aria-hidden />}
            <span
              className={cn(
                "font-medium tabular-nums",
                up && "text-green-700 dark:text-green-400",
                down && "text-red-700 dark:text-red-400"
              )}
            >
              {delta.value > 0 ? "+" : ""}
              {(delta.format ?? String)(delta.value)}
            </span>
            {delta.label}
          </p>
        )}
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </CardContent>
    </Card>
  )
}
