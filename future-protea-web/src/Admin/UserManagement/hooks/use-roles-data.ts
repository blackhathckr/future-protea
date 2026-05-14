/**
 * @fileoverview Roles & permissions data hooks
 * @module Admin/UserManagement/hooks/use-roles-data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { UserAdminService } from '@/services/admin';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as {
      message?: string;
      error?: string | { message?: string; code?: string };
    };
    // Backend format: { success: false, error: { code, message, details } }
    if (typeof data.error === 'object' && data.error?.message) {
      return data.error.message;
    }
    return data.message || (typeof data.error === 'string' ? data.error : null) || error.message;
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred';
}

const ROLES_KEY = ['admin', 'roles'] as const;
const PERMISSIONS_KEY = ['admin', 'permissions'] as const;

export function useRolesQuery() {
  return useQuery({
    queryKey: [...ROLES_KEY],
    queryFn: async () => {
      const response = await UserAdminService.listRoles();
      // Backend list returns _count.permissions (number), transform to match frontend type
      interface RoleResponse {
        id: string;
        name: string;
        description: string | null;
        isSystem: boolean;
        createdAt: string;
        _count?: { permissions: number; users: number };
        permissions?: { id: string; name: string }[];
      }
      const roles = (response.data ?? []) as RoleResponse[];
      return roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        createdAt: role.createdAt,
        permissionCount: role._count?.permissions ?? 0,
        userCount: role._count?.users ?? 0,
        permissions: role.permissions ?? [],
      }));
    },
    staleTime: 60 * 1000,
  });
}

export function usePermissionsQuery() {
  return useQuery({
    queryKey: [...PERMISSIONS_KEY],
    queryFn: async () => {
      const response = await UserAdminService.listPermissions();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; maxUsers?: number; permissions?: string[] }) => {
      const response = await UserAdminService.createRole(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_KEY });
      toast.success('Role created successfully');
    },
    onError: (error: unknown) => {
      toast.error(`Failed to create role: ${getErrorMessage(error)}`);
    },
  });
}

export function useRoleDetailQuery(roleId: string | null) {
  return useQuery({
    queryKey: [...ROLES_KEY, roleId],
    queryFn: async () => {
      if (!roleId) return null;
      const response = await UserAdminService.getRole(roleId);
      return response.data;
    },
    enabled: !!roleId,
    staleTime: 30 * 1000,
  });
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { description?: string; maxUsers?: number | null; permissions?: string[] } }) => {
      const response = await UserAdminService.updateRole(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_KEY });
      toast.success('Role updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(`Failed to update role: ${getErrorMessage(error)}`);
    },
  });
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await UserAdminService.deleteRole(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_KEY });
      toast.success('Role deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error(`Failed to delete role: ${getErrorMessage(error)}`);
    },
  });
}

export function useCreatePermissionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; resource: string; action: string; description?: string }) => {
      const response = await UserAdminService.createPermission(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMISSIONS_KEY });
      toast.success('Permission created successfully');
    },
    onError: (error: unknown) => {
      toast.error(`Failed to create permission: ${getErrorMessage(error)}`);
    },
  });
}
