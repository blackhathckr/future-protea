import { z } from 'zod';

// ── Animation Variants ──────────────────────────────────────────────────────
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
} as const;

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
} as const;

// ── Log Level ────────────────────────────────────────────────────────────────
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

// ── Maintenance Status ───────────────────────────────────────────────────────
export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// ── Service Health ───────────────────────────────────────────────────────────
export type ServiceStatus = 'healthy' | 'degraded' | 'down';

// ── Monitoring Data ──────────────────────────────────────────────────────────
export interface MonitoringData {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  services: ServiceHealthEntry[];
}

export interface ServiceHealthEntry {
  id: string;
  name: string;
  status: ServiceStatus;
  uptime: number;
  responseTime: number;
  lastChecked: string;
}

// ── Maintenance ──────────────────────────────────────────────────────────────
export interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  estimatedDuration: number;
  status: MaintenanceStatus;
  createdBy: string;
  createdAt: string;
}

export const createMaintenanceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().default(''),
  scheduledAt: z.string().min(1, 'Scheduled date/time is required'),
  estimatedDuration: z.coerce.number().min(0.5, 'Minimum 0.5 hours').max(48, 'Maximum 48 hours'),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
});

export type CreateMaintenanceValues = z.infer<typeof createMaintenanceSchema>;

// ── System Log ───────────────────────────────────────────────────────────────
export interface SystemLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
}

// ── Admin Log ────────────────────────────────────────────────────────────────
export interface AdminLog {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ── User Log ─────────────────────────────────────────────────────────────────
export interface UserLog {
  id: string;
  userName: string;
  userEmail: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ── Query Params ─────────────────────────────────────────────────────────────
export interface LogsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: LogLevel;
  module?: string;
  dateFrom?: string;
  dateTo?: string;
}
