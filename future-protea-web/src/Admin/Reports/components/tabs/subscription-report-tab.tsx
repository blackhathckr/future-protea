import { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ColumnDef } from '@tanstack/react-table';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import { ReportDataTable } from '../report-data-table';
import { useReportQuery } from '../../hooks';
import { ReportSummaryCard } from '../cards';
import { formatPercentage } from '../../data';
import type { ReportFilters, SubscriptionReportData } from '../../data/types';

interface SubscriptionReportTabProps {
  filters: ReportFilters;
}

interface SubRow {
  id: string;
  planName: string;
  tier: string;
  subscribers: number;
  revenue: number;
  churnRate: number;
}

const columns: ColumnDef<SubRow, unknown>[] = [
  {
    accessorKey: 'planName',
    header: 'Plan',
    cell: ({ row }) => <span className="font-medium">{row.original.planName}</span>,
  },
  {
    accessorKey: 'subscribers',
    header: () => <span className="text-right block">Subscribers</span>,
    cell: ({ row }) => <span className="text-right block">{row.original.subscribers}</span>,
  },
  {
    accessorKey: 'revenue',
    header: () => <span className="text-right block">Monthly Revenue</span>,
    cell: ({ row }) => (
      <span className="text-right block">INR {row.original.revenue.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'churnRate',
    header: () => <span className="text-right block">Churn Rate</span>,
    cell: ({ row }) => (
      <span className="text-right block">{formatPercentage(row.original.churnRate)}</span>
    ),
  },
];

export const SubscriptionReportTab = memo(function SubscriptionReportTab({
  filters,
}: SubscriptionReportTabProps) {
  const { data, isLoading, isError } = useReportQuery('subscription', filters);

  if (isLoading) return <LoadingState message="Loading subscription report..." />;
  if (isError) return <EmptyState title="Error" message="Failed to load subscription report." />;

  const report = data as SubscriptionReportData | undefined;
  if (!report) return null;

  const summary = report.summary ?? { totalSubscriptions: 0, activeSubscriptions: 0, churnRate: 0, mrr: 0 };
  const byTier = report.byTier ?? [];
  const subscriptionDetails = (report.subscriptionDetails ?? []) as SubRow[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportSummaryCard icon="CreditCard" title="Total Subscriptions" value={summary.totalSubscriptions.toLocaleString()} />
        <ReportSummaryCard icon="Activity" title="Active" value={summary.activeSubscriptions.toLocaleString()} />
        <ReportSummaryCard icon="TrendingUp" title="Churn Rate" value={formatPercentage(summary.churnRate)} />
        <ReportSummaryCard icon="DollarSign" title="MRR" value={`INR ${summary.mrr.toLocaleString()}`} />
      </div>

      {byTier.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byTier}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="tier" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Subscribers" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <ReportDataTable
        title="Plan Comparison"
        columns={columns}
        data={subscriptionDetails}
        searchKeys={['planName']}
        searchPlaceholder="Search plans..."
        emptyMessage="No subscription plans found."
      />
    </div>
  );
});
