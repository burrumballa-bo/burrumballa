const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".ogg"]

function isVideoUrl(url: string): boolean {
  const clean = url.split("?")[0].toLowerCase()
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext))
}

interface MediaProps {
  src: string | null | undefined
  alt: string
  className?: string
  /** Colore del pannello mostrato finché nessun media è stato caricato dal CMS. */
  fallbackColor?: string
}

// Immagine, gif o video (rilevato dall'estensione) caricati dal CMS nel
// bucket pubblico "site-media": un solo campo per tutti e tre i formati,
// così l'admin non deve scegliere un tipo di media a priori.
export function Media({ src, alt, className, fallbackColor = "#7e3fae" }: MediaProps) {
  if (!src) {
    return <div className={className} style={{ background: fallbackColor }} aria-hidden="true" />
  }

  if (isVideoUrl(src)) {
    return (
      <video
        className={className}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        aria-label={alt}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL pubblico da Supabase Storage (bucket "site-media"), non gestibile da next/image senza config remota dedicata
    <img src={src} alt={alt} className={className} loading="lazy" />
  )
}
