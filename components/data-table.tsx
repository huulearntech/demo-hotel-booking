"use client"

// TODO: Serverside pagination.
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
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
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
                  No results.
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
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();

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
            <span className="hidden sm:block">Previous</span>
          </Button>
        </PaginationItem>
        {totalPages <= 5 ?
          Array.from({ length: totalPages }).map((_, index) =>
            <PaginationItem key={index}>
              <Button
                variant={index + 1 == currentPage ? "outline" : "ghost"}
                onClick={() => table.setPageIndex(index)}
                aria-current={index + 1 == currentPage ? "page" : undefined}
              >
                {index + 1}
              </Button>
            </PaginationItem>
          ) : (
            <>
              {currentPage > 1 &&
                <PaginationItem>
                  <Button variant="ghost" onClick={() => table.setPageIndex(1)}> 1 </Button>
                </PaginationItem>
              }

              {currentPage >= 3 &&
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              }

              <PaginationItem>
                <Button variant="outline">
                  {currentPage}
                </Button>
              </PaginationItem>

              {currentPage <= totalPages - 2 &&
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              }
              {
                currentPage < totalPages &&
                <PaginationItem>
                  <Button variant="ghost" onClick={() => table.setPageIndex(totalPages)}>
                    {totalPages}
                  </Button>
                </PaginationItem>
              }
            </>
          )
        }
        <PaginationItem>
          <Button
            onClick={table.nextPage}
            disabled={!table.getCanNextPage()}
            variant="ghost"
            aria-label="Next page"
          >
            <span className="hidden sm:block">Next</span>
            <ChevronRightIcon />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}