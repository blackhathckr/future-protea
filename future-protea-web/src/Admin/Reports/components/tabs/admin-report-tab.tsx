import { memo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import { ReportDataTable } from '../report-data-table';
import { useReportQuery } from '../../hooks';
import { ReportSummaryCard } from '../cards';
import { formatReportDate } from '../../data';
import type { ReportFilters, AdminReportData } from '../../data/types';

interface AdminReportTabProps {
  filters: ReportFilters;
}

interface ActivityRow {
  id: string;
  adminName: string;
  action: string;
  resource: string;
  timestamp: string;
}

const columns: ColumnDef<ActivityRow, unknown>[] = [
  {
    accessorKey: 'adminName',
    header: 'Admin',
    cell: ({ row }) => <span className="font-medium">{row.original.adminName}</span>,
  },
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'resource', header: 'Resource' },
  {
    accessorKey: 'timestamp',
    header: 'Timestamp',
    cell: ({ row }) => formatReportDate(row.original.timestamp),
  },
];

export const AdminReportTab = memo(function AdminReportTab({
  filters,
}: AdminReportTabProps) {
  const { data, isLoading, isError } = useReportQuery('admin', filters);

  if (isLoading) return <LoadingState message="Loading admin report..." />;
  if (isError) return <EmptyState title="Error" message="Failed to load admin report." />;

  const report = data as AdminReportData | undefined;
  if (!report) return null;

  const summary = report.summary ?? { totalActions: 0, mostActiveAdmin: '-' };
  const activities = (report.activities ?? []) as ActivityRow[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReportSummaryCard icon="Shield" title="Total Actions" value={summary.totalActions.toLocaleString()} />
        <ReportSummaryCard icon="Users" title="Most Active Admin" value={summary.mostActiveAdmin} />
      </div>

      <ReportDataTable
        title="Admin Activity Log"
        columns={columns}
        data={activities}
        searchKeys={['adminName', 'action', 'resource']}
        searchPlaceholder="Search activity..."
        emptyMessage="No admin activities found."
      />
    </div>
  );
});
