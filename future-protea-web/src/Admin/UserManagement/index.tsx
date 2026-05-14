/**
 * @fileoverview User Management page
 * @module Admin/UserManagement
 *
 * @description
 * Admin user management screen showing the users table
 * with Add User and Bulk Upload action buttons that open dialogs.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataExportButton } from '@/components/data-export-button';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/config/permissions';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UsersTableTab, AddUserTab, BulkUploadTab, BulkDeleteTab } from './components';

export function UserManagementPage() {
  const { hasPermission } = usePermissions();
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header with action buttons */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground">Manage all user accounts</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:gap-2 gap-2">
          <DataExportButton
            label="Users"
            getData={async () => {
              const allUsers: Record<string, unknown>[] = [];
              let page = 1;
              let hasMore = true;
              while (hasMore) {
                const res = await api.get('/users', { params: { limit: 100, page } });
                const users = res.data?.data ?? [];
                allUsers.push(...users);
                hasMore = res.data?.meta?.hasNext ?? false;
                page++;
              }
              return allUsers.map((u) => ({
                Name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
                Email: u.email ?? '',
                Phone: u.phone ?? '',
                Role: u.role ?? '',
                Status: u.status ?? '',
                'Created At': u.createdAt ? new Date(u.createdAt as string).toLocaleDateString() : '',
              }));
            }}
          />
          {hasPermission(PERMISSIONS.USERS_BULK) && (
            <Button variant="outline" onClick={() => setBulkDeleteOpen(true)} className="text-destructive hover:text-destructive w-full sm:w-auto">
              <Trash2 className="mr-2 h-4 w-4" />
              Bulk Delete
            </Button>
          )}
          {hasPermission(PERMISSIONS.USERS_BULK) && (
            <Button variant="outline" onClick={() => setBulkUploadOpen(true)} className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
          )}
          {hasPermission(PERMISSIONS.USERS_CREATE) && (
            <Button onClick={() => setAddUserOpen(true)} className="w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <UsersTableTab />

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-2xl p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account. The user will receive a welcome email with login instructions.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="px-6 pb-6">
              <AddUserTab onSuccess={() => setAddUserOpen(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
        <DialogContent className="sm:max-w-6xl p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Upload Users
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file with user data. Required columns: First Name, Last Name, Email, Role.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="px-6 pb-6">
              <BulkUploadTab onSuccess={() => setBulkUploadOpen(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="sm:max-w-3xl p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Bulk Delete Users
            </DialogTitle>
            <DialogDescription>
              Upload a file with user identifiers (email or ID) to delete multiple users at once.
              Admin accounts are protected and cannot be bulk deleted.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="px-6 pb-6">
              <BulkDeleteTab onSuccess={() => setBulkDeleteOpen(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
