import api from '@/lib/api'
import type { ApiResponse, PaginationParams, User } from '@/types'

/**
 * User Service
 *
 * Gateway: /api/users → user-service (strips /api/users)
 * Primary routes at /, sub-resources at /roles, /permissions, etc.
 */
class UserService {
  static async getProfile(): Promise<ApiResponse<User>> {
    // Use auth service /me endpoint — user-service doesn't have /me
    const response = await api.get('/auth/me')
    return response.data
  }

  static async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.patch('/users/profile', data)
    return response.data
  }

  static async getEducators(params?: PaginationParams): Promise<ApiResponse<User[]>> {
    const response = await api.get('/users/educators', { params })
    return response.data
  }

  static async getUser(id: string): Promise<ApiResponse<User>> {
    const response = await api.get(`/users/${id}`)
    return response.data
  }
}

export default UserService
export { UserService }
