import { useMemo, useState } from "react"
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
import { PAYMENT_STATUS_BADGE_CLASSES, PAYMENT_STATUS_LABELS } from "@/lib/paymentStatus"
import type { Registration } from "@/types/registration"

interface RegistrationsTableProps {
  data: Registration[]
  onRowClick: (registration: Registration) => void
}

function SortableHeader({
  column,
  label,
}: {
  column: Column<Registration, unknown>
  label: string
}) {
  const sorted = column.getIsSorted()

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium tracking-wide uppercase"
    >
      {label}
      {sorted === "asc" && <ArrowUp className="size-3.5" />}
      {sorted === "desc" && <ArrowDown className="size-3.5" />}
      {!sorted && <ArrowUpDown className="size-3.5 opacity-40" />}
    </button>
  )
}

export function RegistrationsTable({ data, onRowClick }: RegistrationsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "cognome", desc: false }])

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
        accessorKey: "payment_status",
        header: ({ column }) => <SortableHeader column={column} label="Stato" />,
        cell: (info) => {
          const status = info.getValue<Registration["payment_status"]>()
          return (
            <Badge variant="outline" className={PAYMENT_STATUS_BADGE_CLASSES[status]}>
              {PAYMENT_STATUS_LABELS[status]}
            </Badge>
          )
        },
      },
    ],
    []
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
              <TableRow
                key={row.id}
                onClick={() => onRowClick(row.original)}
                className="cursor-pointer"
              >
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
