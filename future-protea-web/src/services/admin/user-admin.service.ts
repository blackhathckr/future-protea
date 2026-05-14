import api from '@/lib/api'
import type { ApiResponse } from '@/types'
import type { User } from '@/types/auth.types'
import type {
  AdminUserFilters,
  CreateUserRequest,
  BulkUploadResult,
  BulkDeleteResult,
  RoleWithPermissions,
  Permission,
  AdminAuditLog,
  UserActivityLog,
} from '@/types/admin.types'

/**
 * User Admin Service
 *
 * Gateway: /api/users → user-service
 * Full CRUD for users, roles, permissions, and audit logs.
 */
class UserAdminService {
  // ── Users ──────────────────────────────────────────────

  /** GET /users — List all users with filters */
  static async listUsers(params?: AdminUserFilters): Promise<ApiResponse<User[]>> {
    const response = await api.get('/users', { params })
    return response.data
  }

  /** GET /users/:id — Get single user */
  static async getUser(id: string): Promise<ApiResponse<User>> {
    const response = await api.get(`/users/${id}`)
    return response.data
  }

  /** POST /users — Create a new user */
  static async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    const response = await api.post('/users', data)
    return response.data
  }

  /** PATCH /users/:id — Update user */
  static async updateUser(id: string, data: Partial<CreateUserRequest>): Promise<ApiResponse<User>> {
    const response = await api.patch(`/users/${id}`, data)
    return response.data
  }

  /** DELETE /users/:id — Delete user */
  static async deleteUser(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/users/${id}`)
    return response.data
  }

  /** POST /users/bulk — Bulk upload users */
  static async bulkUploadUsers(data: { users: CreateUserRequest[] }): Promise<ApiResponse<BulkUploadResult>> {
    const response = await api.post('/users/bulk', data)
    return response.data
  }

  /** POST /users/bulk-delete — Bulk delete users (dry run or execute) */
  static async bulkDeleteUsers(data: { identifiers: string[]; reason: string; dryRun?: boolean }): Promise<ApiResponse<BulkDeleteResult>> {
    const response = await api.post('/users/bulk-delete', data)
    return response.data
  }

  // ── Roles ──────────────────────────────────────────────

  /** GET /users/roles — List all roles */
  static async listRoles(): Promise<ApiResponse<RoleWithPermissions[]>> {
    const response = await api.get('/users/roles')
    return response.data
  }

  /** GET /users/roles/:id — Get single role */
  static async getRole(id: string): Promise<ApiResponse<RoleWithPermissions>> {
    const response = await api.get(`/users/roles/${id}`)
    return response.data
  }

  /** POST /users/roles — Create a new role */
  static async createRole(data: { name: string; description?: string; maxUsers?: number; permissions?: string[] }): Promise<ApiResponse<RoleWithPermissions>> {
    const response = await api.post('/users/roles', data)
    return response.data
  }

  /** PATCH /users/roles/:id — Update role */
  static async updateRole(id: string, data: { description?: string; maxUsers?: number | null; permissions?: string[] }): Promise<ApiResponse<RoleWithPermissions>> {
    const response = await api.patch(`/users/roles/${id}`, data)
    return response.data
  }

  /** DELETE /users/roles/:id — Delete role */
  static async deleteRole(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/users/roles/${id}`)
    return response.data
  }

  // ── Permissions ────────────────────────────────────────

  /** GET /users/permissions — List all permissions */
  static async listPermissions(): Promise<ApiResponse<Permission[]>> {
    const response = await api.get('/users/permissions', { params: { limit: 100 } })
    return response.data
  }

  /** POST /users/permissions — Create a new permission */
  static async createPermission(data: { name: string; resource: string; action: string; description?: string }): Promise<ApiResponse<Permission>> {
    const response = await api.post('/users/permissions', data)
    return response.data
  }

  /** PATCH /users/:userId — Assign a role to a user by updating their role field */
  static async assignRoleToUser(userId: string, roleId: string): Promise<ApiResponse<void>> {
    const response = await api.patch(`/users/${userId}`, { roleId })
    return response.data
  }

  // ── Audit Logs ─────────────────────────────────────────

  /** GET /users/audit-logs — Get admin audit logs */
  static async getAuditLogs(params?: { page?: number; limit?: number; action?: string; search?: string }): Promise<ApiResponse<AdminAuditLog[]>> {
    const response = await api.get('/users/audit-logs', { params })
    return response.data
  }

  /** GET /users/audit-logs — Get user activity logs (filtered from same audit log table) */
  static async getUserActivityLogs(params?: { page?: number; limit?: number; userId?: string }): Promise<ApiResponse<UserActivityLog[]>> {
    const response = await api.get('/users/audit-logs', { params })
    return response.data
  }
}

export default UserAdminService
export { UserAdminService }
