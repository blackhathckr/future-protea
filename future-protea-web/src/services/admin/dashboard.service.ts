import api from '@/lib/api'
import type { ApiResponse } from '@/types'
import type { AdminDashboardData } from '@/types/admin.types'

/**
 * Dashboard Admin Service
 *
 * Gateway: /api/users → user-service
 * Provides admin dashboard KPIs, system health, and recent activity.
 */
class DashboardAdminService {
  /** GET /users/dashboard/admin — KPIs, user stats, recent activity */
  static async getDashboardStats(): Promise<ApiResponse<any>> {
    const response = await api.get('/users/dashboard/admin')
    return response.data
  }

  /** Aggregated health check — pings each service's /health endpoint directly */
  static async getSystemHealth(): Promise<any> {
    const services = ['auth', 'users', 'matches', 'players', 'teams', 'tournaments', 'notifications']
    const results = await Promise.allSettled(
      services.map(async (name) => {
        const start = Date.now()
        try {
          await api.get(`/${name}/health`, { timeout: 3000 })
          return { name, status: 'healthy', responseTime: Date.now() - start }
        } catch {
          return { name, status: 'unhealthy', responseTime: Date.now() - start }
        }
      })
    )
    const serviceResults = results.map((r) => r.status === 'fulfilled' ? r.value : { name: 'unknown', status: 'unhealthy', responseTime: 0 })
    const allHealthy = serviceResults.every((s) => s.status === 'healthy')
    return { status: allHealthy ? 'healthy' : 'degraded', services: serviceResults }
  }
}

export default DashboardAdminService
export { DashboardAdminService }
