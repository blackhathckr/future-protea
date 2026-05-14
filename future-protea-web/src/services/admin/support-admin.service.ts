import api from '@/lib/api'
import type { ApiResponse, PaginationParams } from '@/types'
import type { SupportTicket, SupportTicketDetail, TicketAssignment, TicketEscalation } from '@/types/admin.types'

/**
 * Support Admin Service
 *
 * Gateway: /api/users → user-service (support-tickets sub-resource)
 * Manages support tickets: listing, assignment, escalation.
 */
class SupportAdminService {
  /** GET /users/support-tickets — List all tickets with filters */
  static async listTickets(params?: PaginationParams & { status?: string; priority?: string }): Promise<ApiResponse<SupportTicket[]>> {
    const response = await api.get('/users/support-tickets', { params })
    return response.data
  }

  /** GET /users/support-tickets/:id — Get single ticket with responses */
  static async getTicket(id: string): Promise<ApiResponse<SupportTicketDetail>> {
    const response = await api.get(`/users/support-tickets/${id}`)
    return response.data
  }

  /** PUT /users/support-tickets/:id — Update ticket */
  static async updateTicket(id: string, data: Partial<SupportTicket>): Promise<ApiResponse<SupportTicket>> {
    const response = await api.put(`/users/support-tickets/${id}`, data)
    return response.data
  }

  /** PUT /users/support-tickets/:id — Assign ticket to admin (via update) */
  static async assignTicket(id: string, data: TicketAssignment): Promise<ApiResponse<SupportTicket>> {
    const response = await api.put(`/users/support-tickets/${id}`, {
      assignedTo: data.adminId,
    })
    return response.data
  }

  /** PUT /users/support-tickets/:id/escalate — Escalate ticket */
  static async escalateTicket(id: string, data: TicketEscalation): Promise<ApiResponse<SupportTicket>> {
    const response = await api.put(`/users/support-tickets/${id}/escalate`, data)
    return response.data
  }

  /** GET /users/support-tickets?escalated=true — List escalated (HIGH/URGENT) tickets */
  static async listEscalatedTickets(params?: PaginationParams): Promise<ApiResponse<SupportTicket[]>> {
    const response = await api.get('/users/support-tickets', { params: { ...params, escalated: 'true' } })
    return response.data
  }

  /** POST /users/support-tickets/:id/responses — Add response to ticket */
  static async addResponse(id: string, data: { message: string; isInternal?: boolean }): Promise<ApiResponse<unknown>> {
    const response = await api.post(`/users/support-tickets/${id}/responses`, data)
    return response.data
  }

  /** PUT /users/support-tickets/:id/resolve — Resolve ticket */
  static async resolveTicket(id: string): Promise<ApiResponse<SupportTicket>> {
    const response = await api.put(`/users/support-tickets/${id}/resolve`)
    return response.data
  }
}

export default SupportAdminService
export { SupportAdminService }
