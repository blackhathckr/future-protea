/**
 * @fileoverview Admin Dashboard page
 * @module Admin/Dashboard
 *
 * @description
 * Main dashboard screen showing KPIs, revenue chart, system health,
 * top courses, and recent admin activity.
 */

import { motion } from 'framer-motion';
import { useDashboardData } from './hooks';
import { LoadingState, EmptyState, KPICards, RevenueChart, SystemHealth, RecentActivity, TopCoursesTable /* SLAMonitor */ } from './components';


export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboardData();

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Failed to load dashboard"
        message="Could not fetch dashboard data. Please try again."
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* KPI Cards */}
      <KPICards kpis={data.kpis} />

      {/* Revenue Chart + System Health */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <RevenueChart data={data.revenueChart} />
        </div>
        {/* <div className="lg:col-span-1">
          <SystemHealth services={data.systemHealth} />
        </div> */}
      </div>

      {/* Top Courses */}
      <TopCoursesTable courses={data.topCourses} />

      {/* SLA Monitoring — hidden until ticket system is ready */}
      {/* <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopCoursesTable courses={data.topCourses} />
        </div>
        <div className="lg:col-span-1">
          <SLAMonitor slaStatus={data.slaStatus} />
        </div>
      </div> */}

      {/* Recent Activity */}
      <RecentActivity activities={data.recentActivity} />
    </motion.div>
  );
}
