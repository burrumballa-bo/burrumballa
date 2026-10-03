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
import {
  STUDENT_STATE_BADGE_CLASSES,
  STUDENT_STATE_LABELS,
  studentSubscriptionState,
  todayIso,
  type StudentSubscriptionState,
} from "@/lib/subscriptions"
import type { SchoolStudent } from "@/types/school"

interface Row {
  student: SchoolStudent
  first_name: string
  last_name: string
  state: StudentSubscriptionState
}

// Ordine per lo stato: attivi prima, poi futuri, scaduti, senza abbonamento.
const STATE_ORDER: Record<StudentSubscriptionState, number> = {
  current: 0,
  future: 1,
  expired: 2,
  none: 3,
}

function SortableHeader({ column, label }: { column: Column<Row, unknown>; label: string }) {
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

interface SchoolStudentsTableProps {
  data: SchoolStudent[]
  onRowClick: (student: SchoolStudent) => void
}

export function SchoolStudentsTable({ data, onRowClick }: SchoolStudentsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "last_name", desc: false }])

  const rows = useMemo<Row[]>(() => {
    const today = todayIso()
    return data.map((student) => ({
      student,
      first_name: student.first_name,
      last_name: student.last_name,
      state: studentSubscriptionState(student.subscriptions, today),
    }))
  }, [data])

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "first_name",
        header: ({ column }) => <SortableHeader column={column} label="Nome" />,
        sortingFn: "text",
      },
      {
        accessorKey: "last_name",
        header: ({ column }) => <SortableHeader column={column} label="Cognome" />,
        sortingFn: "text",
      },
      {
        accessorKey: "state",
        header: ({ column }) => <SortableHeader column={column} label="Abbonamento" />,
        sortingFn: (a, b) => STATE_ORDER[a.original.state] - STATE_ORDER[b.original.state],
        cell: (info) => {
          const state = info.getValue<StudentSubscriptionState>()
          return (
            <Badge variant="outline" className={STUDENT_STATE_BADGE_CLASSES[state]}>
              {STUDENT_STATE_LABELS[state]}
            </Badge>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: rows,
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
              <TableCell colSpan={columns.length} className="text-muted-foreground h-24 text-center">
                Nessun iscritto trovato.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick(row.original.student)}
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
