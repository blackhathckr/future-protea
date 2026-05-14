import { memo } from 'react';
import {
  AreaChart,
  Area,
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
import type { ReportFilters, RevenueReportData } from '../../data/types';

interface RevenueReportTabProps {
  filters: ReportFilters;
}

interface TrendRow {
  date: string;
  revenue: number;
  tournamentRevenue: number;
  subscriptionRevenue: number;
  sessionRevenue: number;
}

interface BreakdownRow {
  id: string;
  source: string;
  amount: number;
  transactions: number;
  percentage: number;
}

const trendColumns: ColumnDef<TrendRow, unknown>[] = [
  {
    accessorKey: 'date',
    header: 'Month',
    cell: ({ row }) => <span className="font-medium">{row.original.date}</span>,
  },
  {
    accessorKey: 'tournamentRevenue',
    header: () => <span className="text-right block">Tournaments</span>,
    cell: ({ row }) => (
      <span className="text-right block">INR {(row.original.tournamentRevenue ?? 0).toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'subscriptionRevenue',
    header: () => <span className="text-right block">Subscriptions</span>,
    cell: ({ row }) => (
      <span className="text-right block">INR {(row.original.subscriptionRevenue ?? 0).toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'sessionRevenue',
    header: () => <span className="text-right block">Sessions</span>,
    cell: ({ row }) => (
      <span className="text-right block">INR {(row.original.sessionRevenue ?? 0).toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'revenue',
    header: () => <span className="text-right block">Total</span>,
    cell: ({ row }) => (
      <span className="text-right block font-medium">INR {row.original.revenue.toLocaleString()}</span>
    ),
  },
];

const breakdownColumns: ColumnDef<BreakdownRow, unknown>[] = [
  {
    accessorKey: 'source',
    header: 'Source',
    cell: ({ row }) => <span className="font-medium">{row.original.source}</span>,
  },
  {
    accessorKey: 'amount',
    header: () => <span className="text-right block">Amount</span>,
    cell: ({ row }) => (
      <span className="text-right block">INR {row.original.amount.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'transactions',
    header: () => <span className="text-right block">Transactions</span>,
    cell: ({ row }) => <span className="text-right block">{row.original.transactions}</span>,
  },
  {
    accessorKey: 'percentage',
    header: () => <span className="text-right block">Share</span>,
    cell: ({ row }) => (
      <span className="text-right block">{formatPercentage(row.original.percentage)}</span>
    ),
  },
];

export const RevenueReportTab = memo(function RevenueReportTab({
  filters,
}: RevenueReportTabProps) {
  const { data, isLoading, isError } = useReportQuery('revenue', filters);

  if (isLoading) return <LoadingState message="Loading revenue report..." />;
  if (isError) return <EmptyState title="Error" message="Failed to load revenue report." />;

  const report = data as RevenueReportData | undefined;
  if (!report) return null;

  const summary = report.summary ?? { totalRevenue: 0, tournamentRevenue: 0, subscriptionRevenue: 0, refunds: 0 };
  const trend = (report.trend ?? []) as TrendRow[];
  const breakdown = (report.breakdown ?? []) as BreakdownRow[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportSummaryCard icon="DollarSign" title="Total Revenue" value={`INR ${summary.totalRevenue.toLocaleString()}`} />
        <ReportSummaryCard icon="Trophy" title="Tournament Revenue" value={`INR ${summary.tournamentRevenue.toLocaleString()}`} />
        <ReportSummaryCard icon="CreditCard" title="Subscription Revenue" value={`INR ${summary.subscriptionRevenue.toLocaleString()}`} />
        <ReportSummaryCard icon="TrendingUp" title="Refunds" value={`INR ${summary.refunds.toLocaleString()}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {trend.length > 0 && (
        <ReportDataTable
          title="Monthly Revenue by Stream"
          columns={trendColumns}
          data={trend}
          searchKeys={['date']}
          searchPlaceholder="Search month..."
          emptyMessage="No monthly revenue data."
        />
      )}

      <ReportDataTable
        title="Revenue Breakdown"
        columns={breakdownColumns}
        data={breakdown}
        searchKeys={['source']}
        searchPlaceholder="Search source..."
        emptyMessage="No revenue data for the selected period."
      />
    </div>
  );
});
