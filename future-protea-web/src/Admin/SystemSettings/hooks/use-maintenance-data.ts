import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SystemAdminService } from '@/services/admin';
import type { CreateMaintenanceValues } from '../data/types';

const MAINTENANCE_KEY = ['admin', 'system', 'maintenance'] as const;

/**
 * Fetches the list of maintenance windows.
 */
export function useMaintenanceQuery() {
  return useQuery({
    queryKey: [...MAINTENANCE_KEY],
    queryFn: async () => {
      const response = await SystemAdminService.listMaintenance();
      return response.data;
    },
  });
}

/**
 * Creates a new maintenance window.
 */
export function useCreateMaintenanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMaintenanceValues) => {
      const response = await SystemAdminService.createMaintenance(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Maintenance window created');
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEY });
    },
    onError: () => {
      toast.error('Failed to create maintenance window');
    },
  });
}

/**
 * Deletes a maintenance window.
 */
export function useDeleteMaintenanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await SystemAdminService.deleteMaintenance(id);
    },
    onSuccess: () => {
      toast.success('Maintenance window deleted');
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEY });
    },
    onError: () => {
      toast.error('Failed to delete maintenance window');
    },
  });
}
