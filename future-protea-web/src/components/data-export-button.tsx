/**
 * @fileoverview Reusable Data Export Button
 * @module components/data-export-button
 *
 * @description
 * Dropdown button that exports table data as CSV or Excel.
 * Uses client-side CSV generation from provided data.
 */

import { memo, useState, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DataExportButtonProps {
  /** Label for the export (used in filename) */
  label: string;
  /** Function that returns the data to export as array of objects */
  getData: () => Promise<Record<string, unknown>[]> | Record<string, unknown>[];
  /** Column definitions for CSV headers */
  columns?: { key: string; label: string }[];
}

function toCsv(data: Record<string, unknown>[], columns?: { key: string; label: string }[]): string {
  if (data.length === 0) return '';

  const cols = columns ?? Object.keys(data[0]).map((k) => ({ key: k, label: k }));
  const headers = cols.map((c) => `"${c.label}"`).join(',');
  const rows = data.map((row) =>
    cols
      .map((c) => {
        const val = row[c.key];
        if (val == null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',')
  );

  return [headers, ...rows].join('\n');
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const DataExportButton = memo(function DataExportButton({
  label,
  getData,
  columns,
}: DataExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = await getData();
      if (data.length === 0) {
        toast.info('No data to export');
        return;
      }
      const csv = toCsv(data, columns);
      const filename = `${label.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCsv(csv, filename);
      toast.success(`Exported ${data.length} records`);
    } catch {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [getData, columns, label]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExport}>
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
