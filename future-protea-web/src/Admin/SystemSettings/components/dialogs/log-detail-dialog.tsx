import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getLogLevelBadge } from '../../data';
import type { SystemLog } from '../../data/types';

interface LogDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: SystemLog | null;
}

export const LogDetailDialog = memo(function LogDetailDialog({
  open,
  onOpenChange,
  log,
}: LogDetailDialogProps) {
  if (!log) return null;

  const level = getLogLevelBadge(log.level);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Entry Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
              <p className="text-sm">{new Date(log.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Level</p>
              <Badge variant="outline" className={level.className}>
                {level.label}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Service</p>
              <p className="text-sm font-mono">{log.service}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ID</p>
              <p className="text-sm font-mono text-xs">{log.id}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Message</p>
            <p className="text-sm whitespace-pre-wrap rounded-md bg-muted p-3">
              {log.message}
            </p>
          </div>

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Metadata</p>
                <pre className="overflow-auto rounded-md bg-muted p-3 text-xs font-mono max-h-[200px]">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
