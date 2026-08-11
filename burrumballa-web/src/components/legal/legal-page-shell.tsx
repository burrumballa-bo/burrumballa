import type { ReactNode } from "react"
import Link from "next/link"

export function LegalPageShell({
  title,
  updatedAt,
  children,
}: {
  title: string
  updatedAt: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-12 sm:px-8 lg:py-16">
      <Link
        href="/eventi/senti-come-suona"
        className="text-muted-foreground w-fit text-sm underline underline-offset-4 hover:text-foreground"
      >
        ← Torna al sito
      </Link>
      <header className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="text-muted-foreground text-sm">
          Ultimo aggiornamento: {updatedAt}
        </p>
      </header>
      <div className="flex flex-col gap-8">{children}</div>
    </main>
  )
}

export function LegalSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="text-muted-foreground flex flex-col gap-2 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  )
}
