import Link from "next/link"

import { Chip } from "@/components/site/Chip"
import { Kicker } from "@/components/site/Kicker"
import { Media } from "@/components/site/Media"
import { SiteShell } from "@/components/site/SiteShell"
import { getEventiContent, getEvents, getFooterContent } from "@/lib/cms/queries"
import type { EventItem } from "@/lib/cms/types"

export const revalidate = 60

export const metadata = {
  title: "Eventi",
  description:
    "Battle, spettacoli, open class e serate: gli eventi di Burrumballa al Circolo La Fattoria, Bologna.",
}

function eventBottomLine(event: EventItem): string | null {
  if (!event.event_time && !event.note) return null
  return event.event_time ? `${event.event_time}${event.note ? ` · ${event.note}` : ""}` : event.note
}

function FeaturedEventCard({ event }: { event: EventItem }) {
  const content = (
    <div className="border-bb-ink grid grid-cols-1 overflow-hidden rounded-[5px] border-[3px] md:grid-cols-[1fr_1.1fr]">
      <Media
        src={event.image_url}
        alt={event.title}
        fallbackColor={event.color}
        className="block h-full min-h-[280px] w-full object-cover md:border-r-[3px] md:border-bb-ink"
      />
      <div className="flex flex-col justify-center p-8 text-white md:p-10" style={{ background: event.color }}>
        <span className="bg-bb-green font-display self-start rounded-[2px] px-2.5 py-1 text-[11px] text-[#1a1a1a]">
          IN EVIDENZA
        </span>
        <div className="font-display-alt mt-3.5 text-[38px] leading-[0.9] md:text-[54px]">
          {event.title.toUpperCase()}
        </div>
        {event.subtitle && (
          <div className="font-marker mt-1.5 text-lg text-[#f6a323]">{event.subtitle}</div>
        )}
        {event.body && (
          <p className="mt-3.5 mb-4.5 max-w-[420px] text-[15px] leading-relaxed text-neutral-100">
            {event.body}
          </p>
        )}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <Chip key={tag} background="#fff" color="#1a1a1a" className="border-0 px-3 py-1.5">
                {tag}
              </Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return event.cta_url ? (
    <Link href={event.cta_url} className="block">
      {content}
    </Link>
  ) : (
    content
  )
}

function EventCard({ event }: { event: EventItem }) {
  const bottomLine = eventBottomLine(event)
  const content = (
    <div className="border-bb-ink bg-bb-surface grid h-full grid-cols-1 overflow-hidden rounded-[5px] border-[3px] sm:grid-cols-[0.9fr_1.1fr]">
      <Media
        src={event.image_url}
        alt={event.title}
        fallbackColor={event.color}
        className="block h-full min-h-[230px] w-full object-cover sm:border-r-[3px] sm:border-bb-ink"
      />
      <div className="p-5.5">
        {event.subtitle && (
          <div className="font-display text-[13px]" style={{ color: event.color }}>
            {event.subtitle}
          </div>
        )}
        <div className="font-display-alt my-1.5 text-[28px] leading-[0.95]">
          {event.title.toUpperCase()}
        </div>
        {event.body && (
          <p className="text-bb-ink/65 text-[13px] leading-relaxed">{event.body}</p>
        )}
        {bottomLine && <div className="mt-2.5 text-xs font-bold">{bottomLine}</div>}
      </div>
    </div>
  )

  return event.cta_url ? (
    <Link href={event.cta_url} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  )
}

export default async function EventiPage() {
  const [content, footer, events] = await Promise.all([
    getEventiContent(),
    getFooterContent(),
    getEvents(),
  ])

  const featured = events.find((event) => event.featured) ?? events[0] ?? null
  const rest = events.filter((event) => event.id !== featured?.id)

  return (
    <SiteShell active="eventi" footer={footer}>
      {/* HERO */}
      <div className="mx-auto max-w-[1200px] px-6 pt-12 pb-4">
        <Kicker color="#7e3fae" className="-rotate-1">
          {content.hero.kicker}
        </Kicker>
        <h1 className="font-display mt-2.5 text-[46px] leading-[0.92] tracking-[-2px] sm:text-[58px] md:text-[70px] md:tracking-[-3px]">
          {content.hero.title}
        </h1>
        <p className="text-bb-ink/75 mt-4.5 max-w-[560px] text-[17px] leading-relaxed">
          {content.hero.subtitle}
        </p>
      </div>

      {featured && (
        <div className="mx-auto max-w-[1200px] px-6 pt-2.5">
          <FeaturedEventCard event={featured} />
        </div>
      )}

      {rest.length > 0 && (
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-5 px-6 pt-10 md:grid-cols-2">
          {rest.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* CTA BAND */}
      <div className="mx-auto mt-10 max-w-[1200px] px-6">
        <div className="bg-bb-green border-bb-ink rounded border-[3px] p-9 text-center">
          <h2 className="font-display text-[28px] tracking-[-1.5px] md:text-[38px]">
            {content.ctaBand.title}
          </h2>
          <p className="mt-2 mb-5 text-[15px]">{content.ctaBand.subtitle}</p>
          <Link
            href="/corsi"
            className="bg-bb-ink text-bb-cream inline-block rounded-[3px] px-6.5 py-3.5 text-[15px] font-bold"
          >
            Iscriviti →
          </Link>
        </div>
      </div>
    </SiteShell>
  )
}
