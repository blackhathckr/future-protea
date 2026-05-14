/**
 * @fileoverview All tickets tab with search and filtering
 * @module Admin/Support/components/tabs/all-tickets-tab
 */

import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, UserPlus, AlertTriangle, RefreshCw, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useTicketsQuery, useUpdateTicketMutation } from '../../hooks';
import {
  getPriorityBadge,
  getTicketStatusBadge,
  getCategoryBadge,
  formatTimeAgo,
} from '../../data';
import { TicketDetailDialog, AssignDialog, EscalateDialog } from '../dialogs';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/config/permissions';
import type { SupportTicket } from '../../data';

export const AllTicketsTab = memo(function AllTicketsTab() {
  const { hasPermission } = usePermissions();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isError, refetch } = useTicketsQuery({
    page,
    limit: 10,
    search: search || undefined,
    priority: priorityFilter || undefined,
    status: statusFilter || undefined,
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

  const [escalateDialog, setEscalateDialog] = useState<{
    open: boolean;
    ticketId: string;
    ticketSubject: string;
    currentPriority: string;
  }>({ open: false, ticketId: '', ticketSubject: '', currentPriority: '' });

  const handleViewDetail = useCallback((ticket: SupportTicket) => {
    setDetailDialog({ open: true, ticket });
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailDialog({ open: false, ticket: null });
  }, []);

  const handleAssign = useCallback((ticketId: string, ticketSubject: string) => {
    setAssignDialog({ open: true, ticketId, ticketSubject });
  }, []);

  const handleCloseAssign = useCallback(() => {
    setAssignDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const handleEscalate = useCallback(
    (ticketId: string, ticketSubject: string, currentPriority: string) => {
      setEscalateDialog({ open: true, ticketId, ticketSubject, currentPriority });
    },
    [],
  );

  const handleCloseEscalate = useCallback(() => {
    setEscalateDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const handleUpdateStatus = useCallback(
    (ticketId: string, status: string) => {
      updateTicket.mutate({ id: ticketId, data: { status } as Partial<SupportTicket> });
    },
    [updateTicket],
  );

  if (isLoading) {
    return <LoadingState message="Loading tickets..." />;
  }

  if (isError) {
    return <EmptyState title="Failed to load tickets" message="Could not fetch tickets. Please try again." />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select
            value={priorityFilter}
            onValueChange={(value) => {
              setPriorityFilter(value === 'ALL' ? '' : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value === 'ALL' ? '' : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Table */}
      {tickets.length === 0 ? (
        <EmptyState
          title="No tickets found"
          description="Adjust your filters or check back later for new tickets."
          
        />
      ) : (
        <>
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
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
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
                      <TableCell className="font-medium max-w-[200px] truncate" title={ticket.subject}>
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
                      <TableCell className="text-muted-foreground max-w-[120px] truncate" title={ticket.assignedTo || 'Unassigned'}>
                        {ticket.assignedTo || 'Unassigned'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatTimeAgo(ticket.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {ticket.status !== 'CLOSED' && (
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
                          )}
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
                              {hasPermission(PERMISSIONS.SUPPORT_ASSIGN) && (
                                <DropdownMenuItem onClick={() => handleAssign(ticket.id, ticket.subject)}>
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Assign
                                </DropdownMenuItem>
                              )}
                              {hasPermission(PERMISSIONS.SUPPORT_RESPOND) && (
                                <DropdownMenuItem
                                  onClick={() => handleEscalate(ticket.id, ticket.subject, ticket.priority)}
                                  className="text-orange-600 focus:text-orange-700"
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  Escalate
                                </DropdownMenuItem>
                              )}
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
                {Math.min(meta.page * (meta.limit || 10), meta.total)} of {meta.total} tickets
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
        </>
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
      <EscalateDialog
        open={escalateDialog.open}
        onClose={handleCloseEscalate}
        ticketId={escalateDialog.ticketId}
        ticketSubject={escalateDialog.ticketSubject}
        currentPriority={escalateDialog.currentPriority}
      />
    </motion.div>
  );
});
