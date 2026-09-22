import { useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Loader2, Printer, Shuffle } from "lucide-react"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

import { cn } from "@/lib/utils"
import { HIPHOP_2VS2_OPEN_KEY, accoppia2vs2 } from "@/lib/coppie2vs2"
import { useEventInfo } from "@/hooks/useEventInfo"
import { useEventOptionsStato } from "@/hooks/useEventOptionsStato"
import { useRegistrations } from "@/hooks/useRegistrations"
import {
  useSaveSiBallaOrdinamento,
  useSiBallaOrdinamenti,
} from "@/hooks/useSiBallaOrdinamenti"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { EventOptionStato } from "@/types/eventOption"
import type { Registration } from "@/types/registration"

// Chiavi "placeholder" a catalogo: non sono attività reali.
const NO_WORKSHOP_KEY = "no_workshop"
const NO_BATTLE_KEY = "no_battle"

const PERSONA_COLUMNS = ["Nome", "Cognome", "Aka", "Anno di nascita"]

interface Riga {
  id: string
  cells: string[]
}

function isPagato(r: Registration): boolean {
  return r.payment_status === "pagato_bonifico" || r.payment_status === "pagato_in_loco"
}

function perCognome(a: Registration, b: Registration): number {
  return (
    a.cognome.localeCompare(b.cognome, "it", { sensitivity: "base" }) ||
    a.nome.localeCompare(b.nome, "it", { sensitivity: "base" })
  )
}

function rigaPersona(r: Registration): Riga {
  return {
    id: r.id,
    cells: [r.nome, r.cognome, r.aka || "—", r.data_nascita?.slice(0, 4) || "—"],
  }
}

function etichettaPersona(r: Registration): string {
  const nome = `${r.nome} ${r.cognome}`
  return r.aka ? `${nome} - ${r.aka}` : nome
}

