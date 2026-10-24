import { useMemo, useState } from "react"
import { FileSpreadsheet } from "lucide-react"

import { useAppSettings } from "@/hooks/useAppSettings"
import { useSchoolStudents } from "@/hooks/useSchoolStudents"
import { formatDateOnly } from "@/lib/datetime"
import { downloadCsv, nomeFile } from "@/lib/export"
import { formatCurrency } from "@/lib/format"
import {
  VOCE_LABELS,
  buildMovimenti,
  buildPendenti,
  riepiloga,
  type VoceIncasso,
} from "@/lib/incassi"
import { INCASSO_METHOD_LABELS, isElectronic } from "@/lib/paymentMethods"
import { currentSeason, seasonLabel, seasonRange } from "@/lib/seasons"
import { studentFullName, todayIso } from "@/lib/subscriptions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SchoolStudentModal } from "@/components/SchoolStudentModal"

type Periodo = "mese" | "stagione" | "intervallo"
type FiltroMetodo = "tutti" | "contanti" | "elettronico"

const PERIODI: { value: Periodo; label: string }[] = [
  { value: "mese", label: "Mese" },
  { value: "stagione", label: "Stagione" },
  { value: "intervallo", label: "Date libere" },
]

const VOCI = Object.keys(VOCE_LABELS) as VoceIncasso[]

