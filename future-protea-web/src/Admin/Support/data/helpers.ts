/**
 * @fileoverview Support helper functions
 * @module Admin/Support/data/helpers
 */

import type { TicketPriority, TicketStatus, TicketCategory } from './types';

/**
 * Returns badge configuration for ticket priority
 */
export function getPriorityBadge(priority: TicketPriority | string): {
  label: string;
  className: string;
} {
  switch (priority) {
    case 'LOW':
      return {
        label: 'Low',
        className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
      };
    case 'MEDIUM':
      return {
        label: 'Medium',
        className: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
      };
    case 'HIGH':
      return {
        label: 'High',
        className: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300',
      };
    case 'URGENT':
      return {
        label: 'Urgent',
        className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
      };
    default:
      return { label: priority, className: '' };
  }
}

/**
 * Returns badge configuration for ticket status
 */
export function getTicketStatusBadge(status: TicketStatus | string): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'OPEN':
      return {
        label: 'Open',
        className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        className: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
      };
    case 'RESOLVED':
      return {
        label: 'Resolved',
        className: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
      };
    case 'CLOSED':
      return {
        label: 'Closed',
        className: 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300',
      };
    case 'ESCALATED':
      return {
        label: 'Escalated',
        className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
      };
    default:
      return { label: status, className: '' };
  }
}

/**
 * Returns a human-readable label for ticket category
 */
export function getCategoryLabel(category: TicketCategory | string): string {
  switch (category) {
    case 'TECHNICAL':
    case 'TECHNICAL_ISSUES':
      return 'Technical';
    case 'BILLING':
    case 'FINANCE_BILLING':
      return 'Payment';
    case 'COURSE':
    case 'COURSE_CONTENT':
      return 'Tournament';
    case 'ACCOUNT':
    case 'ACCOUNT_MANAGEMENT':
      return 'Account';
    case 'LIVE_SESSIONS':
      return 'Live Sessions';
    case 'OTHER':
    case 'OTHERS':
      return 'Other';
    default:
      return category ? category.replace(/_/g, ' ') : 'N/A';
  }
}

/**
 * Returns a category badge with styling
 */
export function getCategoryBadge(category: TicketCategory | string): {
  label: string;
  className: string;
} {
  const label = getCategoryLabel(category);
  switch (category) {
    case 'TECHNICAL':
    case 'TECHNICAL_ISSUES':
      return {
        label,
        className: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
      };
    case 'BILLING':
    case 'FINANCE_BILLING':
      return {
        label,
        className: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
      };
    case 'COURSE':
    case 'COURSE_CONTENT':
      return {
        label,
        className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
      };
    case 'ACCOUNT':
    case 'ACCOUNT_MANAGEMENT':
      return {
        label,
        className: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300',
      };
    case 'LIVE_SESSIONS':
      return {
        label,
        className: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      };
    default:
      return {
        label,
        className: 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300',
      };
  }
}

/**
 * Formats a timestamp into a relative "time ago" string
 */
export function formatTimeAgo(isoString: string): string {
  try {
    const now = new Date();
    const date = new Date(isoString);
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Formats an ISO date string into a localized date-time string
 */
export function formatDateTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}
