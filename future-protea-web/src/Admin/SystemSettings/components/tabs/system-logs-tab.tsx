import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye } from 'lucide-react';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import { useSystemLogsQuery, useModulesQuery } from '../../hooks';
import { getLogLevelBadge } from '../../data';
import type { SystemLog, LogLevel } from '../../data/types';
import { LogDetailDialog } from '../dialogs/log-detail-dialog';

const LogRow = memo(function LogRow({
  log,
  onView,
}: {
  log: SystemLog;
  onView: (log: SystemLog) => void;
}) {
  const level = getLogLevelBadge(log.level);

  return (
    <motion.tr className="border-b transition-colors hover:bg-muted/50">
      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
        {new Date(log.timestamp).toLocaleString()}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={level.className}>
          {level.label}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-sm">{log.service}</TableCell>
      <TableCell className="max-w-[400px] truncate">{log.message}</TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onView(log)}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </motion.tr>
  );
});

export const SystemLogsTab = memo(function SystemLogsTab() {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<LogLevel | ''>('');
  const [module, setModule] = useState('');
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: modulesData } = useModulesQuery();
  const modules = modulesData ?? [];

  const { data, isLoading, isError, refetch } = useSystemLogsQuery({
    search,
    level: level || undefined,
    module: module || undefined,
  });

  const handleView = (log: SystemLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  if (isLoading) {
    return <LoadingState message="Loading system logs..." />;
  }

  if (isError) {
    return <EmptyState title="Error" message="Failed to load system logs." />;
  }

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={level || 'ALL'} onValueChange={(v) => setLevel(v === 'ALL' ? '' : v as LogLevel)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Levels</SelectItem>
            <SelectItem value="INFO">Info</SelectItem>
            <SelectItem value="WARN">Warning</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
            <SelectItem value="DEBUG">Debug</SelectItem>
          </SelectContent>
        </Select>
        <Select value={module || 'ALL'} onValueChange={(v) => setModule(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Modules</SelectItem>
            {modules.map((m) => (
              <SelectItem key={m} value={m}>
                {m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title="No System Logs"
          description="No log entries match your filters."
          
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <LogRow key={log.id} log={log} onView={handleView} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <LogDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        log={selectedLog}
      />
    </div>
  );
});
