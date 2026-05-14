/**
 * @fileoverview Full ticket detail dialog with responses, reply form, internal notes, resolve & close
 * @module Admin/Support/components/dialogs/ticket-detail-dialog
 */

import { memo, useState } from 'react';
import { Clock, User, Tag, AlertCircle, Loader2, Lock, CheckCircle2, XCircle, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  getPriorityBadge,
  getTicketStatusBadge,
  getCategoryBadge,
  formatDateTime,
  formatTimeAgo,
} from '../../data';
import {
  useTicketDetailQuery,
  useAddResponseMutation,
  useResolveTicketMutation,
  useCloseTicketMutation,
} from '../../hooks';
import type { SupportTicket } from '../../data';

interface TicketDetailDialogProps {
  open: boolean;
  onClose: () => void;
  ticket: SupportTicket | null;
}

export const TicketDetailDialog = memo(function TicketDetailDialog({
  open,
  onClose,
  ticket: listTicket,
}: TicketDetailDialogProps) {
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  // Fetch full ticket by ID (includes description + responses)
  const { data: detailRes, isLoading } = useTicketDetailQuery(
    open && listTicket ? listTicket.id : null
  );

  const addResponse = useAddResponseMutation();
  const resolveTicket = useResolveTicketMutation();
  const closeTicket = useCloseTicketMutation();

  // Use the full detail if available, fall back to list ticket for quick render
  const fullTicket = detailRes?.data ?? null;
  const ticket = fullTicket ?? listTicket;

  if (!ticket) return null;

  const priorityBadge = getPriorityBadge(ticket.priority);
  const statusBadge = getTicketStatusBadge(ticket.status);
  const categoryBadge = getCategoryBadge(ticket.category);

  const userName = ticket.user
    ? `${ticket.user.firstName} ${ticket.user.lastName}`
    : 'Unknown';

  const responses = (fullTicket as unknown as { responses?: Array<{
    id: string;
    userId: string;
    message: string;
    isInternal: boolean;
    createdAt: string;
    user: { id: string; firstName: string; lastName: string; role?: string };
  }> })?.responses ?? [];

  const isClosed = ticket.status === 'CLOSED';
  const isResolved = ticket.status === 'RESOLVED';

  const handleSendReply = () => {
    if (!replyMessage.trim() || !listTicket) return;
    addResponse.mutate(
      { id: listTicket.id, data: { message: replyMessage, isInternal } },
      {
        onSuccess: () => {
          setReplyMessage('');
          setIsInternal(false);
        },
      }
    );
  };

  const handleResolve = () => {
    if (!listTicket) return;
    // If there's a resolve note, send it as an internal response first
    if (resolveNote.trim()) {
      addResponse.mutate(
        { id: listTicket.id, data: { message: `Resolution: ${resolveNote}`, isInternal: true } },
        {
          onSuccess: () => {
            resolveTicket.mutate(listTicket.id, {
              onSuccess: () => {
                setResolveNote('');
                setShowResolveForm(false);
              },
            });
          },
        }
      );
    } else {
      resolveTicket.mutate(listTicket.id, {
        onSuccess: () => {
          setShowResolveForm(false);
        },
      });
    }
  };

  const handleClose = () => {
    if (!listTicket) return;
    closeTicket.mutate(listTicket.id);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { onClose(); setShowResolveForm(false); setResolveNote(''); setReplyMessage(''); setIsInternal(false); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{ticket.ticketNo}</span>
            <span>{ticket.subject}</span>
          </DialogTitle>
          <DialogDescription>
            Submitted by {userName} - {formatTimeAgo(ticket.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="space-y-4 pr-4">
            {/* Badges + Action Buttons */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex flex-wrap gap-2">
                <Badge className={priorityBadge.className}>{priorityBadge.label} Priority</Badge>
                <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                <Badge className={categoryBadge.className}>{categoryBadge.label}</Badge>
              </div>
              <div className="flex gap-2">
                {!isClosed && !isResolved && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => setShowResolveForm(!showResolveForm)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resolve
                  </Button>
                )}
                {isResolved && !isClosed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={handleClose}
                    disabled={closeTicket.isPending}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {closeTicket.isPending ? 'Closing...' : 'Close Ticket'}
                  </Button>
                )}
              </div>
            </div>

            {/* Resolve Form */}
            {showResolveForm && (
              <div className="rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-green-700 dark:text-green-400">Resolve Ticket</h4>
                <Textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="Add a resolution note (optional)..."
                  rows={2}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowResolveForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleResolve}
                    disabled={resolveTicket.isPending || addResponse.isPending}
                  >
                    {resolveTicket.isPending ? 'Resolving...' : 'Confirm Resolve'}
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Ticket Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Submitted By</p>
                  <p className="font-medium">{userName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Assigned To</p>
                  <p className="font-medium">{ticket.assignedTo || 'Unassigned'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDateTime(ticket.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDateTime(ticket.updatedAt)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Description</h4>
              <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  ticket.description || 'No description provided.'
                )}
              </div>
            </div>

            <Separator />

            {/* Responses / Conversation */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Conversation</h4>
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading responses...
                </div>
              ) : responses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No responses yet.</p>
              ) : (
                <div className="space-y-3">
                  {responses.map((msg) => {
                    const isAdmin = msg.user?.role === 'SUPER_ADMIN' || msg.user?.role === 'ADMIN';
                    const responderName = msg.user
                      ? `${msg.user.firstName} ${msg.user.lastName}`
                      : 'Unknown';

                    return (
                      <div
                        key={msg.id}
                        className={`rounded-lg border p-3 ${
                          msg.isInternal
                            ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900'
                            : isAdmin
                              ? 'ml-6 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                              : 'mr-6'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {isAdmin ? `${responderName} (Admin)` : responderName}
                          </span>
                          {msg.isInternal && (
                            <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300">
                              <Lock className="h-3 w-3" />
                              Internal
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatDateTime(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reply Form */}
            {!isClosed && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Reply</h4>
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your response..."
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="internal-note"
                        checked={isInternal}
                        onCheckedChange={(checked) => setIsInternal(checked === true)}
                      />
                      <Label htmlFor="internal-note" className="text-sm flex items-center gap-1 cursor-pointer">
                        <Lock className="h-3.5 w-3.5 text-amber-600" />
                        Internal note (not visible to learner)
                      </Label>
                    </div>
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || addResponse.isPending}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {addResponse.isPending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
});
