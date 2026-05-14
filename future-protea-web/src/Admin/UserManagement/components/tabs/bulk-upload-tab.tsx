/**
 * @fileoverview Bulk user upload tab with CSV/XLSX parsing, inline editing, and validation
 * @module Admin/UserManagement/components/tabs/bulk-upload-tab
 */

import { memo, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { FileText, CheckCircle2, XCircle, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useBulkUploadMutation } from '../../hooks';
import { parseCSV, parseXLSX, validateBulkUploadRow, downloadBulkUploadTemplate } from '../../data/helpers';
import type { ParsedBulkRow } from '../../data/types';

type EditableField = 'firstName' | 'lastName' | 'email' | 'phone' | 'countryCode' | 'role';

export const BulkUploadTab = memo(function BulkUploadTab({ onSuccess }: { onSuccess?: () => void }) {
  const [parsedRows, setParsedRows] = useState<ParsedBulkRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkUploadMutation = useBulkUploadMutation();

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be under 2MB');
      e.target.value = '';
      return;
    }

    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const rawRows = parseCSV(content);
        const validated = rawRows.map((row, index) => validateBulkUploadRow(row, index + 1));
        setParsedRows(validated);
      };
      reader.readAsText(file);
    } else {
      // XLSX / XLS
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        const rawRows = parseXLSX(buffer);
        const validated = rawRows.map((row, index) => validateBulkUploadRow(row, index + 1));
        setParsedRows(validated);
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const handleCellEdit = useCallback((rowIndex: number, field: EditableField, value: string) => {
    setParsedRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[rowIndex] };
      row[field] = value;
      // Re-validate
      const revalidated = validateBulkUploadRow(
        { firstName: row.firstName, lastName: row.lastName, email: row.email, phone: row.phone ?? '', countryCode: row.countryCode ?? '', role: row.role },
        row.rowIndex,
      );
      updated[rowIndex] = revalidated;
      return updated;
    });
  }, []);

  const handleReset = useCallback(() => {
    setParsedRows([]);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const usersToCreate = validRows.map((row) => ({
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone || undefined,
      countryCode: row.phone ? (row.countryCode || '+91') : undefined,
      role: row.role,
    }));
    bulkUploadMutation.mutate(usersToCreate, {
      onSuccess: () => {
        handleReset();
        onSuccess?.();
      },
    });
  }, [validRows, bulkUploadMutation, onSuccess, handleReset]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="max-w-sm"
        />
        {fileName && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {fileName}
          </div>
        )}
        <Button variant="outline" size="sm" className="gap-1.5 ml-auto" onClick={downloadBulkUploadTemplate}>
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      {/* Summary */}
      {parsedRows.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{parsedRows.length} rows parsed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-400">
              {validRows.length} valid
            </span>
          </div>
          {invalidRows.length > 0 && (
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700 dark:text-red-400">
                {invalidRows.length} with errors
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground ml-auto">Click any cell to edit</p>
        </div>
      )}

      {/* Preview Table with inline editing */}
      {parsedRows.length > 0 && (
        <>
          <ScrollArea className="h-[400px]">
            <div className="min-w-[900px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Row</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Country Code</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedRows.map((row, idx) => (
                  <TableRow
                    key={row.rowIndex}
                    className={!row.isValid ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                  >
                    <TableCell className="font-mono text-xs">{row.rowIndex}</TableCell>
                    <TableCell>
                      <Input
                        className="h-7 text-sm border-transparent hover:border-input focus:border-input"
                        value={row.firstName}
                        onChange={(e) => handleCellEdit(idx, 'firstName', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-7 text-sm border-transparent hover:border-input focus:border-input"
                        value={row.lastName}
                        onChange={(e) => handleCellEdit(idx, 'lastName', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-7 text-sm border-transparent hover:border-input focus:border-input"
                        value={row.email}
                        onChange={(e) => handleCellEdit(idx, 'email', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-7 text-sm border-transparent hover:border-input focus:border-input"
                        value={row.phone ?? ''}
                        onChange={(e) => handleCellEdit(idx, 'phone', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-7 w-20 text-sm border-transparent hover:border-input focus:border-input"
                        value={row.countryCode ?? ''}
                        placeholder="+91"
                        onChange={(e) => handleCellEdit(idx, 'countryCode', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.role}
                        onValueChange={(value) => handleCellEdit(idx, 'role', value)}
                      >
                        <SelectTrigger className="h-7 text-sm border-transparent hover:border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EDUCATOR">Educator</SelectItem>
                          <SelectItem value="LEARNER">Learner</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {row.isValid ? (
                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                          Valid
                        </Badge>
                      ) : (
                        <div className="space-y-1">
                          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                            Error
                          </Badge>
                          {row.errors?.map((err, i) => (
                            <p key={i} className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              {err}
                            </p>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>
              Clear
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={validRows.length === 0 || bulkUploadMutation.isPending}
            >
              {bulkUploadMutation.isPending
                ? 'Uploading...'
                : `Upload ${validRows.length} Valid Users`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
});
