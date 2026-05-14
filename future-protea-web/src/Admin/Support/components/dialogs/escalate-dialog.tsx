/**
 * @fileoverview Escalate ticket dialog with senior/manager selection
 * @module Admin/Support/components/dialogs/escalate-dialog
 */

import { memo } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { UserAdminService } from '@/services/admin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useEscalateTicketMutation } from '../../hooks';
import { escalateTicketSchema, getPriorityBadge } from '../../data';
import type { EscalateTicketFormData, TicketPriority } from '../../data';
import { Badge } from '@/components/ui/badge';

interface EscalateDialogProps {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  ticketSubject: string;
  currentPriority: string;
}

export const EscalateDialog = memo(function EscalateDialog({
  open,
  onClose,
  ticketId,
  ticketSubject,
  currentPriority,
}: EscalateDialogProps) {
  const form = useForm<EscalateTicketFormData>({
    resolver: zodResolver(escalateTicketSchema),
    defaultValues: {
      priority: 'HIGH',
      reason: '',
      escalateTo: '',
    },
  });

  const escalateTicket = useEscalateTicketMutation();
  const currentBadge = getPriorityBadge(currentPriority);

  const { data: adminsData, isLoading: adminsLoading } = useQuery({
    queryKey: ['admin', 'users', 'admins-escalate'],
    queryFn: () => UserAdminService.listUsers({ role: 'SUPER_ADMIN', limit: 50 }),
    enabled: open,
  });

  const adminUsers = adminsData?.data ?? [];

  function onSubmit(data: EscalateTicketFormData) {
    escalateTicket.mutate(
      {
        id: ticketId,
        data: {
          priority: data.priority,
          reason: data.reason,
          escalateTo: data.escalateTo || undefined,
        },
      },
      {
        onSuccess: () => {
          form.reset();
          onClose();
        },
      },
    );
  }

  const priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Escalate Ticket
          </DialogTitle>
          <DialogDescription>
            Escalate &quot;{ticketSubject}&quot; to a higher priority level.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Current Priority:</span>
          <Badge className={currentBadge.className}>{currentBadge.label}</Badge>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select new priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorities.map((p) => {
                        const badge = getPriorityBadge(p);
                        return (
                          <SelectItem key={p} value={p}>
                            {badge.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a priority level to escalate this ticket to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="escalateTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escalate To (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select senior/manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {adminsLoading ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : adminUsers.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No admins found</div>
                      ) : (
                        adminUsers.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.firstName} {admin.lastName} {admin.email ? `(${admin.email})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Optionally assign to a senior admin or manager
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Escalation</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this ticket needs escalation..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={escalateTicket.isPending}
              >
                {escalateTicket.isPending ? 'Escalating...' : 'Escalate Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});
