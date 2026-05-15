/**
 * @fileoverview Admin services wired to the real cricket backend.
 * Exposes UserAdmin, RoleAdmin, AnnouncementAdmin, SupportAdmin,
 * SystemAdmin, AnalyticsAdmin, and NotificationService.
 *
 * All requests return ApiEnvelope<T> = { success, data, meta? }.
 */

import api from '@/lib/api'
import type {
  AdminUser, CreateAdminUserRequest, RoleConfig, Permission, Announcement,
  NotificationItem, SupportTicket, TicketResponse, MaintenanceWindow,
  AuditLogEntry, AnalyticsOverview, MatchesTrendPoint, RoleDistribution,
  ApiEnvelope,
} from '@/types/admin-core.types'

// ─── User Admin ────────────────────────────────────────────────────────────

export class UserAdmin {
  static async list(params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) {
    const r = await api.get<ApiEnvelope<AdminUser[]>>('/users', { params })
    return r.data
  }
  static async get(id: string) {
    const r = await api.get<ApiEnvelope<AdminUser>>(`/users/${id}`)
    return r.data
  }
  static async create(data: CreateAdminUserRequest) {
    const r = await api.post<ApiEnvelope<AdminUser>>('/users', data)
    return r.data
  }
  static async update(id: string, data: Partial<CreateAdminUserRequest> & { roleId?: string; photoUrl?: string }) {
    const r = await api.patch<ApiEnvelope<AdminUser>>(`/users/${id}`, data)
    return r.data
  }
  static async remove(id: string) {
    const r = await api.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(`/users/${id}`)
    return r.data
  }
  static async bulkUpload(users: CreateAdminUserRequest[]) {
    const r = await api.post<ApiEnvelope<{ created: number; skipped: number; total: number; errors: Array<{ email: string; reason: string }> }>>('/users/bulk', { users })
    return r.data
  }
  static async bulkDelete(identifiers: string[], reason: string, dryRun = false) {
    const r = await api.post<ApiEnvelope<{ matched: number; deleted: number; users: AdminUser[]; dry_run?: boolean }>>('/users/bulk-delete', { identifiers, reason, dryRun })
    return r.data
  }
  static async auditLogs(params?: { page?: number; limit?: number; action?: string; search?: string; userId?: string; module?: string }) {
    const r = await api.get<ApiEnvelope<AuditLogEntry[]>>('/users/audit-logs', { params })
    return r.data
  }
  static async auditModules() {
    const r = await api.get<ApiEnvelope<string[]>>('/users/audit-logs/modules')
    return r.data
  }
}

// ─── Roles & Permissions ───────────────────────────────────────────────────

export class RoleAdmin {
  static async listRoles() {
    const r = await api.get<ApiEnvelope<RoleConfig[]>>('/users/roles')
    return r.data
  }
  static async getRole(id: string) {
    const r = await api.get<ApiEnvelope<RoleConfig>>(`/users/roles/${id}`)
    return r.data
  }
  static async createRole(data: { name: string; description?: string; maxUsers?: number; permissions?: string[] }) {
    const r = await api.post<ApiEnvelope<RoleConfig>>('/users/roles', data)
    return r.data
  }
  static async updateRole(id: string, data: { description?: string; maxUsers?: number | null; permissions?: string[] }) {
    const r = await api.patch<ApiEnvelope<RoleConfig>>(`/users/roles/${id}`, data)
    return r.data
  }
  static async deleteRole(id: string) {
    const r = await api.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(`/users/roles/${id}`)
    return r.data
  }
  static async listPermissions() {
    const r = await api.get<ApiEnvelope<Permission[]>>('/users/permissions')
    return r.data
  }
  static async createPermission(data: { name: string; resource: string; action: string; description?: string }) {
    const r = await api.post<ApiEnvelope<Permission>>('/users/permissions', data)
    return r.data
  }
  static async assignRoleToUser(userId: string, roleId: string) {
    const r = await api.patch<ApiEnvelope<AdminUser>>(`/users/${userId}`, { roleId })
    return r.data
  }
}

// ─── Announcements ─────────────────────────────────────────────────────────

export class AnnouncementAdmin {
  static async list(params?: { page?: number; limit?: number; search?: string; active?: 'true' | 'false' }) {
    const r = await api.get<ApiEnvelope<Announcement[]>>('/users/announcements', { params })
    return r.data
  }
  static async get(id: string) {
    const r = await api.get<ApiEnvelope<Announcement>>(`/users/announcements/${id}`)
    return r.data
  }
  static async create(data: { title: string; content: string; targetRoles: string[]; expiresAt?: string | null }) {
    const r = await api.post<ApiEnvelope<Announcement>>('/users/announcements', data)
    return r.data
  }
  static async update(id: string, data: { title?: string; content?: string; targetRoles?: string[]; expiresAt?: string | null }) {
    const r = await api.put<ApiEnvelope<Announcement>>(`/users/announcements/${id}`, data)
    return r.data
  }
  static async remove(id: string) {
    const r = await api.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(`/users/announcements/${id}`)
    return r.data
  }
  static async publish(id: string) {
    const r = await api.put<ApiEnvelope<Announcement & { recipients_notified?: number }>>(`/users/announcements/${id}/publish`)
    return r.data
  }
  static async unpublish(id: string) {
    const r = await api.put<ApiEnvelope<Announcement>>(`/users/announcements/${id}/unpublish`)
    return r.data
  }
  static async listActiveForMe() {
    const r = await api.get<ApiEnvelope<Announcement[]>>('/users/announcements/active')
    return r.data
  }
}

// ─── Support ───────────────────────────────────────────────────────────────