function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number)
  const last = new Date(y, m, 0).getDate()
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` }
}

export default function IncassiScuolaPage() {
  const studentsQuery = useSchoolStudents()
  const settings = useAppSettings().data
  const startMonth = settings?.stagione_mese_inizio ?? 9
  const thisSeason = currentSeason(startMonth)

  const [periodo, setPeriodo] = useState<Periodo>("mese")
  const [month, setMonth] = useState(todayIso().slice(0, 7))
  const [pickedSeason, setPickedSeason] = useState<number | null>(null)
  const season = pickedSeason ?? thisSeason
  const [from, setFrom] = useState(todayIso().slice(0, 8) + "01")
  const [to, setTo] = useState(todayIso())
  const [voce, setVoce] = useState<VoceIncasso | "tutte">("tutte")
  const [metodo, setMetodo] = useState<FiltroMetodo>("tutti")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data])

  const range =
    periodo === "mese"
      ? monthRange(month)
      : periodo === "stagione"
        ? seasonRange(season, startMonth)
        : { from, to }

  const periodoLabel =
    periodo === "stagione"
      ? `stagione ${seasonLabel(season)}`
      : `dal ${formatDateOnly(range.from)} al ${formatDateOnly(range.to)}`

  const movimenti = useMemo(() => buildMovimenti(students), [students])
  const nelPeriodo = movimenti.filter(
    (m) =>
      m.data >= range.from &&
      m.data <= range.to &&
      (voce === "tutte" || m.voce === voce) &&
      (metodo === "tutti" || (metodo === "elettronico") === isElectronic(m.metodo))
  )
  const riepilogo = riepiloga(nelPeriodo)

  const pendenti = useMemo(
    () =>
      buildPendenti(students, thisSeason, startMonth, {
        tessera: settings?.prezzo_tessera ?? null,
        quota: settings?.prezzo_quota_iscrizione ?? null,
      }),
    [students, thisSeason, startMonth, settings]
  )
  const totalePendenti = pendenti.reduce((sum, p) => sum + (p.importo ?? 0), 0)
  const pendentiSenzaImporto = pendenti.filter((p) => p.importo == null).length

  const selected = students.find((s) => s.id === selectedId)

  const exportCsv = () =>
    downloadCsv(nomeFile("incassi", periodoLabel), [
      ["Data", "Iscritto", "Voce", "Metodo", "Importo"],
      ...nelPeriodo.map((m) => [
        m.data.split("-").reverse().join("/"),
        studentFullName(m.student),
        m.descrizione,
        INCASSO_METHOD_LABELS[m.metodo],
        m.importo.toFixed(2).replace(".", ","),
      ]),
    ])

  const tiles = [
    { label: "Totale incassato", value: formatCurrency(riepilogo.totale), className: "text-emerald-600 dark:text-emerald-400" },
    { label: "Contanti", value: formatCurrency(riepilogo.contanti) },
    {
      label: "Elettronico (POS + bonifico)",
      value: formatCurrency(riepilogo.elettronico),
      hint: `POS ${formatCurrency(riepilogo.pos)} · Bonifico ${formatCurrency(riepilogo.bonifico)}`,
    },
    {
      label: `Da incassare (${seasonLabel(thisSeason)})`,
      value: formatCurrency(totalePendenti),
      className: "text-amber-600 dark:text-amber-400",
      hint:
        pendentiSenzaImporto > 0
          ? `${pendentiSenzaImporto} voci senza importo: impostalo in Impostazioni`
          : `${pendenti.length} voci`,
    },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Incassi scuola</h1>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-1 rounded-md border p-1" role="tablist" aria-label="Periodo">
          {PERIODI.map((p) => (
            <button
              key={p.value}
              type="button"
              role="tab"
              aria-selected={periodo === p.value}
              onClick={() => setPeriodo(p.value)}
              className={cn(
                "rounded px-3 py-1 text-sm transition-colors",
                periodo === p.value ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {periodo === "mese" && (
          <Input
            type="month"
            aria-label="Mese"
            className="w-auto"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
        )}
        {periodo === "stagione" && (
          <div className="w-44">
            <Select
              aria-label="Stagione"
              value={String(season)}
              onChange={(e) => setPickedSeason(Number(e.target.value))}
            >
              {[thisSeason + 1, thisSeason, thisSeason - 1, thisSeason - 2].map((s) => (
                <option key={s} value={s}>
                  Stagione {seasonLabel(s)}
                </option>
              ))}
            </Select>
          </div>
        )}
        {periodo === "intervallo" && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Dal</span>
            <Input type="date" aria-label="Dal" className="w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span>al</span>
            <Input type="date" aria-label="Al" className="w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        )}
        <div className="w-44">
          <Select aria-label="Voce" value={voce} onChange={(e) => setVoce(e.target.value as VoceIncasso | "tutte")}>
            <option value="tutte">Tutte le voci</option>
            {VOCI.map((v) => (
              <option key={v} value={v}>
                {VOCE_LABELS[v]}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-44">
          <Select aria-label="Metodo" value={metodo} onChange={(e) => setMetodo(e.target.value as FiltroMetodo)}>
            <option value="tutti">Tutti i metodi</option>
            <option value="contanti">Solo contanti</option>
            <option value="elettronico">Solo elettronico</option>
          </Select>
        </div>
      </div>

      {studentsQuery.isError && (
        <p className="text-destructive text-sm">
          Errore nel caricamento: {(studentsQuery.error as Error).message}
        </p>
      )}
      {studentsQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento incassi...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {tiles.map((tile) => (
              <Card key={tile.label} className="py-4">
                <CardContent className="space-y-1">
                  <CardDescription>{tile.label}</CardDescription>
                  <CardTitle className={cn("text-2xl", tile.className)}>{tile.value}</CardTitle>
                  {tile.hint && <p className="text-muted-foreground text-xs">{tile.hint}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Per voce</CardTitle>
              <CardDescription>Incassato {periodoLabel}.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voce</TableHead>
                    <TableHead className="text-right">Contanti</TableHead>
                    <TableHead className="text-right">Elettronico</TableHead>
                    <TableHead className="text-right">Totale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {VOCI.map((v) => (
                    <TableRow key={v}>
                      <TableCell>{VOCE_LABELS[v]}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(riepilogo.perVoce[v].contanti)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(riepilogo.perVoce[v].elettronico)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatCurrency(riepilogo.perVoce[v].totale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <CardTitle>Movimenti</CardTitle>
                <CardDescription>
                  {nelPeriodo.length} pagamenti {periodoLabel}. Clic su una riga per aprire la scheda.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" disabled={nelPeriodo.length === 0} onClick={exportCsv}>
                <FileSpreadsheet />
                Esporta Excel (CSV)
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Iscritto</TableHead>
                    <TableHead>Voce</TableHead>
                    <TableHead>Metodo</TableHead>
                    <TableHead className="text-right">Importo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nelPeriodo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground h-20 text-center">
                        Nessun pagamento nel periodo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    nelPeriodo.map((m) => (
                      <TableRow key={m.key} className="cursor-pointer" onClick={() => setSelectedId(m.student.id)}>
                        <TableCell className="whitespace-nowrap">{formatDateOnly(m.data)}</TableCell>
                        <TableCell>{studentFullName(m.student)}</TableCell>
                        <TableCell>{m.descrizione}</TableCell>
                        <TableCell>{INCASSO_METHOD_LABELS[m.metodo]}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(m.importo)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Da incassare</CardTitle>
              <CardDescription>
                Abbonamenti da pagare, tessere fatte e non pagate, quote mancanti
                degli iscritti attivi nella stagione {seasonLabel(thisSeason)}.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {pendenti.length === 0 ? (
                <p className="text-muted-foreground text-sm">Tutto incassato.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Iscritto</TableHead>
                      <TableHead>Voce</TableHead>
                      <TableHead className="text-right">Importo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendenti.map((p) => (
                      <TableRow key={p.key} className="cursor-pointer" onClick={() => setSelectedId(p.student.id)}>
                        <TableCell>{studentFullName(p.student)}</TableCell>
                        <TableCell>{p.descrizione}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.importo != null ? formatCurrency(p.importo) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {selected && (
        <SchoolStudentModal key={selected.id} student={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
