/**
 * @fileoverview Reusable data table for report tabs with search and pagination.
 * Mirrors the UI/UX of Admin > Users table (TanStack React Table, debounced
 * search, Previous/Next pagination, "Showing X to Y of Z" info).
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReportDataTableProps<TData> {
  /** Column definitions (TanStack React Table ColumnDef) */
  columns: ColumnDef<TData, unknown>[];
  /** Row data */
  data: TData[];
  /** Card title shown above the table */
  title: string;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Keys to search across — leave empty to disable search */
  searchKeys?: string[];
  /** Rows per page (default 10) */
  pageSize?: number;
  /** Message shown when no data */
  emptyMessage?: string;
}

export function ReportDataTable<TData>({
  columns,
  data,
  title,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  pageSize = 10,
  emptyMessage = 'No data found.',
}: ReportDataTableProps<TData>) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Client-side filtered data
  const filteredData = useMemo(() => {
    if (!debouncedSearch || searchKeys.length === 0) return data;
    const term = debouncedSearch.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => {
        const value = (row as Record<string, unknown>)[key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(term);
      }),
    );
  }, [data, debouncedSearch, searchKeys]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: { pageSize },
    },
  });

  const { pageIndex } = table.getState().pagination;
  const totalRows = filteredData.length;
  const totalPages = table.getPageCount();
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <Card>
      <CardHeader className="flex flex-col space-y-3 pb-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        {searchKeys.length > 0 && (
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                table.setPageIndex(0);
              }}
              className="pl-9 h-9"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="whitespace-nowrap">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Showing {from} to {to} of {totalRows}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!table.getCanPreviousPage()}
                    onClick={() => table.previousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!table.getCanNextPage()}
                    onClick={() => table.nextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
