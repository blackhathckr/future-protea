/**
 * @fileoverview Cricket-admin types that align with the new backend responses
 * (single `name`, `role` string, `approved` boolean). Kept separate from the
 * legacy `admin.types.ts` shapes which are still referenced by older pages.
 */

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  phone?: string | null
  photo_url?: string | null
  approved: boolean
  created_at: string
  last_login?: string | null
  user_roles?: Array<{ role: string; granted_at: string }>
}

export interface CreateAdminUserRequest {
  name: string
  email: string
  password: string
  role?: string
  phone?: string
  approved?: boolean
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string | null
}

export interface RoleConfig {
  id: string
  name: string
  description?: string | null
  max_users?: number | null
  is_system: boolean
  created_at: string
  permissions: Permission[]
  user_count: number
  users?: Array<Pick<AdminUser, 'id' | 'name' | 'email' | 'role' | 'approved'>>
}

export interface Announcement {
  id: string
  title: string
  content: string
  target_roles: string[]
  is_active: boolean
  published_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  created_by_id?: string | null
}

export interface NotificationItem {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  category?: string | null
  link?: string | null
  metadata?: Record<string, any> | null
  is_read: boolean
  read_at?: string | null
  created_at: string
}

export interface SupportTicket {
  id: string
  subject: string
  description: string
  category?: string | null
  status: string
  priority: string
  reporter_id?: string | null
  reporter_email?: string | null
  assigned_to_id?: string | null
  escalated: boolean
  escalation_reason?: string | null
  resolved_at?: string | null
  created_at: string
  updated_at: string
  responses?: TicketResponse[]
}

export interface TicketResponse {
  id: string
  ticket_id: string
  author_id?: string | null
  author_name?: string | null
  message: string
  is_internal: boolean
  created_at: string
}

export interface MaintenanceWindow {
  id: string
  title: string
  description?: string | null
  starts_at: string
  ends_at: string
  status: string
  affects_services: string[]
  created_at: string
}

export interface SystemSetting {
  id: string
  key: string
  value: string
  description?: string | null
  category?: string | null
  updated_at: string
  updated_by?: string | null
}

export interface AuditLogEntry {
  id: string
  actor_user_id?: string | null
  action: string
  entity_type: string
  entity_id: string
  before?: any
  after?: any
  ip_address?: string | null
  created_at: string
  actor?: { id: string; name: string; email: string; role: string } | null
}

export interface AnalyticsOverview {
  matches: { total: number; live: number; upcoming: number; completed: number }
  teams: { total: number }
  tournaments: { total: number; active: number }
  users: { total: number; players: number; approved_players: number }
  activity: {
    total_balls: number
    total_runs: number
    total_wickets: number
    avg_runs_per_match: number
    avg_wickets_per_match: number
  }
}

export interface MatchesTrendPoint {
  date: string
  total: number
  live: number
  completed: number
  upcoming: number
}

export interface RoleDistribution {
  role: string
  count: number
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  meta?: { page: number; limit: number; total: number; total_pages?: number }
  error?: { code: string; message: string }
}
