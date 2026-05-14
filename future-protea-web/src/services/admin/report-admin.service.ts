import api from '@/lib/api'

/**
 * Report Admin Service
 *
 * Routes (via K8s ingress, service prefix stripped):
 * - /courses/reports       → course-service /reports
 * - /users/reports         → user-service /reports
 * - /payments/reports/revenue → payment-service /reports/revenue
 * - /payments/reports/subscriptions → payment-service /reports/subscriptions
 * - /sessions/reports      → session-service /reports
 * - /users/reports/learners → user-service /reports/learners
 * - /users/audit-logs      → user-service /audit-logs
 */
class ReportAdminService {
  /** GET /reports/courses — Tournament analytics */
  static async getTournamentReport(params?: { startDate?: string; endDate?: string; category?: string; status?: string }) {
    const response = await api.get('/courses/reports', {
      params: params ? { dateFrom: params.startDate, dateTo: params.endDate, category: params.category, status: params.status } : undefined,
    })
    return response.data
  }

  /** GET /reports/users — User analytics */
  static async getUserReport(params?: { startDate?: string; endDate?: string }) {
    const response = await api.get('/users/reports', {
      params: params ? { dateFrom: params.startDate, dateTo: params.endDate } : undefined,
    })
    return response.data
  }

  /** GET /reports/revenue — Revenue analytics */
  static async getRevenueReport(params?: { startDate?: string; endDate?: string }) {
    const response = await api.get('/payments/reports/revenue', {
      params: params ? { dateFrom: params.startDate, dateTo: params.endDate } : undefined,
    })
    return response.data
  }

  /** GET /reports/sessions — Session analytics */
  static async getSessionReport(params?: { startDate?: string; endDate?: string; search?: string }) {
    const response = await api.get('/sessions/reports', {
      params: params ? { dateFrom: params.startDate, dateTo: params.endDate, search: params.search } : undefined,
    })
    return response.data
  }

  /** GET /reports/learners — Player analytics */
  static async getPlayerReport(params?: { startDate?: string; endDate?: string; status?: string }) {
    const response = await api.get('/users/reports/learners', {
      params: params ? { dateFrom: params.startDate, dateTo: params.endDate, status: params.status } : undefined,
    })
    return response.data
  }

  /** GET /reports/subscriptions — Subscription analytics */
  static async getSubscriptionReport(params?: { status?: string }) {
    const response = await api.get('/payments/reports/subscriptions', {
      params: params?.status ? { status: params.status } : undefined,
    })
    return response.data
  }

  /** Aggregated system health — delegated to user-service backend to avoid browser→service direct calls */
  static async getSystemReport() {
    const response = await api.get('/users/services/health')
    return response.data
  }

  /** GET /users/audit-logs — Admin activity report (all non-learner/educator roles) */
  static async getAdminActivityReport(params?: { startDate?: string; endDate?: string }) {
    const response = await api.get('/users/audit-logs', {
      params: {
        ...(params ? { dateFrom: params.startDate, dateTo: params.endDate } : {}),
        excludeRoles: 'LEARNER,EDUCATOR',
      },
    })
    return response.data
  }
}

export default ReportAdminService
export { ReportAdminService }
