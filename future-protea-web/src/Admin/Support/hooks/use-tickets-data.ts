/**
 * @fileoverview Ticket query and mutation hooks
 * @module Admin/Support/hooks/use-tickets-data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SupportAdminService } from '@/services/admin';
import type { PaginationParams } from '@/types';
import type { SupportTicket, AssignTicketFormData, EscalateTicketFormData } from '../data/types';

const TICKET_KEYS = {
  all: ['admin', 'tickets'] as const,
  list: (params?: PaginationParams & { status?: string; priority?: string }) =>
    [...TICKET_KEYS.all, 'list', params] as const,
  escalated: (params?: PaginationParams) =>
    [...TICKET_KEYS.all, 'escalated', params] as const,
  detail: (id: string) => [...TICKET_KEYS.all, 'detail', id] as const,
};

/**
 * Fetches a paginated list of tickets with optional filters
 */
export function useTicketsQuery(filters?: PaginationParams & { status?: string; priority?: string }) {
  return useQuery({
    queryKey: TICKET_KEYS.list(filters),
    queryFn: () => SupportAdminService.listTickets(filters),
    placeholderData: (prev) => prev,
  });
}

/**
 * Fetches only escalated tickets
 */
export function useEscalatedTicketsQuery(params?: PaginationParams) {
  return useQuery({
    queryKey: TICKET_KEYS.escalated(params),
    queryFn: () => SupportAdminService.listEscalatedTickets(params),
    placeholderData: (prev) => prev,
  });
}

/**
 * Updates a ticket (status, notes, etc.)
 */
export function useUpdateTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupportTicket> }) =>
      SupportAdminService.updateTicket(id, data),
    onSuccess: () => {
      toast.success('Ticket updated successfully');
      queryClient.invalidateQueries({ queryKey: TICKET_KEYS.all });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update ticket: ${error.message}`);
    },
  });
}

/**
 * Assigns a ticket to an admin
 */
export function useAssignTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignTicketFormData }) =>
      SupportAdminService.assignTicket(id, {
        adminId: data.adminId,
        notes: data.notes,
      }),
    onSuccess: () => {
      toast.success('Ticket assigned successfully');
      queryClient.invalidateQueries({ queryKey: TICKET_KEYS.all });
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign ticket: ${error.message}`);
    },
  });
}

/**
 * Fetches a single ticket by ID (full detail with description + responses)
 */
export function useTicketDetailQuery(id: string | null) {
  return useQuery({
    queryKey: TICKET_KEYS.detail(id ?? ''),
    queryFn: () => SupportAdminService.getTicket(id!),
    enabled: !!id,
  });
}

/**
 * Escalates a ticket with new priority and reason
 */
export function useEscalateTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EscalateTicketFormData }) =>
      SupportAdminService.escalateTicket(id, {
        priority: data.priority,
        reason: data.reason,
        escalateTo: data.escalateTo || undefined,
      }),
    onSuccess: () => {
      toast.success('Ticket escalated successfully');
      queryClient.invalidateQueries({ queryKey: TICKET_KEYS.all });
    },
    onError: (error: Error) => {
      toast.error(`Failed to escalate ticket: ${error.message}`);
    },
  });
}

/**
 * Adds a response to a ticket
 */
export function useAddResponseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { message: string; isInternal?: boolean } }) =>
      SupportAdminService.addResponse(id, data),
    onSuccess: () => {
      toast.success('Response sent successfully');
      queryClient.invalidateQueries({ queryKey: TICKET_KEYS.all });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send response: ${error.message}`);
    },
  });
}

/**
 * Resolves a ticket
 */
export function useResolveTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => SupportAdminService.resolveTicket(id),
    onSuccess: () => {
      toast.success('Ticket resolved successfully');
      queryClient.invalidateQueries({ queryKey: TICKET_KEYS.all });
    },
    onError: (error: Error) => {
      toast.error(`Failed to resolve ticket: ${error.message}`);
    },
  });
}

/**
 * Closes a ticket (sets status to CLOSED via update)
 */
export function useCloseTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      SupportAdminService.updateTicket(id, { status: 'CLOSED' } as Partial<SupportTicket>),
    onSuccess: () => {
      toast.success('Ticket closed successfully');
      queryClient.invalidateQueries({ queryKey: TICKET_KEYS.all });
    },
    onError: (error: Error) => {
      toast.error(`Failed to close ticket: ${error.message}`);
    },
  });
}
