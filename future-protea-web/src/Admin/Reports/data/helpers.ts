import type { ReportType } from './types';

/**
 * Formats a date string for report display.
 */
export function formatReportDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a number as percentage string.
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Returns the Lucide icon name for a given report type.
 */
export function getReportIcon(type: ReportType): string {
  const icons: Record<ReportType, string> = {
    course: 'BookOpen',
    user: 'Users',
    admin: 'Shield',
    revenue: 'DollarSign',
    session: 'Video',
    subscription: 'CreditCard',
    system: 'Server',
  };
  return icons[type] ?? 'FileText';
}
