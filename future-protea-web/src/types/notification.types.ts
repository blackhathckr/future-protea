export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH'

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  channel: NotificationChannel
  isRead: boolean
  readAt: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}
