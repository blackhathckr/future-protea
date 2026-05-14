import { useQuery } from '@tanstack/react-query';
import { ReportAdminService } from '@/services/admin';
import type { ReportType, ReportFilters } from '../data/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Transforms backend responses into shapes the report tabs expect.
 */
async function fetchReport(type: ReportType, filters: ReportFilters) {
  const params = { startDate: filters.dateFrom, endDate: filters.dateTo };

  switch (type) {
    case 'course': {
      const res = await ReportAdminService.getCourseReport({
        ...params,
        category: filters.category,
        status: filters.status,
      });
      const d = res.data ?? res;
      const kpis = d.kpis ?? {};
      const topCourses = (d.topCourses ?? []).map((c: any) => {
        const enrollments = c.enrollmentCount ?? c._count?.enrollments ?? c.enrollments ?? 0;
        return {
          id: c.id,
          name: c.title ?? c.name ?? '',
          instructor: c.educatorName ?? (c.educator
            ? `${c.educator.firstName} ${c.educator.lastName}`
            : ''),
          enrollments,
          revenue: Number(c.revenue ?? 0),
          completionRate: Number(c.completionRate ?? 0),
          rating: Number(c.averageRating ?? 0),
        };
      });
      return {
        summary: {
          totalCourses: kpis.totalCourses ?? 0,
          totalEnrollments: topCourses.reduce((s: number, c: any) => s + c.enrollments, 0),
          totalRevenue: topCourses.reduce((s: number, c: any) => s + c.revenue, 0),
          completionRate: kpis.avgCompletionRate ?? 0,
        },
        topCourses,
        courseDetails: topCourses,
        categories: d.categories ?? [],
        byStatus: kpis.byStatus ?? {},
        byLevel: kpis.byLevel ?? {},
      };
    }

    case 'user': {
      const res = await ReportAdminService.getUserReport(params);
      const d = res.data ?? res;
      const kpis = d.kpis ?? {};
      const byRole = kpis.byRole ?? {};
      const activeByRole = kpis.activeByRole ?? {};
      const usersByRole = Object.entries(byRole).map(([role, count]) => ({
        role,
        count: count as number,
      }));
      // Build the "User Details" table: Role | Total Count | Active Users | Engagement Rate
      const userDetails = Object.entries(byRole).map(([role, total]) => {
        const totalCount = total as number;
        const activeCount = (activeByRole[role] as number) ?? 0;
        const engagementRate = totalCount > 0
          ? Math.round((activeCount / totalCount) * 100)
          : 0;
        return { role, totalCount, activeCount, engagementRate };
      });
      return {
        summary: {
          totalUsers: kpis.totalUsers ?? 0,
          activeUsers: kpis.activeUsers ?? 0,
          newThisMonth: kpis.newUsersThisMonth ?? 0,
          growthRate: kpis.growthRate ?? 0,
        },
        usersByRole,
        growthByMonth: d.growthByMonth ?? [],
        userDetails,
      };
    }

    case 'learner': {
      const res = await ReportAdminService.getLearnerReport({
        ...params,
        status: filters.status,
      });
      const d = res.data ?? res;
      const kpis = d.kpis ?? {};
      const learners = (d.learners ?? []).map((u: any) => ({
        id: u.id,
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
        email: u.email ?? '',
        status: u.status ?? 'UNKNOWN',
        lastLogin: u.lastLoginAt ?? '',
        joinedAt: u.createdAt ?? '',
      }));
      return {
        summary: {
          totalLearners: kpis.totalLearners ?? 0,
          activeLearners: kpis.activeLearners ?? 0,
          inactiveLearners: kpis.inactiveLearners ?? 0,
          newRegistrations: kpis.newRegistrations ?? 0,
        },
        learnerDetails: learners,
      };
    }

    case 'revenue': {
      const res = await ReportAdminService.getRevenueReport(params);
      const d = res.data ?? res;
      const kpis = d.kpis ?? {};
      const monthlyRevenue = (d.monthlyRevenue ?? []).map((m: any) => ({
        date: m.month ?? m.date ?? '',
        revenue: Number(m.revenue ?? 0),
        courseSales: Number(m.courseSales ?? 0),
        subscriptionRevenue: Number(m.subscriptionRevenue ?? 0),
        sessionRevenue: Number(m.sessionRevenue ?? 0),
      }));
      const breakdown = (d.breakdown ?? []).map((b: any, i: number) => ({
        id: b.id ?? String(i + 1),
        source: b.source ?? '',
        amount: Number(b.amount ?? 0),
        transactions: b.transactions ?? b.count ?? 0,
        percentage: Number(b.percentage ?? 0),
      }));

      // Derive summary breakdowns from breakdown data
      const courseSales = breakdown.find((b: any) => b.source === 'Course Sales')?.amount ?? 0;
      const subscriptionRevenue = breakdown.find((b: any) => b.source === 'Subscriptions')?.amount ?? 0;

      return {
        summary: {
          totalRevenue: Number(kpis.totalRevenue ?? 0),
          courseSales,
          subscriptionRevenue,
          refunds: 0,
          totalTransactions: kpis.totalTransactions ?? 0,
        },
        trend: monthlyRevenue,
        breakdown,
      };
    }

    case 'session': {
      const res = await ReportAdminService.getSessionReport({
        ...params,
        search: filters.search,
      });
      const d = res.data ?? res;
      const byStatus = d.byStatus ?? {};
      const sessionDetails = (d.sessionDetails ?? []).map((s: any) => ({
        id: s.id,
        title: s.title ?? '',
        instructor: s.instructor ?? '',
        date: s.date ?? s.scheduledAt ?? '',
        attendees: s.attendees ?? s._count?.participants ?? 0,
        maxParticipants: s.maxParticipants ?? 0,
        duration: s.duration ?? 0,
        rating: s.rating ?? 0,
        revenue: s.revenue ?? 0,
        status: s.status ?? '',
      }));
      return {
        summary: {
          totalSessions: d.totalSessions ?? 0,
          completedSessions: byStatus.COMPLETED ?? 0,
          totalAttendees: d.totalParticipants ?? 0,
          avgAttendance: d.totalSessions > 0
            ? Math.round((d.totalParticipants ?? 0) / d.totalSessions)
            : 0,
          sessionRevenue: sessionDetails.reduce((s: number, sd: any) => s + (sd.revenue ?? 0), 0),
          totalDuration: d.totalDuration ?? 0,
        },
        sessionsOverTime: [],
        sessionDetails,
        byStatus,
      };
    }

    case 'subscription': {
      const res = await ReportAdminService.getSubscriptionReport({
        status: filters.status,
      });
      const d = res.data ?? res;
      const planDetails = (d.planDetails ?? []).map((p: any) => ({
        id: p.id,
        planName: p.planName ?? p.name ?? '',
        tier: p.tier ?? '',
        subscribers: p.subscribers ?? 0,
        revenue: Number(p.revenue ?? 0),
        churnRate: Number(p.churnRate ?? 0),
      }));
      const byTier = planDetails.map((p: any) => ({
        tier: p.planName,
        count: p.subscribers,
        revenue: p.revenue,
      }));
      return {
        summary: {
          totalSubscriptions: d.totalSubscriptions ?? 0,
          activeSubscriptions: d.activeSubscriptions ?? 0,
          churnRate: Number(d.churnRate ?? 0),
          mrr: Number(d.mrr ?? 0),
        },
        byTier,
        subscriptionDetails: planDetails,
      };
    }

    case 'system': {
      const res = await ReportAdminService.getSystemReport();
      const d = res.data ?? res;
      const services: any[] = Array.isArray(d.services) ? d.services : [];
      const serviceHealth = services.map((info: any) => ({
        id: info.name,
        service: info.name,
        status: (info.status ?? 'unknown') as 'healthy' | 'degraded' | 'down',
        uptime: 0,
        responseTime: info.responseTime ?? 0,
        lastChecked: new Date().toISOString(),
      }));
      const healthyCount = serviceHealth.filter((s) => s.status === 'healthy').length;
      return {
        summary: {
          uptimePercent: serviceHealth.length > 0
            ? (healthyCount / serviceHealth.length) * 100
            : 0,
          avgResponseTime: serviceHealth.length > 0
            ? Math.round(serviceHealth.reduce((s, h) => s + h.responseTime, 0) / serviceHealth.length)
            : 0,
          errorRate: serviceHealth.length > 0
            ? ((serviceHealth.length - healthyCount) / serviceHealth.length) * 100
            : 0,
        },
        performanceOverTime: [],
        serviceHealth,
      };
    }

    case 'admin': {
      const res = await ReportAdminService.getAdminActivityReport(params);
      const items = res.data ?? res ?? [];
      const activities = (Array.isArray(items) ? items : []).map((a: any) => ({
        id: a.id ?? '',
        adminName: a.user?.firstName
          ? `${a.user.firstName} ${a.user.lastName}`
          : a.userId ?? 'Unknown',
        action: a.action ?? '',
        resource: a.target ?? '',
        timestamp: a.createdAt ?? a.timestamp ?? '',
      }));
      return {
        summary: {
          totalActions: activities.length,
          mostActiveAdmin: activities[0]?.adminName ?? '-',
        },
        activities,
      };
    }

    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

export function useReportQuery(type: ReportType, filters: ReportFilters) {
  return useQuery({
    queryKey: ['admin', 'reports', type, filters],
    queryFn: () => fetchReport(type, filters),
    enabled: !!type,
  });
}
