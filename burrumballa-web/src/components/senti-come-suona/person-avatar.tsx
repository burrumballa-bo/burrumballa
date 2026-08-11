import type { EventPerson } from "@/lib/senti-come-suona-assets"

import { PlaceholderPhoto } from "./placeholder-photo"

export function PersonAvatar({
  persona,
  url,
  square = true,
}: {
  persona: EventPerson
  url: string | null
  square?: boolean
}) {
  if (!url) {
    return <PlaceholderPhoto label={square ? `FOTO\n${persona.nome}` : "FOTO"} />
  }

  return (
    <div className="relative aspect-square overflow-hidden [clip-path:polygon(0_0,100%_0,100%_88%,0_100%)]">
      {/* eslint-disable-next-line @next/next/no-img-element -- immagine da signed URL Supabase, non gestibile da next/image senza config remota dedicata */}
      <img
        src={url}
        alt={persona.nome}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  )
}
