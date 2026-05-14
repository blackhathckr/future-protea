import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import { ReportDataTable } from '../report-data-table';
import { useReportQuery } from '../../hooks';
import { ReportSummaryCard } from '../cards';
import { formatReportDate, formatPercentage } from '../../data';
import type { ReportFilters, SessionReportData } from '../../data/types';

interface SessionReportTabProps {
  filters: ReportFilters;
}

interface SessionRow {
  id: string;
  title: string;
  instructor: string;
  date: string;
  attendees: number;
  maxParticipants: number;
  duration: number;
  rating: number;
  revenue: number;
  status: string;
}

const statusBadge: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  LIVE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const columns: ColumnDef<SessionRow, unknown>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
  },
  { accessorKey: 'instructor', header: 'Instructor' },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => formatReportDate(row.original.date),
  },
  {
    accessorKey: 'attendees',
    header: () => <span className="text-right block">Attendees</span>,
    cell: ({ row }) => <span className="text-right block">{row.original.attendees}</span>,
  },
  {
    id: 'attendance',
    header: () => <span className="text-right block">Attendance</span>,
    cell: ({ row }) => {
      const rate = row.original.maxParticipants > 0
        ? (row.original.attendees / row.original.maxParticipants) * 100
        : 0;
      return <span className="text-right block">{formatPercentage(rate)}</span>;
    },
  },
  {
    accessorKey: 'rating',
    header: () => <span className="text-right block">Rating</span>,
    cell: ({ row }) => (
      <span className="text-right block">
        {row.original.rating > 0 ? row.original.rating.toFixed(1) : '-'}
      </span>
    ),
  },
  {
    accessorKey: 'revenue',
    header: () => <span className="text-right block">Revenue</span>,
    cell: ({ row }) => (
      <span className="text-right block">INR {row.original.revenue.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={statusBadge[row.original.status] ?? 'bg-gray-100 text-gray-700'}
      >
        {row.original.status}
      </Badge>
    ),
  },
];

export const SessionReportTab = memo(function SessionReportTab({
  filters,
}: SessionReportTabProps) {
  const { data, isLoading, isError } = useReportQuery('session', filters);

  if (isLoading) return <LoadingState message="Loading session report..." />;
  if (isError) return <EmptyState title="Error" message="Failed to load session report." />;

  const report = data as SessionReportData | undefined;
  if (!report) return null;

  const summary = report.summary ?? {
    totalSessions: 0, completedSessions: 0, totalAttendees: 0,
    avgAttendance: 0, sessionRevenue: 0, totalDuration: 0,
  };
  const sessionDetails = (report.sessionDetails ?? []) as SessionRow[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ReportSummaryCard icon="Video" title="Total Sessions" value={summary.totalSessions} />
        <ReportSummaryCard icon="Users" title="Total Attendees" value={summary.totalAttendees} />
        <ReportSummaryCard icon="Activity" title="Avg Attendance" value={summary.avgAttendance} />
        <ReportSummaryCard icon="DollarSign" title="Session Revenue" value={`INR ${summary.sessionRevenue.toLocaleString()}`} />
        <ReportSummaryCard icon="Clock" title="Total Duration" value={`${summary.totalDuration} min`} />
      </div>

      <ReportDataTable
        title="Session Details"
        columns={columns}
        data={sessionDetails}
        searchKeys={['title', 'instructor']}
        searchPlaceholder="Search sessions..."
        emptyMessage="No sessions found for the selected filters."
      />
    </div>
  );
});
