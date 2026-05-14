import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import { useAdminLogsQuery, useModulesQuery } from '../../hooks';

export const AdminLogsTab = memo(function AdminLogsTab() {
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const { data: modulesData } = useModulesQuery();
  const modules = modulesData ?? [];

  const { data, isLoading, isError, refetch } = useAdminLogsQuery({
    search,
    module: module || undefined,
    dateFrom: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
    dateTo: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
  });

  if (isLoading) {
    return <LoadingState message="Loading admin logs..." />;
  }

  if (isError) {
    return <EmptyState title="Error" message="Failed to load admin logs." />;
  }

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search admin logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[160px] justify-start text-left font-normal',
                !dateFrom && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, 'MMM dd') : 'From'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[160px] justify-start text-left font-normal',
                !dateTo && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, 'MMM dd') : 'To'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title="No Admin Logs"
          description="No admin activity logs found for the selected period."
          
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin Name</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Resource ID</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <motion.tr
                  key={log.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{log.adminName}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell className="font-mono text-xs">{log.resourceId}</TableCell>
                  <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
});
