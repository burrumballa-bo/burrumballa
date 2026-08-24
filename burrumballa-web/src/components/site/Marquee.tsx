interface MarqueeProps {
  text: string
}

export function Marquee({ text }: MarqueeProps) {
  return (
    <div className="bg-bb-ink border-bb-ink overflow-hidden border-y-[3px] py-3">
      <div
        className="font-display text-bb-cream flex w-max animate-[bb-marquee_22s_linear_infinite] gap-0 text-[17px] whitespace-nowrap"
      >
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  )
}
