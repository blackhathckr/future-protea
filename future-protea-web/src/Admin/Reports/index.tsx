import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';

import type { ReportFilters as ReportFiltersType, ReportType } from './data/types';
import {
  ReportFilters,
  ReportExportButton,
  CourseReportTab,
  UserReportTab,
  AdminReportTab,
  LearnerReportTab,
  RevenueReportTab,
  SessionReportTab,
  SubscriptionReportTab,
  SystemReportTab,
} from './components';

const defaultFilters: ReportFiltersType = { dateFrom: '', dateTo: '' };

const reportDescriptions: Record<ReportType, { title: string; description: string; icon: string }> = {
  course: { title: 'Tournament Reports', description: 'Comprehensive tournament performance and statistics', icon: '🏆' },
  user: { title: 'Player Reports', description: 'Individual player performance metrics and records', icon: '👤' },
  learner: { title: 'Team Reports', description: 'Team-wise performance and match statistics', icon: '👥' },
  revenue: { title: 'Match Revenue', description: 'Revenue analytics from matches and tournaments', icon: '💰' },
  subscription: { title: 'Subscription Analytics', description: 'Premium subscription and membership data', icon: '📊' },
  session: { title: 'Session Reports', description: 'Live session and broadcast analytics', icon: '📡' },
  admin: { title: 'Admin Reports', description: 'Administrative actions and system logs', icon: '⚙️' },
  system: { title: 'System Reports', description: 'System health and performance metrics', icon: '🔧' },
};

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('course');
  const [filters, setFilters] = useState<ReportFiltersType>(defaultFilters);

  const handleExport = useCallback(
    async () => {
      try {
        let exportUrl: string;
        
        switch (activeTab) {
          case 'course':
            exportUrl = '/courses/reports/export';
            break;
          case 'user':
            exportUrl = '/users/reports/export';
            break;
          case 'learner':
            exportUrl = '/users/reports/learners/export';
            break;
          case 'revenue':
            exportUrl = '/payments/reports/revenue/export';
            break;
          case 'subscription':
            exportUrl = '/payments/reports/subscriptions/export';
            break;
          case 'session':
            exportUrl = '/sessions/reports/export';
            break;
          case 'admin':
          case 'system':
            toast.error(`Export not available for ${activeTab} reports`);
            return;
          default:
            toast.error('Unknown report type');
            return;
        }

        const response = await api.get(exportUrl, {
          params: filters,
          responseType: 'blob',
        });

        const dateStamp = format(new Date(), 'yyyy-MM-dd');
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeTab}_report_${dateStamp}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success('Report exported successfully');
      } catch (error) {
        console.error('Export failed:', error);
        toast.error('Failed to export report');
      }
    },
    [activeTab, filters]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-4 sm:p-6"
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Cricket Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Comprehensive match, player, and tournament performance reports</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:justify-between sm:gap-0">
        <div className="col-span-2 sm:col-span-1">
          <p className="text-sm text-muted-foreground">
            {reportDescriptions[activeTab]?.icon} {reportDescriptions[activeTab]?.description}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1 sm:flex sm:justify-end">
          <ReportExportButton onExport={handleExport} />
        </div>
      </div>

      <ReportFilters filters={filters} onChange={setFilters} />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ReportType)}
        className="space-y-4"
      >
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="course">Tournaments</TabsTrigger>
            <TabsTrigger value="user">Users</TabsTrigger>
            <TabsTrigger value="admin">Admins</TabsTrigger>
            <TabsTrigger value="learner">Players</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="session">Live Matches</TabsTrigger>
            <TabsTrigger value="subscription">Memberships</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="course">
          <CourseReportTab filters={filters} />
        </TabsContent>

        <TabsContent value="user">
          <UserReportTab filters={filters} />
        </TabsContent>

        <TabsContent value="admin">
          <AdminReportTab filters={filters} />
        </TabsContent>

        <TabsContent value="learner">
          <LearnerReportTab filters={filters} />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueReportTab filters={filters} />
        </TabsContent>

        <TabsContent value="session">
          <SessionReportTab filters={filters} />
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionReportTab filters={filters} />
        </TabsContent>

        <TabsContent value="system">
          <SystemReportTab filters={filters} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
