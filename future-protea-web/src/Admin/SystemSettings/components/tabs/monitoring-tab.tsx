import { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Cpu, HardDrive, MemoryStick, Clock, RefreshCw } from 'lucide-react';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import { useMonitoringQuery } from '../../hooks';
import { formatUptime } from '../../data';
import type { ServiceStatus } from '../../data/types';

const statusColors: Record<ServiceStatus, string> = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  down: 'bg-red-500',
};

const MetricCard = memo(function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: typeof Cpu;
  label: string;
  value: number | string;
  unit: string;
  color: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">
              {value}
              <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export const MonitoringTab = memo(function MonitoringTab() {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useMonitoringQuery();

  if (isLoading) {
    return <LoadingState message="Loading monitoring data..." />;
  }

  if (isError) {
    return <EmptyState title="Error" message="Failed to load monitoring data." />;
  }

  if (!data) return null;

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Auto-refreshing every 30s. Last updated: {lastUpdated}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Cpu}
          label="CPU Usage"
          value={data.cpu.toFixed(1)}
          unit="%"
          color="bg-blue-600"
        />
        <MetricCard
          icon={MemoryStick}
          label="Memory Usage"
          value={data.memory.toFixed(1)}
          unit="%"
          color="bg-purple-600"
        />
        <MetricCard
          icon={HardDrive}
          label="Disk Usage"
          value={data.disk.toFixed(1)}
          unit="%"
          color="bg-orange-600"
        />
        <MetricCard
          icon={Clock}
          label="Uptime"
          value={formatUptime(data.uptime)}
          unit=""
          color="bg-green-600"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Uptime</TableHead>
                <TableHead className="text-right">Response Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          statusColors[service.status]
                        }`}
                      />
                      <Badge variant="outline" className="capitalize">
                        {service.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {service.uptime.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right">{service.responseTime}ms</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
});
