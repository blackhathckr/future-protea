import type { PaginationParams } from './api.types'
import type { Course } from './course.types'
import type { LiveSession } from './session.types'
import type { SubscriptionPlan } from './payment.types'

// ════════════════════════════════════════════════════════════
// Dashboard
// ════════════════════════════════════════════════════════════

export interface AdminKPI {
  label: string
  value: number | string
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: string
}

export interface SystemHealthItem {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  uptime: number
  responseTime: number
}

export interface RecentActivity {
  id: string
  action: string
  user: string
  resource: string
  timestamp: string
}

export interface TopTournamentItem {
  id: string
  title: string
  registrations: number
  revenue: number
  rating: number
}

export interface SLAStatus {
  withinSLA: number
  nearBreach: number
  breached: number
}

export interface RevenueChartPoint {
  date: string
  tournamentRevenue: number
  subscriptions: number
}

export interface AdminDashboardData {
  kpis: AdminKPI[]
  systemHealth: SystemHealthItem[]
  recentActivity: RecentActivity[]
  topTournaments: TopTournamentItem[]
  slaStatus: SLAStatus
  revenueChart: RevenueChartPoint[]
}

// ════════════════════════════════════════════════════════════
// User Management
// ════════════════════════════════════════════════════════════

export interface AdminUserFilters extends PaginationParams {
  role?: string
  status?: string
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  phone?: string
  countryCode?: string
  role: string
  displayName?: string
  bio?: string
  dateOfBirth?: string
  gender?: string
  address?: string
  city?: string
  district?: string
  state?: string
  pincode?: string
  country?: string
}

export interface BulkUploadRow {
  firstName: string
  lastName: string
  email: string
  phone?: string
  countryCode?: string
  role: string
  errors?: string[]
}

export interface BulkUploadResult {
  total: number
  success: number
  failed: number
  errors: BulkUploadRow[]
}

export interface BulkDeleteResult {
  dryRun: boolean
  matchedCount?: number
  deletedCount?: number
  invalidCount: number
  protectedCount: number
  matched?: Array<{ id: string; email?: string | null; firstName: string; lastName: string }>
  deleted?: Array<{ id: string; email?: string | null }>
  invalid: string[]
  protected: Array<{ identifier: string; reason: string }>
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string | null
}

export interface RoleWithPermissions {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: Permission[]
  createdAt: string
}

// ════════════════════════════════════════════════════════════
// Course Admin
// ════════════════════════════════════════════════════════════

export interface AdminCourseFilters extends PaginationParams {
  status?: string
  categoryId?: string
  educatorId?: string
}

export interface TeamApproval {
  id: string
  teamId: string
  teamName: string
  status: string
  submittedAt: string
  reviewedAt: string | null
  reviewerComments: string | null
}

export interface TeamApprovalAction {
  action: 'approve' | 'reject'
  reason?: string
}

// ════════════════════════════════════════════════════════════
// Session Admin
// ════════════════════════════════════════════════════════════

export interface AdminSessionFilters extends PaginationParams {
  status?: string
  type?: string
  educatorId?: string
}

export interface SessionApprovalItem {
  id: string
  sessionId: string
  session: LiveSession
  status: string
  comments?: string | null
  submittedBy?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  submittedAt: string
}

export interface RecordingItem {
  id: string
  sessionId: string
  url: string | null
  duration: number | null
  size: number | null
  status: 'PROCESSING' | 'READY' | 'PUBLISHED' | 'FAILED'
  publishedAt: string | null
  createdAt: string
  session: {
    id: string
    title: string
    hostId: string
    courseId: string | null
    scheduledAt: string
    duration: number
    host: { id: string; firstName: string; lastName: string }
    course: { id: string; title: string } | null
  }
}

export interface AttendanceRecord {
  id: string
  userId: string
  userName: string
  joinedAt: string | null
  leftAt: string | null
  duration: number
}

// ════════════════════════════════════════════════════════════
// Finance
// ════════════════════════════════════════════════════════════

export interface InvoiceItem {
  id: string
  invoiceNumber: string
  userId: string
  userName: string
  userEmail?: string
  amount: number
  tax?: number
  total?: number
  currency: string
  status: string
  courseTitle?: string
  planName?: string
  createdAt: string
}

export interface RefundItem {
  id: string
  paymentId: string
  userId: string
  userName: string
  amount: number
  reason: string
  status: string
  createdAt: string
  paymentCreatedAt?: string
}

export interface RefundAction {
  action: 'approve' | 'reject'
  amount?: number
  notes?: string
  force?: boolean
}

export interface AdminCouponFilters extends PaginationParams {
  isActive?: boolean
}

export interface ReferralCodeItem {
  id: string
  userId: string
  code: string
  rewardType: string
  rewardValue: number
  isActive: boolean
  maxUsage: number | null
  usageCount: number
  expiresAt: string | null
  createdAt: string
  educatorName: string | null
  _count?: { referrals: number }
}

