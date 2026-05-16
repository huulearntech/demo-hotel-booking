"use client"

import { useState } from "react"

import { Button } from "./ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationEllipsis,
} from "./ui/pagination"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { type Table as TableType } from "@tanstack/react-table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  // total number of pages from the server (optional; if not provided it's computed from data length)
  pageCount?: number
  // called when pagination changes so parent can fetch new page
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount: externalPageCount,
  onPaginationChange,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 2,
  });

  const isServerSidePagination = typeof onPaginationChange === "function";
  const pageCount = externalPageCount ?? Math.ceil(data.length / pagination.pageSize);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(isServerSidePagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    // tell tanstack table we control pagination externally
    manualPagination: isServerSidePagination,
    pageCount,
    // intercept pagination changes to keep local state and notify parent
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === "function" ? updater(pagination) : updater
      setPagination(newState)
      onPaginationChange?.(newState)
    },
    state: { pagination },
  })

  return (
    <div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không có kết quả
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

function DataTablePagination<TData>({ table } : { table: TableType<TData> }) {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <Button
            onClick={table.previousPage}
            disabled={!table.getCanPreviousPage()}
            variant="ghost"
            aria-label="Previous page"
          >
            <ChevronLeftIcon />
            <span className="hidden sm:block">Trang trước</span>
          </Button>
        </PaginationItem>
        <PaginationItem>
          <Button
            onClick={table.nextPage}
            disabled={!table.getCanNextPage()}
            variant="ghost"
            aria-label="Next page"
          >
            <span className="hidden sm:block">Trang sau</span>
            <ChevronRightIcon />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}