// Le righe presenti nell'ordine salvato vengono prima, nell'ordine
// salvato; quelle nuove (es. pagamenti registrati dopo l'ultimo "Ordina
// random") seguono nell'ordine di default.
function applicaOrdine(righe: Riga[], ordine: string[] | undefined): Riga[] {
  if (!ordine?.length) return righe
  const posizione = new Map(ordine.map((id, i) => [id, i]))
  const salvate = righe
    .filter((r) => posizione.has(r.id))
    .sort((a, b) => posizione.get(a.id)! - posizione.get(b.id)!)
  return [...salvate, ...righe.filter((r) => !posizione.has(r.id))]
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function stampaPdf(titolo: string, sottotitolo: string, columns: string[], righe: Riga[]) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(titolo, 14, 18)
  doc.setFontSize(11)
  doc.text(sottotitolo, 14, 26)
  autoTable(doc, {
    startY: 32,
    head: [["#", ...columns]],
    body: righe.map((r, i) => [String(i + 1), ...r.cells]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [30, 30, 30] },
    columnStyles: { 0: { cellWidth: 10 } },
  })
  const slug = `${titolo}-${sottotitolo}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  doc.save(`${slug}.pdf`)
}

interface SezioneProps {
  sezione: string
  titolo: string
  titoloPdf: string
  columns: string[]
  righe: Riga[]
  ordine: string[] | undefined
  vuoto: string
}

function Sezione({ sezione, titolo, titoloPdf, columns, righe, ordine, vuoto }: SezioneProps) {
  const saveOrdine = useSaveSiBallaOrdinamento()
  const ordinate = useMemo(() => applicaOrdine(righe, ordine), [righe, ordine])

  const handleShuffle = () => {
    saveOrdine.mutate(
      { sezione, ordine: shuffle(righe.map((r) => r.id)) },
      {
        onSuccess: () => toast.success("Ordine randomizzato e salvato."),
        onError: (error) =>
          toast.error("Salvataggio ordine non riuscito.", {
            description: (error as Error).message,
          }),
      }
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle>
          {titolo} <span className="text-muted-foreground font-normal">({righe.length})</span>
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShuffle}
            disabled={saveOrdine.isPending || righe.length < 2}
          >
            {saveOrdine.isPending ? <Loader2 className="animate-spin" /> : <Shuffle />}
            Ordina random
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => stampaPdf(titoloPdf, titolo, columns, ordinate)}
            disabled={righe.length === 0}
          >
            <Printer />
            Stampa PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                {columns.map((c) => (
                  <TableHead key={c}>{c}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordinate.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="text-muted-foreground h-20 text-center"
                  >
                    {vuoto}
                  </TableCell>
                </TableRow>
              ) : (
                ordinate.map((riga, i) => (
                  <TableRow key={riga.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    {riga.cells.map((cell, j) => (
                      <TableCell key={j}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EventoSiBallaPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const eventInfoQuery = useEventInfo()
  const registrationsQuery = useRegistrations()
  const optionsQuery = useEventOptionsStato()
  const ordinamentiQuery = useSiBallaOrdinamenti()

  const pagati = useMemo(
    () => (registrationsQuery.data ?? []).filter(isPagato).sort(perCognome),
    [registrationsQuery.data]
  )

  const options = useMemo(
    () => (optionsQuery.data ?? []).filter((o) => !o.deleted_at),
    [optionsQuery.data]
  )

  // Un tab per ogni workshop "semplice" (i composti confluiscono nei loro
  // componenti) e uno per ogni battle.
  const tabs = useMemo<EventOptionStato[]>(
    () => [
      ...options.filter(
        (o) => o.tipo === "workshop" && !o.composto && o.chiave !== NO_WORKSHOP_KEY
      ),
      ...options.filter((o) => o.tipo === "battle" && o.chiave !== NO_BATTLE_KEY),
    ],
    [options]
  )

  const activeKey = searchParams.get("tab")
  const active = tabs.find((t) => t.chiave === activeKey) ?? tabs[0]

  // Workshop scelti che includono il workshop attivo: sé stesso più ogni
  // composto di cui fa parte.
  const workshopIscritti = useMemo(() => {
    if (!active || active.tipo !== "workshop") return []
    const chiave = active.chiave
    const chiavi = new Set([
      chiave,
      ...options
        .filter((o) => o.tipo === "workshop" && o.composto && o.composto_di.includes(chiave))
        .map((o) => o.chiave),
    ])
    return pagati.filter((r) => r.workshop && chiavi.has(r.workshop))
  }, [active, options, pagati])

  const battleIscritti = useMemo(() => {
    if (!active || active.tipo !== "battle") return []
    return pagati.filter((r) => r.battle_categories.includes(active.chiave))
  }, [active, pagati])

  const accoppiamento = useMemo(() => accoppia2vs2(pagati), [pagati])

  const ordinamenti = ordinamentiQuery.data
  const titoloEvento = eventInfoQuery.data?.titolo ?? "Evento"
  const isLoading =
    registrationsQuery.isLoading || optionsQuery.isLoading || ordinamentiQuery.isLoading
  const error = registrationsQuery.error ?? optionsQuery.error ?? ordinamentiQuery.error

  const renderPanel = () => {
    if (!active) {
      return <p className="text-muted-foreground text-sm">Nessun workshop o battle attivo.</p>
    }
    const option = active
    const sezioneBase = `${option.tipo}:${option.chiave}`

    if (option.tipo === "battle" && option.chiave === HIPHOP_2VS2_OPEN_KEY) {
      return (
        <div className="space-y-6">
          <Sezione
            sezione={`${sezioneBase}:coppie`}
            titolo={`${option.label} — Coppie`}
            titoloPdf={titoloEvento}
            columns={["Iscritto 1", "Iscritto 2", "Crew"]}
            righe={accoppiamento.coppie.map((c) => ({
              id: c.id,
              cells: [etichettaPersona(c.a), etichettaPersona(c.b), c.crew || "—"],
            }))}
            ordine={ordinamenti?.get(`${sezioneBase}:coppie`)}
            vuoto="Nessuna coppia trovata tra gli iscritti che hanno pagato."
          />
          <Sezione
            sezione={`${sezioneBase}:senza-coppia`}
            titolo={`${option.label} — Crew o partner non trovato`}
            titoloPdf={titoloEvento}
            columns={[...PERSONA_COLUMNS, "Crew / partner"]}
            righe={[...accoppiamento.singoli].sort(perCognome).map((r) => {
              const riga = rigaPersona(r)
              return { ...riga, cells: [...riga.cells, r.aka_partner_2vs2 || "—"] }
            })}
            ordine={ordinamenti?.get(`${sezioneBase}:senza-coppia`)}
            vuoto="Tutti gli iscritti che hanno pagato sono stati accoppiati."
          />
        </div>
      )
    }

    const iscritti = option.tipo === "workshop" ? workshopIscritti : battleIscritti
    return (
      <Sezione
        sezione={sezioneBase}
        titolo={option.label}
        titoloPdf={titoloEvento}
        columns={PERSONA_COLUMNS}
        righe={iscritti.map(rigaPersona)}
        ordine={ordinamenti?.get(sezioneBase)}
        vuoto="Nessun iscritto che abbia pagato."
      />
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/admin/evento/iscritti")}
        >
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Si balla</h1>
          <p className="text-muted-foreground text-sm">
            Solo gli iscritti che risultano aver pagato.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-destructive text-sm">
          Errore nel caricamento: {(error as Error).message}
        </p>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento...</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 border-b pb-3" role="tablist">
            {tabs.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={option.chiave === active?.chiave}
                onClick={() => setSearchParams({ tab: option.chiave }, { replace: true })}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                  option.chiave === active?.chiave
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span className="text-xs opacity-70">
                  {option.tipo === "workshop" ? "Workshop · " : "Battle · "}
                </span>
                {option.label}
              </button>
            ))}
          </div>

          <div role="tabpanel">{renderPanel()}</div>
        </>
      )}
    </div>
  )
}
