"use client"

import * as React from "react"
import { toast } from "sonner"
import { Check, Copy } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Taglio diagonale ricorrente nel design (tag, pillole, CTA).
export const DIAGONAL_CUT = "[clip-path:polygon(0_0,100%_0,94%_100%,0_100%)]"

export const deadlineFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

export function CopyableRow({
  label,
  value,
  mono = true,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  const [copied, setCopied] = React.useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Copia non riuscita", {
        description: "Seleziona e copia il testo manualmente.",
      })
    }
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-muted-foreground text-[11px] tracking-[0.08em] uppercase">
          {label}
        </span>
        <span
          className={cn(
            "text-foreground text-sm break-all",
            mono && "font-mono"
          )}
        >
          {value}
        </span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copia ${label.toLowerCase()}`}
        className="text-muted-foreground hover:border-[#f5d90a] hover:text-[#f5d90a] flex size-7 shrink-0 items-center justify-center rounded-[2px] border border-white/15 transition-colors"
      >
        {copied ? (
          <Check className="size-3.5 text-[#7ef58a]" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </div>
  )
}

export function SectionCard({
  accent,
  children,
  className,
}: {
  accent?: "purple" | "yellow" | "fuchsia"
  children: React.ReactNode
  className?: string
}) {
  const accentColor =
    accent === "purple"
      ? "border-t-2 border-t-[#7c1fd6]"
      : accent === "fuchsia"
        ? "border-t-2 border-t-[#d6249f]"
        : accent === "yellow"
          ? "border-t-2 border-t-[#f5d90a]"
          : "border-t-0"

  return (
    <Card
      className={cn(
        "gap-5 rounded-[2px] border-x-0 border-b-0 bg-[#050505] px-0 py-6 shadow-none",
        accentColor,
        className
      )}
    >
      {children}
    </Card>
  )
}
