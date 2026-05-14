/**
 * @fileoverview Roles & permissions management tab
 * @module Admin/UserManagement/components/tabs/roles-permissions-tab
 */

import { memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Shield, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import rolesAndPermissionLottie from '../../assets/roles-and-permission.json';
import { useRolesQuery, usePermissionsQuery, useDeleteRoleMutation, useCreatePermissionMutation } from '../../hooks';
import { CreateRoleDialog } from '../dialogs/create-role-dialog';
import { EditRoleDialog } from '../dialogs/edit-role-dialog';
import type { PermissionGridItem, Permission } from '../../data/types';

function buildPermissionGrid(permissions: Permission[]): { allActions: string[]; grid: PermissionGridItem[] } {
  // Collect all unique actions dynamically from backend data
  const actionSet = new Set<string>();
  const resourceMap = new Map<string, Map<string, string>>();

  for (const perm of permissions) {
    actionSet.add(perm.action);
    if (!resourceMap.has(perm.resource)) {
      resourceMap.set(perm.resource, new Map());
    }
    resourceMap.get(perm.resource)!.set(perm.action, perm.id);
  }

  const allActions = Array.from(actionSet).sort();
  const grid: PermissionGridItem[] = [];

  for (const [resource, actionMap] of resourceMap) {
    grid.push({
      resource,
      actions: allActions.map((action) => ({
        action,
        permissionId: actionMap.get(action) ?? '',
        checked: false,
      })),
    });
  }

  return { allActions, grid };
}

export const RolesPermissionsTab = memo(function RolesPermissionsTab() {
  const { data: roles, isLoading: rolesLoading, isError: rolesError, refetch: refetchRoles } = useRolesQuery();
  const { data: permissions, isLoading: permsLoading, isError: permsError, refetch: refetchPerms } = usePermissionsQuery();
  const deleteRoleMutation = useDeleteRoleMutation();
  const createPermissionMutation = useCreatePermissionMutation();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [editRoleData, setEditRoleData] = useState<{
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
  } | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreatePermDialog, setShowCreatePermDialog] = useState(false);
  const [newPermResource, setNewPermResource] = useState('');
  const [newPermAction, setNewPermAction] = useState('');
  const [newPermDescription, setNewPermDescription] = useState('');

  const { allActions, grid: permissionGrid } = useMemo(() => {
    return permissions ? buildPermissionGrid(permissions) : { allActions: [], grid: [] };
  }, [permissions]);

  if (rolesLoading || permsLoading) {
    return <LoadingState message="Loading roles..." animationData={rolesAndPermissionLottie} />;
  }

  if (rolesError || permsError) {
    return <EmptyState title="Error" message="Failed to load roles & permissions." />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Roles Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles
          </CardTitle>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create Role
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Name</TableHead>
                  <TableHead className="max-w-xs">Description</TableHead>
                  <TableHead className="text-center">Permissions</TableHead>
                  <TableHead className="text-center">System</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles?.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs">
                      <span className="block truncate" title={role.description ?? ''}>
                        {role.description ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{role.permissionCount ?? role.permissions?.length ?? 0}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {role.isSystem ? (
                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          System
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                          Custom
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={role.name === 'SUPER_ADMIN'}
                          onClick={() => {
                            setEditRoleData({
                              id: role.id,
                              name: role.name,
                              description: role.description,
                              isSystem: role.isSystem,
                            });
                            setShowEditDialog(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          disabled={role.isSystem}
                          onClick={() => setDeleteRoleId(role.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!roles || roles.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No roles found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Permission Grid (read-only reference) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Permission Matrix</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowCreatePermDialog(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create Permission
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">Resource</TableHead>
                  {allActions.map((action) => (
                    <TableHead key={action} className="text-center capitalize whitespace-nowrap">
                      {action}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionGrid.map((row) => (
                  <TableRow key={row.resource}>
                    <TableCell className="font-medium capitalize sticky left-0 bg-background">{row.resource}</TableCell>
                    {row.actions.map((action) => (
                      <TableCell key={action.action} className="text-center">
                        {action.permissionId ? (
                          <Checkbox
                            checked
                            disabled
                            aria-label={`${row.resource} ${action.action}`}
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {permissionGrid.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={allActions.length + 1} className="h-24 text-center text-muted-foreground">
                      No permissions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <CreateRoleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        permissions={permissions ?? []}
      />

      {/* Edit Role Dialog */}
      <EditRoleDialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setEditRoleData(null);
        }}
        permissions={permissions ?? []}
        role={editRoleData}
      />

      {/* Create Permission Dialog */}
      <Dialog open={showCreatePermDialog} onOpenChange={setShowCreatePermDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Permission</DialogTitle>
            <DialogDescription>
              Add a new permission to the system. Permissions follow the pattern: resource.action
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newPermResource || !newPermAction) return;
              await createPermissionMutation.mutateAsync({
                name: `${newPermResource}.${newPermAction}`,
                resource: newPermResource,
                action: newPermAction,
                description: newPermDescription || undefined,
              });
              setNewPermResource('');
              setNewPermAction('');
              setNewPermDescription('');
              setShowCreatePermDialog(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="perm-resource">Resource *</Label>
              <Input
                id="perm-resource"
                placeholder="e.g. course, user, session"
                value={newPermResource}
                onChange={(e) => setNewPermResource(e.target.value.toLowerCase())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perm-action">Action *</Label>
              <Input
                id="perm-action"
                placeholder="e.g. view, create, update, delete, approve, publish"
                value={newPermAction}
                onChange={(e) => setNewPermAction(e.target.value.toLowerCase())}
              />
              <p className="text-xs text-muted-foreground">
                Common: view, create, update, delete, approve, publish, export, assign, bulk
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="perm-desc">Description (Optional)</Label>
              <Input
                id="perm-desc"
                placeholder="What this permission allows"
                value={newPermDescription}
                onChange={(e) => setNewPermDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreatePermDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newPermResource || !newPermAction || createPermissionMutation.isPending}>
                {createPermissionMutation.isPending ? 'Creating...' : 'Create Permission'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation */}
      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? Users assigned this role will need to be
              reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteRoleId) {
                  deleteRoleMutation.mutate(deleteRoleId);
                  setDeleteRoleId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
});
