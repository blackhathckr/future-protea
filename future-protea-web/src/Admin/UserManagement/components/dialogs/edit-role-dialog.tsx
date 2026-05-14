/**
 * @fileoverview Edit role dialog with permission checkboxes
 * @module Admin/UserManagement/components/dialogs/edit-role-dialog
 */

import { memo, useState, useMemo, useEffect } from 'react';
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
import { useRoleDetailQuery, useUpdateRoleMutation } from '../../hooks';
import type { Permission } from '../../data/types';

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: Permission[];
  role: {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
  } | null;
}

export const EditRoleDialog = memo(function EditRoleDialog({
  open,
  onOpenChange,
  permissions,
  role,
}: EditRoleDialogProps) {
  const updateRoleMutation = useUpdateRoleMutation();
  const [description, setDescription] = useState('');
  const [maxUsers, setMaxUsers] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [descriptionError, setDescriptionError] = useState<string>('');

  // Fetch full role detail with permissions when dialog is open
  const { data: roleDetail, isLoading: detailLoading } = useRoleDetailQuery(
    open ? role?.id ?? null : null,
  );

  // Populate form when role detail is fetched
  useEffect(() => {
    if (open && roleDetail) {
      setDescription(roleDetail.description ?? '');
      setMaxUsers(roleDetail.maxUsers != null ? String(roleDetail.maxUsers) : '');
      // Backend returns permissions as join table: { permission: { id, name, ... } }
      // or directly as { id, name, ... } depending on shape
      const rolePerms = roleDetail.permissions ?? [];
      const permIds = rolePerms.map((p: { id?: string; permissionId?: string; permission?: { id: string } }) =>
        p.permission?.id ?? p.permissionId ?? p.id ?? '',
      ).filter(Boolean);
      setSelectedPermissions(new Set(permIds));
    } else if (open && role) {
      setDescription(role.description ?? '');
      setMaxUsers('');
    }
  }, [open, roleDetail, role]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    // Validate description length
    if (description.length > 250) {
      setDescriptionError('Description must not exceed 250 characters');
      return;
    }

    // Backend expects permission names, not IDs
    const permissionNames = permissions
      .filter((p) => selectedPermissions.has(p.id))
      .map((p) => p.name);

    const parsedMaxUsers = maxUsers.trim() !== '' ? parseInt(maxUsers, 10) : null;
    await updateRoleMutation.mutateAsync({
      id: role.id,
      data: {
        description: description || undefined,
        maxUsers: parsedMaxUsers !== null && !Number.isNaN(parsedMaxUsers) && parsedMaxUsers >= 1
          ? parsedMaxUsers
          : null,
        permissions: permissionNames,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] sm:w-[95vw] max-w-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] mx-2 sm:mx-0">
        <DialogHeader className="px-4 sm:px-6 pt-2 pb-3">
          <DialogTitle className="text-base sm:text-lg md:text-xl">Edit Role — {role?.name}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Update the role description and modify its permissions.
          </DialogDescription>
        </DialogHeader>

        {detailLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading role details...</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <form onSubmit={handleSubmit} className="px-4 sm:px-6 pb-4 space-y-3 sm:space-y-4 py-2">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-role-name" className="text-sm font-medium">Role Name</Label>
                <Input id="edit-role-name" value={role?.name ?? ''} disabled className="h-9 sm:h-10 bg-muted" />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-role-description" className="text-sm font-medium">Description</Label>
                <div className="max-h-24 sm:max-h-28 overflow-y-auto rounded-md border [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <Textarea
                    id="edit-role-description"
                    value={description}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDescription(value);
                      if (value.length > 250) {
                        setDescriptionError('Description must not exceed 250 characters');
                      } else {
                        setDescriptionError('');
                      }
                    }}
                    placeholder="Brief description of this role..."
                    rows={2}
                    className="resize-none text-sm border-0 focus:ring-0 focus:border-0"
                  />
                </div>
                {descriptionError && (
                  <p className="text-xs text-destructive">{descriptionError}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-role-max-users" className="text-sm font-medium">Maximum Users (optional)</Label>
                <Input
                  id="edit-role-max-users"
                  type="number"
                  min={1}
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value)}
                  placeholder="No limit"
                  className="h-9 sm:h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited users. Sets a cap on how many users can be assigned this role.
                </p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Permissions</Label>
                <ScrollArea className="h-32 sm:h-40 rounded-md border p-2 [&_[data-slot=scroll-area-thumb]]:hidden">
                  <div className="space-y-1">
                    {groupedPermissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No permissions available.
                      </p>
                    ) : (
                      <div className="space-y-3 sm:space-y-4 pr-4">
                        {groupedPermissions.map(([resource, perms]) => (
                          <div key={resource} className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium capitalize cursor-pointer py-1">
                              <Checkbox
                                checked={perms.every((p) => selectedPermissions.has(p.id))}
                                onCheckedChange={() => toggleResourceGroup(perms)}
                                className="flex-shrink-0"
                              />
                              <span className="font-medium">{resource}</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 pl-6">
                              {perms.map((perm) => (
                                <label
                                  key={perm.id}
                                  className="flex items-center gap-2 text-sm cursor-pointer py-0.5"
                                >
                                  <Checkbox
                                    checked={selectedPermissions.has(perm.id)}
                                    onCheckedChange={() => togglePermission(perm.id)}
                                    className="flex-shrink-0"
                                  />
                                  <span className="capitalize text-xs sm:text-sm">{perm.action}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground font-medium">
                  {selectedPermissions.size} permission(s) selected
                </p>
              </div>

            </form>
          </div>
        )}

        <DialogFooter className="pt-3 sm:pt-4 px-4 sm:px-6 pb-4 flex-col sm:flex-row gap-2 bg-background border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updateRoleMutation.isPending} className="w-full sm:w-auto h-9 sm:h-10 text-sm">
            Cancel
          </Button>
          <Button type="button" disabled={updateRoleMutation.isPending} onClick={handleSubmit} className="w-full sm:w-auto h-9 sm:h-10 text-sm">
            {updateRoleMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
