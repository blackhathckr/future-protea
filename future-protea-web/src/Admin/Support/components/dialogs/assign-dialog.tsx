/**
 * @fileoverview Assign ticket to admin dialog
 * @module Admin/Support/components/dialogs/assign-dialog
 */

import { memo } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, Loader2 } from 'lucide-react';
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
} from '@/components/ui/form';
import { useAssignTicketMutation } from '../../hooks';
import { assignTicketSchema } from '../../data';
import type { AssignTicketFormData } from '../../data';

interface AssignDialogProps {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  ticketSubject: string;
}

export const AssignDialog = memo(function AssignDialog({
  open,
  onClose,
  ticketId,
  ticketSubject,
}: AssignDialogProps) {
  const form = useForm<AssignTicketFormData>({
    resolver: zodResolver(assignTicketSchema),
    defaultValues: {
      adminId: '',
      notes: '',
    },
  });

  const assignTicket = useAssignTicketMutation();

  const { data: adminsData, isLoading: adminsLoading } = useQuery({
    queryKey: ['admin', 'users', 'admins'],
    queryFn: () => UserAdminService.listUsers({ role: 'SUPER_ADMIN', limit: 50 }),
    enabled: open,
  });

  const adminUsers = adminsData?.data ?? [];

  function onSubmit(data: AssignTicketFormData) {
    assignTicket.mutate(
      { id: ticketId, data },
      {
        onSuccess: () => {
          form.reset();
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Ticket
          </DialogTitle>
          <DialogDescription>
            Assign &quot;{ticketSubject}&quot; to an admin for resolution.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="adminId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an admin" />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any context or instructions for the assignee..."
                      rows={3}
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
              <Button type="submit" disabled={assignTicket.isPending}>
                {assignTicket.isPending ? 'Assigning...' : 'Assign Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});
