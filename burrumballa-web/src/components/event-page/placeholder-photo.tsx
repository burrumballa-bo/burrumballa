import { cn } from "@/lib/utils"

export function PlaceholderPhoto({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden [clip-path:polygon(0_0,100%_0,100%_88%,0_100%)]",
        className
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-[repeating-linear-gradient(45deg,rgba(255,255,255,.06)_0_10px,rgba(255,255,255,.02)_10px_20px)] px-1 text-center font-mono text-[8px] leading-tight text-white/40">
        {label}
      </div>
    </div>
  )
}
