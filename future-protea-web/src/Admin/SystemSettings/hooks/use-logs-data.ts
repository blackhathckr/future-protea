import { useQuery } from '@tanstack/react-query';
import { SystemAdminService } from '@/services/admin';
import type { LogsQueryParams, SystemLog, AdminLog, UserLog, LogLevel } from '../data/types';

/**
 * Backend AuditLog shape:
 *   { id, userId, action, target, targetId, details, ipAddress, userAgent, riskLevel, createdAt,
 *     user?: { id, firstName, lastName, email, role } }
 *
 * We transform to the frontend log types below.
 */

const riskToLevel: Record<string, string> = {
  low: 'INFO',
  medium: 'WARN',
  high: 'ERROR',
  critical: 'ERROR',
};

interface AuditLogRaw {
  id: string;
  createdAt: string;
  riskLevel?: string;
  target?: string;
  action?: string;
  details?: Record<string, unknown>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  targetId?: string;
  user?: { id: string; firstName?: string; lastName?: string; email?: string; role?: string };
}

function toSystemLog(raw: AuditLogRaw): SystemLog {
  return {
    id: raw.id,
    timestamp: raw.createdAt,
    level: (riskToLevel[raw.riskLevel ?? ''] ?? 'INFO') as LogLevel,
    service: raw.target ?? 'system',
    message: raw.action ?? '',
    metadata: raw.details ?? undefined,
  };
}

function toAdminLog(raw: AuditLogRaw): AdminLog {
  const u = raw.user;
  return {
    id: raw.id,
    adminName: u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : raw.userId ?? 'Unknown',
    adminEmail: u?.email ?? '',
    action: raw.action ?? '',
    resource: raw.target ?? '',
    resourceId: raw.targetId ?? '',
    ipAddress: raw.ipAddress ?? '',
    timestamp: raw.createdAt,
    metadata: raw.details ?? undefined,
  };
}

function toUserLog(raw: AuditLogRaw): UserLog {
  const u = raw.user;
  return {
    id: raw.id,
    userName: u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : raw.userId ?? 'Unknown',
    userEmail: u?.email ?? '',
    action: raw.action ?? '',
    ipAddress: raw.ipAddress ?? '',
    userAgent: raw.userAgent ?? '',
    timestamp: raw.createdAt,
    metadata: raw.details ?? undefined,
  };
}

/**
 * Fetches the list of available audit modules for the filter dropdown.
 */
export function useModulesQuery() {
  return useQuery({
    queryKey: ['admin', 'system', 'audit-modules'],
    queryFn: async () => {
      const response = await SystemAdminService.getModules();
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 5 * 60 * 1000, // modules rarely change, cache for 5 min
  });
}

/**
 * Fetches audit logs and transforms to SystemLog shape.
 */
export function useSystemLogsQuery(params: LogsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'system', 'logs', 'system', params],
    queryFn: async () => {
      const response = await SystemAdminService.getSystemLogs(params);
      const raw = Array.isArray(response.data) ? response.data : [];
      return {
        logs: raw.map(toSystemLog),
        meta: response.meta,
      };
    },
  });
}

/**
 * Fetches audit logs and transforms to AdminLog shape.
 */
export function useAdminLogsQuery(params: LogsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'system', 'logs', 'admin', params],
    queryFn: async () => {
      const response = await SystemAdminService.getAdminAuditLogs(params);
      const raw = Array.isArray(response.data) ? response.data : [];
      return {
        logs: raw.map(toAdminLog),
        meta: response.meta,
      };
    },
  });
}

/**
 * Fetches audit logs and transforms to UserLog shape.
 */
export function useUserLogsQuery(params: LogsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin', 'system', 'logs', 'user', params],
    queryFn: async () => {
      const response = await SystemAdminService.getUserActivityLogs(params);
      const raw = Array.isArray(response.data) ? response.data : [];
      return {
        logs: raw.map(toUserLog),
        meta: response.meta,
      };
    },
  });
}
