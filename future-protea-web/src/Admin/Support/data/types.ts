/**
 * @fileoverview Support data types, form schemas, and animation variants
 * @module Admin/Support/data/types
 */

import { z } from 'zod';
import type {
  SupportTicket,
  TicketPriority,
  TicketStatus,
  TicketCategory,
  TicketAssignment,
  TicketEscalation,
} from '@/types/admin.types';
import type { PaginationParams } from '@/types';

// ── Re-exports for convenience ─────────────────────────────
export type {
  SupportTicket,
  TicketPriority,
  TicketStatus,
  TicketCategory,
  TicketAssignment,
  TicketEscalation,
};

// ── Filter types ───────────────────────────────────────────
export interface TicketFilters extends PaginationParams {
  priority?: TicketPriority | '';
  status?: TicketStatus | '';
  category?: TicketCategory | '';
}

export const defaultTicketFilters: TicketFilters = {
  page: 1,
  limit: 10,
  search: '',
  priority: '',
  status: '',
  category: '',
};

// ── Assignment form schema ─────────────────────────────────
export const assignTicketSchema = z.object({
  adminId: z.string().min(1, 'Please select an admin'),
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .or(z.literal('')),
});

export type AssignTicketFormData = z.infer<typeof assignTicketSchema>;

// ── Escalation form schema ─────────────────────────────────
export const escalateTicketSchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason must not exceed 1000 characters'),
  escalateTo: z.string().optional().or(z.literal('')),
});

export type EscalateTicketFormData = z.infer<typeof escalateTicketSchema>;

// ── Timeline entry type ────────────────────────────────────
export interface TicketTimelineEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

// ── Animation Variants ─────────────────────────────────────
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
} as const;

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
} as const;
