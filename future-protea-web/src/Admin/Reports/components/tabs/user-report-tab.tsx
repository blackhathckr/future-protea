import { memo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import { ReportDataTable } from '../report-data-table';
import { useReportQuery } from '../../hooks';
import { ReportSummaryCard } from '../cards';
import {
  getRoleBadgeVariant,
  formatRole,
} from '../../../UserManagement/data/helpers';
import type { ReportFilters, UserReportData } from '../../data/types';
import type { UserRole } from '../../../UserManagement/data/types';

const COLORS = [
  'var(--primary)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

interface UserReportTabProps {
  filters: ReportFilters;
}

interface UserRoleRow {
  role: string;
  totalCount: number;
  activeCount: number;
  engagementRate: number;
}

const columns: ColumnDef<UserRoleRow, unknown>[] = [
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => (
      <Badge variant="outline" className={getRoleBadgeVariant(row.original.role as UserRole)}>
        {formatRole(row.original.role as UserRole)}
      </Badge>
    ),
  },
  {
    accessorKey: 'totalCount',
    header: 'Total Count',
    cell: ({ row }) => <span className="font-medium">{row.original.totalCount.toLocaleString()}</span>,
  },
  {
    accessorKey: 'activeCount',
    header: 'Active Users',
    cell: ({ row }) => row.original.activeCount.toLocaleString(),
  },
  {
    accessorKey: 'engagementRate',
    header: 'Engagement Rate',
    cell: ({ row }) => `${row.original.engagementRate}%`,
  },
];

export const UserReportTab = memo(function UserReportTab({
  filters,
}: UserReportTabProps) {
  const { data, isLoading, isError } = useReportQuery('user', filters);

  if (isLoading) return <LoadingState message="Loading user report..." />;
  if (isError) return <EmptyState title="Error" message="Failed to load user report." />;

  const report = data as (UserReportData & { growthByMonth?: Array<{ month: string; count: number }>; summary: UserReportData['summary'] & { growthRate?: number } }) | undefined;
  if (!report) return null;

  const summary = report.summary ?? { totalUsers: 0, activeUsers: 0, newThisMonth: 0, growthRate: 0 };
  const usersByRole = report.usersByRole ?? [];
  const growthByMonth = report.growthByMonth ?? [];
  const userDetails = (report.userDetails ?? []) as UserRoleRow[];

  const growthDisplay = summary.growthRate === 0 || summary.growthRate === undefined
    ? '-'
    : `${summary.growthRate > 0 ? '+' : ''}${summary.growthRate}%`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportSummaryCard icon="Users" title="Total Users" value={summary.totalUsers.toLocaleString()} />
        <ReportSummaryCard icon="Activity" title="Active Users" value={summary.activeUsers.toLocaleString()} />
        <ReportSummaryCard icon="TrendingUp" title="New This Month" value={summary.newThisMonth} />
        <ReportSummaryCard icon="BarChart3" title="Growth Rate" value={growthDisplay} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={usersByRole}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ role, count }) => `${role}: ${count}`}
                  labelLine={false}
                >
                  {usersByRole.map((_entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {growthByMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No growth data available.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[...growthByMonth].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="New Users" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <ReportDataTable
        title="User Details"
        columns={columns}
        data={userDetails}
        searchKeys={['name', 'email', 'role']}
        searchPlaceholder="Search users..."
        emptyMessage="No user details available."
      />
    </div>
  );
});
