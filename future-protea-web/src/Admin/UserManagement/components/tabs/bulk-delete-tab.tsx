/**
 * @fileoverview Bulk delete users tab with XLSX upload, dry-run validation, and confirm
 * @module Admin/UserManagement/components/tabs/bulk-delete-tab
 */

import { memo, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Download,
  AlertTriangle,
  Trash2,
  Loader2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAdminService } from '@/services/admin';
import { useQueryClient } from '@tanstack/react-query';

type DryRunResult = {
  matched: Array<{ id: string; email?: string | null; firstName: string; lastName: string }>;
  invalid: string[];
  protected: Array<{ identifier: string; reason: string }>;
  matchedCount: number;
  invalidCount: number;
  protectedCount: number;
};

interface BulkDeleteTabProps {
  onSuccess?: () => void;
}

export const BulkDeleteTab = memo(function BulkDeleteTab({ onSuccess }: BulkDeleteTabProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [identifiers, setIdentifiers] = useState<string[]>([]);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [reason, setReason] = useState('');
  const [validating, setValidating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
      toast.error('Invalid file format. Please upload .xlsx, .xls, or .csv');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be under 2MB');
      e.target.value = '';
      return;
    }

    setFileName(file.name);
    setDryRunResult(null);
    setReason('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let parsed: string[] = [];

        if (ext === 'csv') {
          const content = event.target?.result as string;
          const lines = content.trim().split('\n');
          // Skip header row
          parsed = lines.slice(1)
            .map((line) => line.split(',')[0]?.trim().replace(/"/g, ''))
            .filter(Boolean);
        } else {
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) return;
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
          // Look for first column (could be named "User_Identifier", "email", "identifier", etc.)
          parsed = rows.map((row) => {
            const values = Object.values(row);
            return String(values[0] ?? '').trim();
          }).filter(Boolean);
        }

        if (parsed.length === 0) {
          toast.error('No valid identifiers found in file');
          return;
        }

        setIdentifiers(parsed);

        // Run dry-run validation
        setValidating(true);
        try {
          const result = await UserAdminService.bulkDeleteUsers({
            identifiers: parsed,
            reason: 'dry-run',
            dryRun: true,
          });
          setDryRunResult(result.data as unknown as DryRunResult);
        } catch {
          toast.error('Failed to validate identifiers');
        } finally {
          setValidating(false);
        }
      } catch {
        toast.error('Failed to parse file');
      }
    };

    if (ext === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!reason.trim()) {
      toast.error('Please enter a reason for deletion');
      return;
    }
    if (!dryRunResult || dryRunResult.matchedCount === 0) return;

    setDeleting(true);
    try {
      const result = await UserAdminService.bulkDeleteUsers({
        identifiers,
        reason: reason.trim(),
        dryRun: false,
      });
      const deletedCount = (result.data as Record<string, number>)?.deletedCount ?? 0;
      toast.success(`Bulk delete complete: ${deletedCount} users deleted`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      onSuccess?.();
    } catch {
      toast.error('Bulk delete failed');
    } finally {
      setDeleting(false);
    }
  }, [identifiers, reason, dryRunResult, queryClient, onSuccess]);

  const handleReset = useCallback(() => {
    setIdentifiers([]);
    setDryRunResult(null);
    setFileName(null);
    setReason('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const downloadTemplate = useCallback(() => {
    const data = [
      { User_Identifier: 'user@example.com' },
      { User_Identifier: 'another@example.com' },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'bulk-delete-template.xlsx');
  }, []);

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
        <Button variant="outline" size="sm" className="gap-1.5 ml-auto" onClick={downloadTemplate}>
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      {validating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Validating identifiers...
        </div>
      )}

      {/* Dry Run Summary */}
      {dryRunResult && (
        <>
          <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{identifiers.length} identifiers parsed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">
                {dryRunResult.matchedCount} matches found
              </span>
            </div>
            {dryRunResult.invalidCount > 0 && (
              <div className="flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-400">
                  {dryRunResult.invalidCount} not found
                </span>
              </div>
            )}
            {dryRunResult.protectedCount > 0 && (
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  {dryRunResult.protectedCount} protected
                </span>
              </div>
            )}
          </div>

          {/* Matched Users Table */}
          {dryRunResult.matched && dryRunResult.matched.length > 0 && (
            <ScrollArea className="h-[200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dryRunResult.matched.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                          Will Delete
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          {/* Invalid identifiers */}
          {dryRunResult.invalid.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10 p-3 space-y-1">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Invalid / Not Found ({dryRunResult.invalid.length}):
              </p>
              <div className="flex flex-wrap gap-1">
                {dryRunResult.invalid.map((id, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-red-200 text-red-600">
                    {id}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Protected accounts */}
          {dryRunResult.protected.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10 p-3 space-y-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Protected Accounts ({dryRunResult.protected.length}):
              </p>
              {dryRunResult.protected.map((p, i) => (
                <p key={i} className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {p.identifier}: {p.reason}
                </p>
              ))}
            </div>
          )}

          {dryRunResult.matchedCount === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No valid users found for deletion. Please check your file.
            </div>
          )}

          {/* Reason + Confirm */}
          {dryRunResult.matchedCount > 0 && (
            <div className="space-y-3 border-t pt-4">
              <div className="space-y-2">
                <Label>
                  Deletion Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for deleting these users (required)..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Clear
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={deleting || !reason.trim()}
                  className="gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Confirm Deletion ({dryRunResult.matchedCount} users)
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});
