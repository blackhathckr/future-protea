/**
 * @fileoverview User data hooks (CRUD)
 * @module Admin/UserManagement/hooks/use-users-data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { UserAdminService } from '@/services/admin';
import type { AdminUserFilters, CreateUserRequest } from '../data/types';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as {
      message?: string;
      error?: string | { message?: string; code?: string };
      details?: string;
    };
    // Backend format: { success: false, error: { code, message, details } }
    if (typeof data.error === 'object' && data.error?.message) {
      return data.error.message;
    }
    const errorMsg = data.message || (typeof data.error === 'string' ? data.error : null) || data.details || error.message;
    return errorMsg;
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred';
}

const USERS_KEY = ['admin', 'users'] as const;

export function useUsersQuery(filters?: AdminUserFilters) {
  return useQuery({
    queryKey: [...USERS_KEY, filters],
    queryFn: async () => {
      const response = await UserAdminService.listUsers(filters);
      return response;
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const response = await UserAdminService.createUser(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('User created successfully');
    },
    onError: (error: unknown) => {
      toast.error(`Failed to create user: ${getErrorMessage(error)}`);
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateUserRequest> }) => {
      const response = await UserAdminService.updateUser(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('User updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(`Failed to update user: ${getErrorMessage(error)}`);
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await UserAdminService.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('User deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error(`Failed to delete user: ${getErrorMessage(error)}`);
    },
  });
}

export function useBulkUploadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (users: CreateUserRequest[]) => {
      const response = await UserAdminService.bulkUploadUsers({ users });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      toast.success(`Bulk upload complete: ${data.success} created, ${data.failed} failed`);
    },
    onError: (error: unknown) => {
      toast.error(`Bulk upload failed: ${getErrorMessage(error)}`);
    },
  });
}