export interface ReferralCodeDetail {
  id: string
  code: string
  userId: string
  educatorName: string | null
  rewardType: string
  rewardValue: number
  isActive: boolean
  maxUsage: number | null
  usageCount: number
  expiresAt: string | null
  linkedCourseIds: string[]
  linkedSessionIds: string[]
  createdAt: string
  totalRevenue: number
  referrals: {
    id: string
    referredUserId: string
    learnerName: string | null
    learnerEmail: string | null
    status: string
    createdAt: string
  }[]
}

// ════════════════════════════════════════════════════════════
// Support
// ════════════════════════════════════════════════════════════

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type TicketCategory = 'TECHNICAL' | 'BILLING' | 'COURSE' | 'ACCOUNT' | 'OTHER' | string

export interface SupportTicket {
  id: string
  ticketNo: string
  subject: string
  description: string
  userId: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string | null
  }
  priority: TicketPriority
  status: TicketStatus
  category: string
  assignedTo: string | null
  createdAt: string
  updatedAt: string
  _count?: { responses: number }
}

export interface TicketResponse {
  id: string
  ticketId: string
  userId: string
  message: string
  isInternal: boolean
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    role?: string
  }
}

export interface SupportTicketDetail extends SupportTicket {
  description: string
  responses: TicketResponse[]
  resolvedAt?: string | null
}

export interface TicketAssignment {
  adminId: string
  notes?: string
}

export interface TicketEscalation {
  priority: TicketPriority
  reason: string
  escalateTo?: string
}

// ════════════════════════════════════════════════════════════
// Subscriptions
// ════════════════════════════════════════════════════════════

export interface PlanFormData {
  name: string
  description: string
  price: number
  currency: string
  duration: number
  tier: string
  features: string[]
  linkedCourseIds?: string[]
  linkedCategoryIds?: string[]
}

export interface PlanApprovalItem {
  id: string
  planId: string
  plan: SubscriptionPlan
  status: string
  submittedAt: string
}

export interface UserSubscriptionAdmin {
  id: string
  userId: string
  userName: string
  userEmail: string
  planId: string
  planName: string
  status: string
  startDate: string
  endDate: string
}

export interface SubscriptionAction {
  action: 'upgrade' | 'downgrade' | 'revoke'
  newPlanId?: string
  reason?: string
}

// ════════════════════════════════════════════════════════════
// Reports
// ════════════════════════════════════════════════════════════

export interface ReportDateRange {
  startDate: string
  endDate: string
}

export type ReportExportFormat = 'pdf' | 'excel'

export interface TournamentReportData {
  totalTournaments: number
  totalRegistrations: number
  totalRevenue: number
  completionRate: number
  topTournaments: TopTournamentItem[]
  registrationTrend: { date: string; count: number }[]
}

export interface UserReportData {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  usersByRole: { role: string; count: number }[]
  registrationTrend: { date: string; count: number }[]
}

export interface RevenueReportData {
  totalRevenue: number
  tournamentRevenue: number
  subscriptionRevenue: number
  refunds: number
  revenueTrend: { date: string; amount: number }[]
}

export interface SessionReportData {
  totalSessions: number
  completedSessions: number
  avgAttendance: number
  avgDuration: number
  sessionTrend: { date: string; count: number }[]
}

export interface SubscriptionReportData {
  totalSubscriptions: number
  activeSubscriptions: number
  churnRate: number
  arpu: number
  subscriptionTrend: { date: string; count: number }[]
}

export interface SystemReportData {
  uptime: number
  avgResponseTime: number
  errorRate: number
  activeConnections: number
  performanceTrend: { date: string; responseTime: number; errorRate: number }[]
}

export interface AdminActivityReportData {
  totalActions: number
  actionsByType: { action: string; count: number }[]
  mostActiveAdmins: { adminId: string; name: string; actions: number }[]
  activityTrend: { date: string; count: number }[]
}

// ════════════════════════════════════════════════════════════
// System Settings
// ════════════════════════════════════════════════════════════

export interface MonitoringData {
  services: SystemHealthItem[]
  metrics: {
    cpu: number
    memory: number
    disk: number
    uptime: number
  }
}

export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface MaintenanceWindow {
  id: string
  title: string
  description: string
  scheduledAt: string
  estimatedDuration: number
  status: MaintenanceStatus
  createdBy: string
  createdAt: string
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

export interface SystemLogEntry {
  id: string
  level: LogLevel
  service: string
  message: string
  metadata?: Record<string, unknown>
  timestamp: string
}

export interface AdminAuditLog {
  id: string
  adminId: string
  adminName: string
  action: string
  resource: string
  resourceId: string | null
  details: Record<string, unknown> | null
  ipAddress: string
  timestamp: string
}

export interface UserActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  ipAddress: string
  userAgent: string
  timestamp: string
}

export interface SystemSettings {
  maintenanceMode: boolean
  maintenanceMessage?: string
  defaultLanguage: string
  maxUploadSize: number
  sessionTimeout: number
}

// ════════════════════════════════════════════════════════════
// Admin Profile
// ════════════════════════════════════════════════════════════

export interface NotificationPreferences {
  email: boolean
  sms: boolean
  inApp: boolean
  pushNotifications: boolean
  systemAlerts: boolean
  securityAlerts: boolean
  weeklyDigest: boolean
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: number
  loginAlerts: boolean
  activeSessions: number
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
