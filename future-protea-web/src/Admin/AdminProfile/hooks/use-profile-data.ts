import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UserAdminService } from '@/services/admin';
import api from '@/lib/api';
import type {
  ProfileFormValues,
  PasswordFormValues,
  NotificationPreferences,
  SecuritySettings,
} from '../data/types';

const PROFILE_KEY = ['admin', 'profile'] as const;

/**
 * Fetches the current admin profile using their user ID from auth context.
 */
export function useProfileQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...PROFILE_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await UserAdminService.getUser(user.id);
      return response.data;
    },
    enabled: !!user?.id,
  });
}

/**
 * Updates the admin profile via PATCH /users/profile.
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileFormValues & { countryCode?: string }) => {
      const response = await api.patch('/users/profile', data);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });
}

/**
 * Changes the admin password via POST /auth/change-password.
 */
export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const response = await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: () => {
      toast.error('Failed to change password. Check your current password.');
    },
  });
}

/**
 * Updates notification preferences (stored as profile data).
 */
export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NotificationPreferences) => {
      const response = await api.patch('/users/profile', {
        notificationPreferences: data,
      });
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Notification preferences updated');
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
    },
    onError: () => {
      toast.error('Failed to update notification preferences');
    },
  });
}

/**
 * Updates security settings (stored as profile data).
 */
export function useUpdateSecuritySettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<SecuritySettings>) => {
      const response = await api.patch('/users/profile', {
        securitySettings: data,
      });
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Security settings updated');
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
    },
    onError: () => {
      toast.error('Failed to update security settings');
    },
  });
}

/**
 * Active sessions — returns current browser session.
 * Individual session listing requires Redis introspection which is not exposed via API.
 */
export function useActiveSessionsQuery() {
  return useQuery({
    queryKey: [...PROFILE_KEY, 'sessions'],
    queryFn: async () => {
      return [
        {
          id: 'current',
          browser: navigator.userAgent.includes('Chrome')
            ? 'Chrome'
            : navigator.userAgent.includes('Firefox')
              ? 'Firefox'
              : 'Browser',
          ip: '-',
          lastActive: new Date().toISOString(),
          isCurrent: true,
        },
      ];
    },
  });
}

/**
 * Revoke session — uses logout-all endpoint to invalidate all other sessions.
 */
export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_sessionId: string) => {
      await api.post('/auth/logout-all');
    },
    onSuccess: () => {
      toast.success('All other sessions revoked');
      queryClient.invalidateQueries({ queryKey: [...PROFILE_KEY, 'sessions'] });
    },
    onError: () => {
      toast.error('Failed to revoke sessions');
    },
  });
}
