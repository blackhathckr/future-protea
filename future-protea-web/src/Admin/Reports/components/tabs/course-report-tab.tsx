import { memo, useMemo } from 'react';
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
import type { ReportFilters, TournamentReportData } from '../../data/types';

interface CourseReportTabProps {
  filters: ReportFilters;
}

interface TournamentRow {
  id: string;
  name: string;
  instructor: string;
  registrations: number;
  revenue: number;
  rating: number;
  completionRate: number;
}

const columns: ColumnDef<TournamentRow, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Tournament',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  { accessorKey: 'instructor', header: 'Organizer' },
  {
    accessorKey: 'registrations',
    header: () => <span className="text-right block">Registrations</span>,
    cell: ({ row }) => <span className="text-right block">{row.original.registrations}</span>,
  },
  {
    accessorKey: 'revenue',
    header: () => <span className="text-right block">Revenue</span>,
    cell: ({ row }) => (
      <span className="text-right block">INR {row.original.revenue.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'rating',
    header: () => <span className="text-right block">Rating</span>,
    cell: ({ row }) => (
      <span className="text-right block">{row.original.rating.toFixed(1)}</span>
    ),
  },
  {
    accessorKey: 'completionRate',
    header: () => <span className="text-right block">Completion</span>,
    cell: ({ row }) => (
      <span className="text-right block">{formatPercentage(row.original.completionRate)}</span>
    ),
  },
];

export const CourseReportTab = memo(function CourseReportTab({
  filters,
}: CourseReportTabProps) {
  const { data, isLoading, isError } = useReportQuery('course', filters);

  if (isLoading) return <LoadingState message="Loading tournament report..." />;
  if (isError) return <EmptyState title="Error" message="Failed to load tournament report." />;

  const report = data as TournamentReportData | undefined;
  if (!report) return null;

  const summary = report.summary ?? { totalTournaments: 0, totalRegistrations: 0, totalRevenue: 0, completionRate: 0 };
  const topTournaments = report.topTournaments ?? [];
  const tournamentDetails = (report.courseDetails ?? []) as TournamentRow[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportSummaryCard icon="Trophy" title="Total Tournaments" value={summary.totalTournaments} />
        <ReportSummaryCard icon="Users" title="Registrations" value={summary.totalRegistrations.toLocaleString()} />
        <ReportSummaryCard icon="DollarSign" title="Revenue" value={`INR ${summary.totalRevenue.toLocaleString()}`} />
        <ReportSummaryCard icon="BarChart3" title="Completion Rate" value={formatPercentage(summary.completionRate)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Tournaments by Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topTournaments}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip />
              <Bar dataKey="registrations" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <ReportDataTable
        title="Tournament Details"
        columns={columns}
        data={tournamentDetails}
        searchKeys={['name', 'instructor']}
        searchPlaceholder="Search tournaments..."
        emptyMessage="No tournaments found for the selected filters."
      />
    </div>
  );
});
