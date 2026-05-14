// ── Animation Variants ──────────────────────────────────────────────────────
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
} as const;

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
} as const;

// ── Report Types ─────────────────────────────────────────────────────────────
export type ReportType =
  | 'course'
  | 'user'
  | 'admin'
  | 'learner'
  | 'revenue'
  | 'session'
  | 'subscription'
  | 'system';

export type ExportFormat = 'pdf' | 'excel';

// ── Filters ──────────────────────────────────────────────────────────────────
export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  category?: string;
  status?: string;
  search?: string;
}

// ── Summary Card ─────────────────────────────────────────────────────────────
export interface ReportSummaryItem {
  id: string;
  title: string;
  value: string | number;
  changePercent?: number;
  icon: string;
}

// ── Course Report ────────────────────────────────────────────────────────────
export interface CourseReportData {
  summary: {
    totalCourses: number;
    totalEnrollments: number;
    totalRevenue: number;
    completionRate: number;
  };
  topCourses: Array<{
    name: string;
    enrollments: number;
    revenue: number;
    completionRate: number;
  }>;
  courseDetails: Array<{
    id: string;
    name: string;
    instructor: string;
    enrollments: number;
    revenue: number;
    rating: number;
    completionRate: number;
  }>;
}

// ── User Report ──────────────────────────────────────────────────────────────
export interface UserReportData {
  summary: {
    totalUsers: number;
    activeUsers: number;
    newThisMonth: number;
  };
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
  userDetails: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    joinedAt: string;
    lastActive: string;
  }>;
}

// ── Admin Report ─────────────────────────────────────────────────────────────
export interface AdminReportData {
  summary: {
    totalActions: number;
    mostActiveAdmin: string;
  };
  activities: Array<{
    id: string;
    adminName: string;
    action: string;
    resource: string;
    timestamp: string;
  }>;
}

// ── Revenue Report ───────────────────────────────────────────────────────────
export interface RevenueReportData {
  summary: {
    totalRevenue: number;
    courseSales: number;
    subscriptionRevenue: number;
    refunds: number;
  };
  trend: Array<{
    date: string;
    revenue: number;
    courseSales: number;
    subscriptionRevenue: number;
    sessionRevenue: number;
  }>;
  breakdown: Array<{
    id: string;
    source: string;
    amount: number;
    transactions: number;
    percentage: number;
  }>;
}

// ── Learner Report ───────────────────────────────────────────────────────────
export interface LearnerReportData {
  summary: {
    totalLearners: number;
    activeLearners: number;
    inactiveLearners: number;
    newRegistrations: number;
  };
  learnerDetails: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    lastLogin: string;
    joinedAt: string;
  }>;
}

// ── Session Report ───────────────────────────────────────────────────────────
export interface SessionReportData {
  summary: {
    totalSessions: number;
    completedSessions: number;
    totalAttendees: number;
    avgAttendance: number;
    sessionRevenue: number;
    totalDuration: number;
  };
  sessionsOverTime: Array<{
    date: string;
    count: number;
  }>;
  sessionDetails: Array<{
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
  }>;
}

// ── Subscription Report ──────────────────────────────────────────────────────
export interface SubscriptionReportData {
  summary: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    churnRate: number;
    mrr: number;
  };
  byTier: Array<{
    tier: string;
    count: number;
    revenue: number;
  }>;
  subscriptionDetails: Array<{
    id: string;
    planName: string;
    tier: string;
    subscribers: number;
    revenue: number;
    churnRate: number;
  }>;
}

// ── System Report ────────────────────────────────────────────────────────────
export interface SystemReportData {
  summary: {
    uptimePercent: number;
    avgResponseTime: number;
    errorRate: number;
  };
  performanceOverTime: Array<{
    date: string;
    responseTime: number;
    errorRate: number;
  }>;
  serviceHealth: Array<{
    id: string;
    service: string;
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    responseTime: number;
    lastChecked: string;
  }>;
}

// ── Union type for all report data ───────────────────────────────────────────
export type ReportData =
  | CourseReportData
  | UserReportData
  | AdminReportData
  | LearnerReportData
  | RevenueReportData
  | SessionReportData
  | SubscriptionReportData
  | SystemReportData;
