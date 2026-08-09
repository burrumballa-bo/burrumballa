import { useEffect, useMemo, useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type Column,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDateTime } from "@/lib/format"
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_BADGE_CLASSES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_OPTIONS,
} from "@/lib/paymentStatus"
import type { PaymentStatus, Registration } from "@/types/registration"

interface RegistrationsTableProps {
  data: Registration[]
  workshopLabels: Record<string, string>
  battleLabels: Record<string, string>
  onStatusChange: (id: string, status: PaymentStatus) => void
  onNoteChange: (id: string, note: string) => void
}

function SortableHeader({
  column,
  label,
  align,
}: {
  column: Column<Registration, unknown>
  label: string
  align?: "right"
}) {
  const sorted = column.getIsSorted()

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium tracking-wide uppercase",
        align === "right" && "ml-auto flex-row-reverse"
      )}
    >
      {label}
      {sorted === "asc" && <ArrowUp className="size-3.5" />}
      {sorted === "desc" && <ArrowDown className="size-3.5" />}
      {!sorted && <ArrowUpDown className="size-3.5 opacity-40" />}
    </button>
  )
}

function StatusCell({
  registration,
  onChange,
}: {
  registration: Registration
  onChange: (status: PaymentStatus) => void
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge
        variant="outline"
        className={PAYMENT_STATUS_BADGE_CLASSES[registration.payment_status]}
      >
        {PAYMENT_STATUS_LABELS[registration.payment_status]}
      </Badge>
      <Select
        aria-label={`Cambia stato pagamento per ${registration.nome} ${registration.cognome}`}
        className="h-7 py-0 text-xs"
        value={registration.payment_status}
        onChange={(e) => onChange(e.target.value as PaymentStatus)}
      >
        {PAYMENT_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  )
}

function NoteCell({
  registration,
  onSave,
}: {
  registration: Registration
  onSave: (note: string) => void
}) {
  const [value, setValue] = useState(registration.note_admin ?? "")

  useEffect(() => {
    setValue(registration.note_admin ?? "")
  }, [registration.note_admin])

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== (registration.note_admin ?? "")) {
          onSave(value)
        }
      }}
      placeholder="Note interne..."
      className="h-8 min-w-[180px] text-xs"
    />
  )
}

export function RegistrationsTable({
  data,
  workshopLabels,
  battleLabels,
  onStatusChange,
  onNoteChange,
}: RegistrationsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ])

  const columns = useMemo<ColumnDef<Registration>[]>(
    () => [
      {
        accessorKey: "cognome",
        header: ({ column }) => <SortableHeader column={column} label="Cognome" />,
      },
      {
        accessorKey: "nome",
        header: ({ column }) => <SortableHeader column={column} label="Nome" />,
      },
      {
        accessorKey: "aka",
        header: ({ column }) => <SortableHeader column={column} label="Aka" />,
        cell: (info) => info.getValue<string | null>() || "—",
      },
      {
        accessorKey: "email",
        header: ({ column }) => <SortableHeader column={column} label="Email" />,
      },
      {
        id: "workshop",
        accessorFn: (row) =>
          (row.workshop && workshopLabels[row.workshop]) || row.workshop || "",
        header: ({ column }) => <SortableHeader column={column} label="Workshop" />,
        cell: (info) => info.getValue<string>() || "—",
      },
      {
        id: "battle",
        accessorFn: (row) =>
          row.battle_categories
            .map((chiave) => battleLabels[chiave] ?? chiave)
            .filter((label) => label && !/nessuna battle/i.test(label))
            .join(", "),
        header: ({ column }) => <SortableHeader column={column} label="Battle" />,
        cell: (info) => info.getValue<string>() || "—",
      },
      {
        accessorKey: "payment_method",
        header: ({ column }) => <SortableHeader column={column} label="Metodo" />,
        cell: (info) => PAYMENT_METHOD_LABELS[info.getValue<Registration["payment_method"]>()],
      },
      {
        accessorKey: "payment_status",
        header: ({ column }) => <SortableHeader column={column} label="Stato" />,
        cell: (info) => {
          const registration = info.row.original
          return (
            <StatusCell
              registration={registration}
              onChange={(status) => onStatusChange(registration.id, status)}
            />
          )
        },
      },
      {
        accessorKey: "amount_total",
        header: ({ column }) => (
          <SortableHeader column={column} label="Totale" align="right" />
        ),
        cell: (info) => (
          <span className="tabular-nums">
            {formatCurrency(info.getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => <SortableHeader column={column} label="Data" />,
        cell: (info) => formatDateTime(info.getValue<string>()),
      },
      {
        accessorKey: "note_admin",
        header: "Note",
        enableSorting: false,
        cell: (info) => {
          const registration = info.row.original
          return (
            <NoteCell
              registration={registration}
              onSave={(note) => onNoteChange(registration.id, note)}
            />
          )
        },
      },
    ],
    [workshopLabels, battleLabels, onStatusChange, onNoteChange]
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-muted-foreground h-24 text-center"
              >
                Nessun iscritto trovato.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