export class SupportAdmin {
  static async list(params?: { page?: number; limit?: number; status?: string; priority?: string; escalated?: 'true' | 'false'; search?: string }) {
    const r = await api.get<ApiEnvelope<SupportTicket[]>>('/users/support-tickets', { params })
    return r.data
  }
  static async get(id: string) {
    const r = await api.get<ApiEnvelope<SupportTicket>>(`/users/support-tickets/${id}`)
    return r.data
  }
  static async create(data: { subject: string; description: string; category?: string; priority?: string }) {
    const r = await api.post<ApiEnvelope<SupportTicket>>('/users/support-tickets', data)
    return r.data
  }
  static async update(id: string, data: Partial<SupportTicket> & { assignedTo?: string | null }) {
    const r = await api.put<ApiEnvelope<SupportTicket>>(`/users/support-tickets/${id}`, data)
    return r.data
  }
  static async escalate(id: string, reason?: string) {
    const r = await api.put<ApiEnvelope<SupportTicket>>(`/users/support-tickets/${id}/escalate`, { reason })
    return r.data
  }
  static async resolve(id: string) {
    const r = await api.put<ApiEnvelope<SupportTicket>>(`/users/support-tickets/${id}/resolve`)
    return r.data
  }
  static async addResponse(id: string, data: { message: string; isInternal?: boolean }) {
    const r = await api.post<ApiEnvelope<TicketResponse>>(`/users/support-tickets/${id}/responses`, data)
    return r.data
  }
  static async remove(id: string) {
    const r = await api.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(`/users/support-tickets/${id}`)
    return r.data
  }
}

// ─── System Settings ───────────────────────────────────────────────────────

export class SystemAdmin {
  static async monitoring() {
    const r = await api.get<ApiEnvelope<{
      status: string
      uptime_seconds: number
      database: string
      memory: { rss_mb: number; heap_used_mb: number; heap_total_mb: number }
      host: { platform: string; node_version: string; cpu_count: number; load_average: number[] }
      settings: Array<{ key: string; value: string; description?: string | null; category?: string | null }>
    }>>('/users/settings')
    return r.data
  }
  static async updateSetting(key: string, value: string, opts: { description?: string; category?: string } = {}) {
    const r = await api.put<ApiEnvelope<{ key: string; value: string }>>(`/users/settings/${key}`, { value, ...opts })
    return r.data
  }
  static async listMaintenance(params?: { page?: number; limit?: number; status?: string }) {
    const r = await api.get<ApiEnvelope<MaintenanceWindow[]>>('/users/settings/maintenance', { params })
    return r.data
  }
  static async createMaintenance(data: { title: string; description?: string; startsAt: string; endsAt: string; affectsServices?: string[]; status?: string }) {
    const r = await api.post<ApiEnvelope<MaintenanceWindow>>('/users/settings/maintenance', data)
    return r.data
  }
  static async updateMaintenance(id: string, data: Partial<MaintenanceWindow>) {
    const r = await api.put<ApiEnvelope<MaintenanceWindow>>(`/users/settings/maintenance/${id}`, data)
    return r.data
  }
  static async deleteMaintenance(id: string) {
    const r = await api.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(`/users/settings/maintenance/${id}`)
    return r.data
  }
}

// ─── Analytics ─────────────────────────────────────────────────────────────

export class AnalyticsAdmin {
  static async overview() {
    const r = await api.get<ApiEnvelope<AnalyticsOverview>>('/analytics/overview')
    return r.data
  }
  static async matchesTrend(days = 30) {
    const r = await api.get<ApiEnvelope<MatchesTrendPoint[]>>('/analytics/matches-trend', { params: { days } })
    return r.data
  }
  static async topPlayers(limit = 5) {
    const r = await api.get<ApiEnvelope<{ top_run_scorers: Array<any>; top_wicket_takers: Array<any> }>>('/analytics/top-players', { params: { limit } })
    return r.data
  }
  static async roleDistribution() {
    const r = await api.get<ApiEnvelope<RoleDistribution[]>>('/analytics/role-distribution')
    return r.data
  }
  static async recentActivity(limit = 15) {
    const r = await api.get<ApiEnvelope<AuditLogEntry[]>>('/analytics/recent-activity', { params: { limit } })
    return r.data
  }
}

// ─── Notifications (inbox for the signed-in user) ─────────────────────────

export class NotificationService {
  static async list(params?: { page?: number; limit?: number; unread?: 'true' }) {
    const r = await api.get<ApiEnvelope<NotificationItem[]>>('/notifications', { params })
    return r.data
  }
  static async unreadCount() {
    const r = await api.get<{ count: number }>('/notifications/unread-count')
    return r.data
  }
  static async markRead(id: string) {
    const r = await api.post<ApiEnvelope<NotificationItem>>(`/notifications/${id}/read`)
    return r.data
  }
  static async markAllRead() {
    const r = await api.post<ApiEnvelope<{ count: number }>>('/notifications/read-all')
    return r.data
  }
  static async remove(id: string) {
    const r = await api.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(`/notifications/${id}`)
    return r.data
  }
  /** readOnly=true wipes only read notifications; default wipes the whole inbox. */
  static async removeAll(readOnly = false) {
    const r = await api.delete<ApiEnvelope<{ count: number }>>('/notifications', readOnly ? { params: { read: 1 } } : undefined)
    return r.data
  }
  static async broadcast(data: { title: string; message: string; type?: string; category?: string; link?: string; target_roles?: string[]; target_user_ids?: string[] }) {
    const r = await api.post<ApiEnvelope<{ recipients: number }>>('/notifications/broadcast', data)
    return r.data
  }
}
