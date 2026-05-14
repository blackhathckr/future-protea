/**
 * @fileoverview Escalated tickets tab
 * @module Admin/Support/components/tabs/escalated-tab
 */

import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eye, UserPlus, RefreshCw, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import { useEscalatedTicketsQuery, useUpdateTicketMutation } from '../../hooks';
import {
  getPriorityBadge,
  getTicketStatusBadge,
  getCategoryBadge,
  formatTimeAgo,
} from '../../data';
import { TicketDetailDialog, AssignDialog } from '../dialogs';
import type { SupportTicket } from '../../data';

export const EscalatedTab = memo(function EscalatedTab() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useEscalatedTicketsQuery({
    page,
    limit: 10,
  });

  const updateTicket = useUpdateTicketMutation();
  const tickets = data?.data ?? [];
  const meta = data?.meta;

  // Dialog states
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    ticket: SupportTicket | null;
  }>({ open: false, ticket: null });

  const [assignDialog, setAssignDialog] = useState<{
    open: boolean;
    ticketId: string;
    ticketSubject: string;
  }>({ open: false, ticketId: '', ticketSubject: '' });

  const handleViewDetail = useCallback((ticket: SupportTicket) => {
    setDetailDialog({ open: true, ticket });
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailDialog({ open: false, ticket: null });
  }, []);

  const handleReassign = useCallback((ticketId: string, ticketSubject: string) => {
    setAssignDialog({ open: true, ticketId, ticketSubject });
  }, []);

  const handleCloseAssign = useCallback(() => {
    setAssignDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const handleUpdateStatus = useCallback(
    (ticketId: string, status: string) => {
      updateTicket.mutate({ id: ticketId, data: { status } as Partial<SupportTicket> });
    },
    [updateTicket],
  );

  if (isLoading) {
    return <LoadingState message="Loading escalated tickets..." />;
  }

  if (isError) {
    return <EmptyState title="Failed to load escalated tickets" message="Could not fetch escalated tickets. Please try again." />;
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        title="No escalated tickets"
        description="There are currently no escalated support tickets."
        
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Escalated</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => {
              const priorityBadge = getPriorityBadge(ticket.priority);
              const statusBadge = getTicketStatusBadge(ticket.status);
              const categoryBadge = getCategoryBadge(ticket.category);

              return (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-sm">{ticket.ticketNo}</TableCell>
                  <TableCell className="font-medium max-w-[180px] truncate" title={ticket.subject}>
                    {ticket.subject}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate" title={ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : 'Unknown'}>
                    {ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityBadge.className}>{priorityBadge.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={categoryBadge.className}>{categoryBadge.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatTimeAgo(ticket.updatedAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[120px] truncate" title={ticket.assignedTo || 'Unassigned'}>
                    {ticket.assignedTo || 'Unassigned'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        onValueChange={(value) => handleUpdateStatus(ticket.id, value)}
                      >
                        <SelectTrigger className="h-8 w-[120px] text-xs">
                          <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetail(ticket)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReassign(ticket.id, ticket.subject)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Reassign
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </motion.div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * (meta.limit || 10) + 1} to{' '}
            {Math.min(meta.page * (meta.limit || 10), meta.total)} of {meta.total} escalated tickets
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.hasPrev}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta.hasNext}
            >
              Next
            </Button>
          </div>
        </motion.div>
      )}

      {/* Dialogs */}
      <TicketDetailDialog
        open={detailDialog.open}
        onClose={handleCloseDetail}
        ticket={detailDialog.ticket}
      />
      <AssignDialog
        open={assignDialog.open}
        onClose={handleCloseAssign}
        ticketId={assignDialog.ticketId}
        ticketSubject={assignDialog.ticketSubject}
      />
    </motion.div>
  );
});
