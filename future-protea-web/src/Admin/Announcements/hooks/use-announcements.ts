import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AnnouncementAdminService from '@/services/admin/announcement-admin.service';
import type { CreateAnnouncementData, UpdateAnnouncementData } from '@/services/admin/announcement-admin.service';

const KEYS = {
  all: ['admin', 'announcements'] as const,
  list: (params?: Record<string, unknown>) => [...KEYS.all, 'list', params] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
};

export function useAnnouncementsQuery(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: KEYS.list(params as Record<string, unknown>),
    queryFn: () => AnnouncementAdminService.listAnnouncements(params),
  });
}

export function useAnnouncementDetailQuery(id: string | null) {
  return useQuery({
    queryKey: KEYS.detail(id!),
    queryFn: () => AnnouncementAdminService.getAnnouncement(id!),
    enabled: !!id,
  });
}

export function useCreateAnnouncementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnnouncementData) => AnnouncementAdminService.createAnnouncement(data),
    onSuccess: () => {
      toast.success('Announcement created');
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create announcement'),
  });
}

export function useUpdateAnnouncementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementData }) =>
      AnnouncementAdminService.updateAnnouncement(id, data),
    onSuccess: () => {
      toast.success('Announcement updated');
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update announcement'),
  });
}

export function useDeleteAnnouncementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AnnouncementAdminService.deleteAnnouncement(id),
    onSuccess: () => {
      toast.success('Announcement deleted');
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete announcement'),
  });
}

export function usePublishAnnouncementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AnnouncementAdminService.publishAnnouncement(id),
    onSuccess: () => {
      toast.success('Announcement published');
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to publish'),
  });
}

export function useUnpublishAnnouncementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AnnouncementAdminService.unpublishAnnouncement(id),
    onSuccess: () => {
      toast.success('Announcement unpublished');
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to unpublish'),
  });
}
