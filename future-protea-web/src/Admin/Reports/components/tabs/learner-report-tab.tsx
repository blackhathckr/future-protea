import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ColumnDef } from '@tanstack/react-table';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import { ReportDataTable } from '../report-data-table';
import { useReportQuery } from '../../hooks';
import { ReportSummaryCard } from '../cards';
import { formatReportDate } from '../../data';
import type { ReportFilters, LearnerReportData } from '../../data/types';

const INACTIVE_THRESHOLD = 20; // % threshold for churn alert

interface LearnerReportTabProps {
  filters: ReportFilters;
}

interface LearnerRow {
  id: string;
  name: string;
  email: string;
  status: string;
  lastLogin: string;
  joinedAt: string;
}

const columns: ColumnDef<LearnerRow, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const isInactive =
        !row.original.lastLogin ||
        new Date(row.original.lastLogin).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000;
      return (
        <Badge
          variant="outline"
          className={
            isInactive
              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          }
        >
          {isInactive ? 'Inactive' : 'Active'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'lastLogin',
    header: 'Last Login',
    cell: ({ row }) =>
      row.original.lastLogin ? formatReportDate(row.original.lastLogin) : 'Never',
  },
  {
    accessorKey: 'joinedAt',
    header: 'Joined',
    cell: ({ row }) => formatReportDate(row.original.joinedAt),
  },
];

export const LearnerReportTab = memo(function LearnerReportTab({
  filters,
}: LearnerReportTabProps) {
  const { data, isLoading, isError } = useReportQuery('learner', filters);

  if (isLoading) return <LoadingState message="Loading learner report..." />;
  if (isError) return <EmptyState title="Error" message="Failed to load learner report." />;

  const report = data as LearnerReportData | undefined;
  if (!report) return null;

  const summary = report.summary ?? { totalLearners: 0, activeLearners: 0, inactiveLearners: 0, newRegistrations: 0 };
  const learnerDetails = (report.learnerDetails ?? []) as LearnerRow[];

  const inactivePercent = summary.totalLearners > 0
    ? (summary.inactiveLearners / summary.totalLearners) * 100
    : 0;
  const highChurn = inactivePercent >= INACTIVE_THRESHOLD;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportSummaryCard icon="Users" title="Total Learners" value={summary.totalLearners.toLocaleString()} />
        <ReportSummaryCard icon="Activity" title="Active Users" value={summary.activeLearners.toLocaleString()} />
        <div>
          <ReportSummaryCard icon="TrendingUp" title="Inactive Users" value={summary.inactiveLearners.toLocaleString()} />
          {highChurn && (
            <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400 px-1">
              High churn: {inactivePercent.toFixed(1)}% inactive
            </p>
          )}
        </div>
        <ReportSummaryCard icon="Users" title="New Registrations" value={summary.newRegistrations} />
      </div>

      {highChurn && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Churn Alert: {summary.inactiveLearners} learners ({inactivePercent.toFixed(1)}%) have been inactive for 30+ days. Consider re-engagement campaigns.
            </p>
          </CardContent>
        </Card>
      )}

      <ReportDataTable
        title="Learner Details"
        columns={columns}
        data={learnerDetails}
        searchKeys={['name', 'email']}
        searchPlaceholder="Search learners..."
        emptyMessage="No learners found for the selected filters."
      />
    </div>
  );
});
