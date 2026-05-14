/**
 * @fileoverview Create role dialog with permission checkboxes
 * @module Admin/UserManagement/components/dialogs/create-role-dialog
 */

import { memo, useState, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCreateRoleMutation } from '../../hooks';
import { createRoleSchema, type CreateRoleFormValues, type Permission } from '../../data/types';

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: Permission[];
}

export const CreateRoleDialog = memo(function CreateRoleDialog({
  open,
  onOpenChange,
  permissions,
}: CreateRoleDialogProps) {
  const createRoleMutation = useCreateRoleMutation();
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  });

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, Permission[]>();
    for (const perm of permissions) {
      const existing = groups.get(perm.resource) ?? [];
      existing.push(perm);
      groups.set(perm.resource, existing);
    }
    return Array.from(groups.entries());
  }, [permissions]);

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  const toggleResourceGroup = (perms: Permission[]) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      const allSelected = perms.every((p) => next.has(p.id));
      for (const p of perms) {
        if (allSelected) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
      }
      return next;
    });
  };

  const onSubmit = async (data: CreateRoleFormValues) => {
    // Check for validation errors
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.entries(errors)
        .map(([field, error]) => `${field}: ${error?.message}`)
        .join(', ');
      toast.error(`Validation error: ${errorMessages}`);
      return;
    }

    // Backend expects permission names, not IDs
    const permissionNames = permissions
      .filter((p) => selectedPermissions.has(p.id))
      .map((p) => p.name);
    await createRoleMutation.mutateAsync({
      name: data.name,
      description: data.description || undefined,
      maxUsers: data.maxUsers || undefined,
      permissions: permissionNames,
    });
    reset();
    setSelectedPermissions(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] mx-auto">
        <DialogHeader className="px-3 sm:px-6 pt-2 pb-2 sm:pb-3 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl">Create Role</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm leading-relaxed">
            Define a new role with specific permissions. Users can then be assigned this role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-h-0 flex flex-col overflow-hidden px-3 sm:px-6 space-y-2.5 sm:space-y-3 py-2">
          <div className="space-y-1 sm:space-y-1.5">
            <Label htmlFor="role-name" className="text-xs sm:text-sm font-medium">Role Name *</Label>
            <Input id="role-name" {...register('name')} placeholder="e.g. CONTENT_REVIEWER" className="h-8 sm:h-9 text-xs sm:text-sm" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1 sm:space-y-1.5">
            <Label htmlFor="role-description" className="text-xs sm:text-sm font-medium">Description</Label>
            <div className="max-h-20 sm:max-h-24 overflow-y-auto rounded-md border [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <Textarea
                id="role-description"
                {...register('description')}
                placeholder="Brief description of this role..."
                rows={2}
                className="resize-none text-xs sm:text-sm border-0 focus:ring-0 focus:border-0 p-2"
              />
            </div>
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1 sm:space-y-1.5">
            <Label htmlFor="role-max-users" className="text-xs sm:text-sm font-medium">Maximum Users (optional)</Label>
            <Input
              id="role-max-users"
              type="number"
              min={1}
              {...register('maxUsers', { valueAsNumber: true })}
              placeholder="No limit"
              className="h-8 sm:h-9 text-xs sm:text-sm"
            />
            {errors.maxUsers && (
              <p className="text-xs text-destructive">{errors.maxUsers.message}</p>
            )}
            <p className="text-xs text-muted-foreground leading-relaxed">
              Leave empty for unlimited users. Sets a cap on how many users can be assigned this role.
            </p>
          </div>

          <Separator className="my-2 sm:my-3" />

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm font-medium">Permissions</Label>
            <ScrollArea className="h-32 sm:h-40 rounded-md border p-2 [&_[data-slot=scroll-area-thumb]]:hidden">
              <div className="space-y-1">
                {groupedPermissions.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground py-4 text-center">
                    No permissions available.
                  </p>
                ) : (
                  <div className="space-y-2 sm:space-y-3 pr-3">
                    {groupedPermissions.map(([resource, perms]) => (
                      <div key={resource} className="space-y-1 sm:space-y-1.5">
                        <label className="flex items-center gap-2 text-xs sm:text-sm font-medium capitalize cursor-pointer py-0.5">
                          <Checkbox
                            checked={perms.every((p) => selectedPermissions.has(p.id))}
                            onCheckedChange={() => toggleResourceGroup(perms)}
                            className="flex-shrink-0"
                          />
                          <span className="font-medium">{resource}</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5 pl-5 sm:pl-6">
                          {perms.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer py-0.5"
                            >
                              <Checkbox
                                checked={selectedPermissions.has(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                                className="flex-shrink-0"
                              />
                              <span className="capitalize">{perm.action}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <p className="text-xs text-muted-foreground font-medium">
            {selectedPermissions.size} permission(s) selected
          </p>
        </form>

        <DialogFooter className="pt-2 sm:pt-3 px-3 sm:px-6 pb-3 sm:pb-4 flex-col sm:flex-row gap-2 bg-background border-t flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createRoleMutation.isPending} className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm">
            Cancel
          </Button>
          <Button type="button" disabled={createRoleMutation.isPending} onClick={() => handleSubmit(onSubmit)()} className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm">
            {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
