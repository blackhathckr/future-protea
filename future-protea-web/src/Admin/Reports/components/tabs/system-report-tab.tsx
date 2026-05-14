import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ColumnDef } from '@tanstack/react-table';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import { ReportDataTable } from '../report-data-table';
import { useReportQuery } from '../../hooks';
import { ReportSummaryCard } from '../cards';
import { formatPercentage, formatReportDate } from '../../data';
import type { ReportFilters, SystemReportData } from '../../data/types';

interface SystemReportTabProps {
  filters: ReportFilters;
}

interface ServiceRow {
  id: string;
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
  lastChecked: string;
}

const statusColors: Record<string, string> = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  down: 'bg-red-500',
};

const columns: ColumnDef<ServiceRow, unknown>[] = [
  {
    accessorKey: 'service',
    header: 'Service',
    cell: ({ row }) => <span className="font-medium">{row.original.service}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${statusColors[row.original.status] ?? 'bg-gray-500'}`}
        />
        <span className="capitalize">{row.original.status}</span>
      </div>
    ),
  },
  {
    accessorKey: 'uptime',
    header: () => <span className="text-right block">Uptime</span>,
    cell: ({ row }) => (
      <span className="text-right block">{formatPercentage(row.original.uptime)}</span>
    ),
  },
  {
    accessorKey: 'responseTime',
    header: () => <span className="text-right block">Response Time</span>,
    cell: ({ row }) => (
      <span className="text-right block">{row.original.responseTime}ms</span>
    ),
  },
  {
    accessorKey: 'lastChecked',
    header: 'Last Checked',
    cell: ({ row }) => formatReportDate(row.original.lastChecked),
  },
];

export const SystemReportTab = memo(function SystemReportTab({
  filters,
}: SystemReportTabProps) {
  const { data, isLoading, isError } = useReportQuery('system', filters);

  if (isLoading) return <LoadingState message="Loading system report..." />;
  if (isError) return <EmptyState title="Error" message="Failed to load system report." />;

  const report = data as SystemReportData | undefined;
  if (!report) return null;

  const summary = report.summary ?? { uptimePercent: 0, avgResponseTime: 0, errorRate: 0 };
  const performanceOverTime = report.performanceOverTime ?? [];
  const serviceHealth = (report.serviceHealth ?? []) as ServiceRow[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReportSummaryCard icon="Server" title="Uptime" value={formatPercentage(summary.uptimePercent)} />
        <ReportSummaryCard icon="Clock" title="Avg Response Time" value={`${summary.avgResponseTime}ms`} />
        <ReportSummaryCard icon="Activity" title="Error Rate" value={formatPercentage(summary.errorRate)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceOverTime}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="responseTime" name="Response Time (ms)" stroke="var(--primary)" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="errorRate" name="Error Rate (%)" stroke="var(--destructive)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <ReportDataTable
        title="Service Health"
        columns={columns}
        data={serviceHealth}
        searchKeys={['service']}
        searchPlaceholder="Search services..."
        emptyMessage="No service health data available."
      />
    </div>
  );
});
