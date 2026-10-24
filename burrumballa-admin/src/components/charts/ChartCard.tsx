import { useState, type ReactNode } from "react"
import { BarChart3, Table2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  /** Stessi dati in tabella: alternativa accessibile al grafico. */
  table?: { columns: string[]; rows: (string | number)[][] }
  className?: string
}

export function ChartCard({ title, description, children, table, className }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false)
  return (
    <Card className={cn("min-w-0 gap-3", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {table && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="text-muted-foreground hover:text-foreground hover:bg-accent flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
            aria-pressed={showTable}
          >
            {showTable ? <BarChart3 className="size-3.5" /> : <Table2 className="size-3.5" />}
            {showTable ? "Grafico" : "Tabella"}
          </button>
        )}
      </CardHeader>
      <CardContent>
        {showTable && table ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {table.columns.map((c, i) => (
                    <th key={c} className={cn("py-1.5 font-medium", i === 0 ? "text-left" : "text-right")}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri} className="border-b last:border-0">
                    {row.map((cell, ci) => (
                      <td key={ci} className={cn("py-1.5", ci === 0 ? "text-left" : "text-right tabular-nums")}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
