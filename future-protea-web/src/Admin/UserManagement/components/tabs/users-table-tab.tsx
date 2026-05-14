/**
 * @fileoverview Users table tab with data table, filters, and actions
 * @module Admin/UserManagement/components/tabs/users-table-tab
 */

import { memo, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from '@tanstack/react-table';
import { MoreHorizontal, Search, Trash2, Pencil, UserX, UserCheck, Eye, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useUsersQuery, useDeleteUserMutation, useUpdateUserMutation, useRolesQuery } from '../../hooks';
import { getUserStatusBadgeVariant, formatStatus, formatRole, getRoleBadgeVariant } from '../../data/helpers';
import { EditUserDialog } from '../dialogs/edit-user-dialog';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/config/permissions';
import type { User, UserFiltersState } from '../../data/types';

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export const UsersTableTab = memo(function UsersTableTab() {
  const { hasPermission } = usePermissions();

  const [filters, setFilters] = useState<UserFiltersState>({
    search: '',
    role: 'all',
    status: 'all',
    page: 1,
    limit: 10,
  });

  const searchRef = useRef<HTMLInputElement>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [filters.search]);

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [activateUser, setActivateUser] = useState<User | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);

  const queryFilters = useMemo(() => ({
    search: debouncedSearch || undefined,
    role: filters.role !== 'all' ? filters.role : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    page: filters.page,
    limit: filters.limit,
  }), [debouncedSearch, filters.role, filters.status, filters.page, filters.limit]);

  const { data: rolesData } = useRolesQuery();
  const roles = rolesData ?? [];

  const { data: response, isLoading, isError, refetch } = useUsersQuery(queryFilters);
  const deleteUserMutation = useDeleteUserMutation();
  const updateUserMutation = useUpdateUserMutation();

  const users = response?.data ?? [];
  const meta = response?.meta;

  const handleDeleteConfirm = useCallback(() => {
    if (deleteUserId) {
      deleteUserMutation.mutate(deleteUserId);
      setDeleteUserId(null);
    }
  }, [deleteUserId, deleteUserMutation]);

  const handleDeactivateConfirm = useCallback(() => {
    if (deactivateUser) {
      updateUserMutation.mutate(
        { id: deactivateUser.id, data: { status: 'DEACTIVATED' as const, deactivationReason: deactivateReason || undefined } },
        {
          onSuccess: () => {
            setDeactivateUser(null);
            setDeactivateReason('');
          },
        },
      );
    }
  }, [deactivateUser, deactivateReason, updateUserMutation]);

  const handleActivateConfirm = useCallback(() => {
    if (activateUser) {
      updateUserMutation.mutate(
        { id: activateUser.id, data: { status: 'ACTIVE' as const } },
        {
          onSuccess: () => {
            setActivateUser(null);
          },
        },
      );
    }
  }, [activateUser, updateUserMutation]);

  const selectedUserIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => users[parseInt(key)]?.id)
      .filter(Boolean) as string[];
  }, [rowSelection, users]);

  const handleBulkDeleteConfirm = useCallback(() => {
    selectedUserIds.forEach((id) => deleteUserMutation.mutate(id));
    setRowSelection({});
    setBulkDeleteOpen(false);
  }, [selectedUserIds, deleteUserMutation]);

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(row.original.firstName, row.original.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {row.original.firstName} {row.original.lastName}
              </p>
              {row.original.displayName && (
                <p className="text-xs text-muted-foreground">{row.original.displayName}</p>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.email ?? '-'}</span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => {
          const phone = row.original.phone;
          if (!phone) return <span className="text-sm text-muted-foreground">-</span>;
          const cc = row.original.countryCode;
          // If phone already starts with +, show as-is; otherwise prepend country code
          const display = phone.startsWith('+') ? phone : cc ? `${cc} ${phone}` : phone;
          return <span className="text-sm text-muted-foreground">{display}</span>;
        },
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <Badge variant="outline" className={getRoleBadgeVariant(row.original.role)}>
            {formatRole(row.original.role)}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant="outline" className={getUserStatusBadgeVariant(row.original.status)}>
            {formatStatus(row.original.status)}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewUser(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              {hasPermission(PERMISSIONS.USERS_UPDATE) && (
                <DropdownMenuItem onClick={() => setEditUser(row.original)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {hasPermission(PERMISSIONS.USERS_UPDATE) && row.original.status === 'ACTIVE' && (
                <DropdownMenuItem
                  className="text-amber-600 focus:text-amber-600"
                  onClick={() => setDeactivateUser(row.original)}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              )}
              {hasPermission(PERMISSIONS.USERS_UPDATE) && row.original.status === 'DEACTIVATED' && (
                <DropdownMenuItem
                  className="text-green-600 focus:text-green-600"
                  onClick={() => setActivateUser(row.original)}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Activate
                </DropdownMenuItem>
              )}
              {hasPermission(PERMISSIONS.USERS_DELETE) && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteUserId(row.original.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [hasPermission],
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta?.totalPages ?? 1,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
  });

  if (isError) {
    return <EmptyState title="Error" message="Failed to load users." />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {hasPermission(PERMISSIONS.USERS_DELETE) && selectedUserIds.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selectedUserIds.length})
          </Button>
        )}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search users..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            className="pl-9 pr-8"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => {
                setFilters((f) => ({ ...f, search: '', page: 1 }));
                searchRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select
          value={filters.role}
          onValueChange={(value) => setFilters((f) => ({ ...f, role: value, page: 1 }))}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {formatRole(role.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters((f) => ({ ...f, status: value, page: 1 }))}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
            <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingState message="Loading users..." />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Try adjusting your search or filter criteria."

        />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPrev}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNext}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedUserIds.length} Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUserIds.length} selected users?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedUserIds.length} Users
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={!!deactivateUser} onOpenChange={(open) => { if (!open) { setDeactivateUser(null); setDeactivateReason(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {deactivateUser?.firstName} {deactivateUser?.lastName}?
              The user will be logged out immediately and will not be able to access the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="deactivate-reason" className="text-sm font-medium">
              Reason for deactivation *
            </Label>
            <Textarea
              id="deactivate-reason"
              placeholder="e.g., Policy violation, Inactive account..."
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateConfirm}
              disabled={!deactivateReason.trim() || updateUserMutation.isPending}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {updateUserMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Confirmation */}
      <AlertDialog open={!!activateUser} onOpenChange={(open) => { if (!open) setActivateUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reactivate {activateUser?.firstName} {activateUser?.lastName}?
              The user will be able to log in and access the platform again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivateConfirm}
              disabled={updateUserMutation.isPending}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {updateUserMutation.isPending ? 'Activating...' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Dialog (read-only) */}
      {viewUser && (
        <EditUserDialog
          user={viewUser}
          open={!!viewUser}
          onOpenChange={(open) => !open && setViewUser(null)}
          readOnly
        />
      )}

      {/* Edit Dialog */}
      {editUser && (
        <EditUserDialog
          user={editUser}
          open={!!editUser}
          onOpenChange={(open) => !open && setEditUser(null)}
        />
      )}
    </motion.div>
  );
});
