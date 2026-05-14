import type { LogLevel, MaintenanceStatus } from './types';

/**
 * Returns badge styling for a log level.
 */
export function getLogLevelBadge(level: LogLevel): {
  label: string;
  className: string;
} {
  const map: Record<LogLevel, { label: string; className: string }> = {
    INFO: {
      label: 'INFO',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    WARN: {
      label: 'WARN',
      className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    },
    ERROR: {
      label: 'ERROR',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    },
    DEBUG: {
      label: 'DEBUG',
      className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    },
  };
  return map[level] ?? { label: level, className: '' };
}

/**
 * Returns badge styling for a maintenance status.
 */
export function getMaintenanceStatusBadge(status: MaintenanceStatus): {
  label: string;
  className: string;
} {
  const map: Record<MaintenanceStatus, { label: string; className: string }> = {
    SCHEDULED: {
      label: 'Scheduled',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    },
    COMPLETED: {
      label: 'Completed',
      className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    },
    CANCELLED: {
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    },
  };
  return map[status] ?? { label: status, className: '' };
}

/**
 * Formats uptime in seconds to human-readable string.
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Formats bytes to human-readable size string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
