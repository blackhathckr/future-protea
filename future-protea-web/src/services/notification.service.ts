import api from '@/lib/api'
import type { ApiResponse, PaginationParams, Notification } from '@/types'

class NotificationService {
  static async getNotifications(params?: PaginationParams & { isRead?: boolean }): Promise<ApiResponse<Notification[]>> {
    const response = await api.get('/notifications', { params })
    return response.data
  }

  static async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
  }

  static async markAllAsRead(): Promise<ApiResponse<{ count: number }>> {
    const response = await api.post('/notifications/mark-all-read')
    return response.data
  }

  static async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    const response = await api.get('/notifications/unread-count')
    return response.data
  }

  // Email Templates
  static async getTemplates(params?: PaginationParams): Promise<ApiResponse<EmailTemplate[]>> {
    const response = await api.get('/notifications/templates', { params })
    return response.data
  }

  static async createTemplate(data: { name: string; subject: string; body: string; isActive?: boolean }): Promise<ApiResponse<EmailTemplate>> {
    const response = await api.post('/notifications/templates', data)
    return response.data
  }

  static async updateTemplate(id: string, data: Partial<{ name: string; subject: string; body: string; isActive: boolean }>): Promise<ApiResponse<EmailTemplate>> {
    const response = await api.patch(`/notifications/templates/${id}`, data)
    return response.data
  }

  static async deleteTemplate(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/notifications/templates/${id}`)
    return response.data
  }
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default NotificationService
export { NotificationService }
