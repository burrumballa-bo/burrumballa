export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function isMinorenne(dataNascita: string): boolean {
  const nascita = new Date(dataNascita)
  const oggi = new Date()
  let eta = oggi.getFullYear() - nascita.getFullYear()
  const nonCompiutoQuestAnno =
    oggi.getMonth() < nascita.getMonth() ||
    (oggi.getMonth() === nascita.getMonth() && oggi.getDate() < nascita.getDate())
  if (nonCompiutoQuestAnno) eta--
  return eta < 18
}
