import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">Burrumballa</h1>
      <Link
        href="/eventi/senti-come-suona"
        className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Senti Come Suona →
      </Link>
    </div>
  )
}
