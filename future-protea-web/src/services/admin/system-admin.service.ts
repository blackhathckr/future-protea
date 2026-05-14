import api from '@/lib/api'
import type { ApiResponse, PaginationParams } from '@/types'
import type {
  MonitoringData,
  MaintenanceWindow,
  SystemLogEntry,
  AdminAuditLog,
  UserActivityLog,
  SystemSettings,
} from '@/types/admin.types'

/**
 * System Admin Service
 *
 * Gateway: /api/users → user-service (strips /api/users → '')
 * Mount points in user-service:
 *   /settings → system-settings routes
 *   /audit-logs → audit-log routes
 */
class SystemAdminService {
  // ── Monitoring ─────────────────────────────────────────

  /** GET /users/settings — List all settings (used as monitoring data) */
  static async getMonitoring(): Promise<ApiResponse<MonitoringData>> {
    const response = await api.get('/users/settings')
    return response.data
  }

  // ── Maintenance Windows ────────────────────────────────

  /** GET /users/settings/maintenance — List maintenance windows */
  static async listMaintenance(params?: PaginationParams): Promise<ApiResponse<MaintenanceWindow[]>> {
    const response = await api.get('/users/settings/maintenance', { params })
    return response.data
  }

  /** POST /users/settings/maintenance — Create maintenance window */
  static async createMaintenance(data: Omit<MaintenanceWindow, 'id' | 'createdBy' | 'createdAt'> | Record<string, unknown>): Promise<ApiResponse<MaintenanceWindow>> {
    const response = await api.post('/users/settings/maintenance', data)
    return response.data
  }

  /** PUT /users/settings/maintenance/:id — Update maintenance window */
  static async updateMaintenance(id: string, data: Partial<MaintenanceWindow>): Promise<ApiResponse<MaintenanceWindow>> {
    const response = await api.put(`/users/settings/maintenance/${id}`, data)
    return response.data
  }

  /** DELETE /users/settings/maintenance/:id — Delete maintenance window */
  static async deleteMaintenance(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/users/settings/maintenance/${id}`)
    return response.data
  }

  // ── Logs (via audit-logs) ────────────────────────────────

  /** GET /users/audit-logs/modules — Get available module names for filter */
  static async getModules(): Promise<ApiResponse<string[]>> {
    const response = await api.get('/users/audit-logs/modules')
    return response.data
  }

  /** GET /users/audit-logs — Get system/admin logs with filters */
  static async getSystemLogs(params?: PaginationParams & { level?: string; module?: string }): Promise<ApiResponse<SystemLogEntry[]>> {
    const response = await api.get('/users/audit-logs', { params })
    return response.data
  }

  // ── Audit Logs ─────────────────────────────────────────

  /** GET /users/audit-logs — Get admin audit logs (excludes learner/educator roles) */
  static async getAdminAuditLogs(params?: PaginationParams & { action?: string; module?: string }): Promise<ApiResponse<AdminAuditLog[]>> {
    const response = await api.get('/users/audit-logs', { params: { ...params, excludeRoles: 'LEARNER,EDUCATOR' } })
    return response.data
  }

  /** GET /users/audit-logs — Get user activity logs (educator + learner roles only) */
  static async getUserActivityLogs(params?: PaginationParams & { userId?: string; module?: string }): Promise<ApiResponse<UserActivityLog[]>> {
    const response = await api.get('/users/audit-logs', { params: { ...params, roles: 'EDUCATOR,LEARNER' } })
    return response.data
  }

  // ── System Settings ────────────────────────────────────

  /** GET /users/settings — Get all system settings */
  static async getSystemSettings(): Promise<ApiResponse<SystemSettings>> {
    const response = await api.get('/users/settings')
    return response.data
  }

  /** PUT /users/settings/:key — Update a system setting by key */
  static async updateSystemSettings(key: string, data: { value: string }): Promise<ApiResponse<SystemSettings>> {
    const response = await api.put(`/users/settings/${key}`, data)
    return response.data
  }
}

export default SystemAdminService
export { SystemAdminService }
