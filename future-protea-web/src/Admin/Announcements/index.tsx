/**
 * @fileoverview Announcements admin page
 * @module Admin/Announcements
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pencil, Send, EyeOff, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/config/permissions';
import {
  useAnnouncementsQuery,
  useDeleteAnnouncementMutation,
  usePublishAnnouncementMutation,
  useUnpublishAnnouncementMutation,
} from './hooks/use-announcements';
import { AnnouncementFormDialog, LoadingState, EmptyState } from './components';
import type { Announcement } from '@/services/admin/announcement-admin.service';
import HappyAnnouncement1 from './assets/happy-announcement-animate.svg';
import HappyAnnouncement2 from './assets/happy-announcement-animate (1).svg';

export function AnnouncementsPage() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.NOTIFICATIONS_SEND);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useAnnouncementsQuery({ search: search || undefined });
  const deleteMutation = useDeleteAnnouncementMutation();
  const publishMutation = usePublishAnnouncementMutation();
  const unpublishMutation = useUnpublishAnnouncementMutation();

  const announcements: Announcement[] = data?.data?.announcements || data?.data || [];

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleFormClose = (open: boolean) => {
    setShowForm(open);
    if (!open) setEditingAnnouncement(null);
  };

  const getRandomSvg = (index: number) => {
    return index % 2 === 0 ? HappyAnnouncement1 : HappyAnnouncement2;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage platform announcements for users.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Announcement
          </Button>
        )}
      </div>

      <Input
        placeholder="Search announcements..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <LoadingState />
      ) : announcements.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative rounded-2xl p-6 border border-blue-100 hover:shadow-lg transition-shadow overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32">
                <img
                  src={getRandomSvg(index)}
                  alt="announcement"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between pr-12">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                      {announcement.title}
                    </h3>
                    <Badge
                      variant={announcement.isActive ? 'default' : 'secondary'}
                      className="w-fit"
                    >
                      {announcement.isActive ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Entry Date</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(announcement.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Created At</p>
                      <p className="font-semibold text-gray-900">
                        {formatTime(announcement.createdAt)}
                      </p>
                    </div>
                  </div>

                  {announcement.expiresAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-red-600 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Expires At</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(announcement.expiresAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="text-sm">
                    <p className="text-xs text-gray-500">Audience</p>
                    <p className="font-semibold text-gray-900">
                      {announcement.targetRoles.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="border-t border-blue-200 pt-4">
                  <p className={`text-sm text-gray-700 ${expandedId === announcement.id ? '' : 'line-clamp-3'}`}>
                    {announcement.content}
                  </p>
                  {announcement.content.length > 150 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === announcement.id ? null : announcement.id)}
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto mt-2"
                    >
                      {expandedId === announcement.id ? 'Read Less' : 'Read More'}
                    </Button>
                  )}
                </div>

                <div className="border-t border-blue-200 pt-4 flex items-center justify-between">
                  {canManage && (
                    <div className="flex items-center gap-2">
                      {announcement.isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unpublishMutation.mutate(announcement.id)}
                          disabled={unpublishMutation.isPending}
                          title="Unpublish"
                          className="text-xs"
                        >
                          <EyeOff className="h-3 w-3 mr-1" />
                          Unpublish
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => publishMutation.mutate(announcement.id)}
                          disabled={publishMutation.isPending}
                          title="Publish"
                          className="text-xs"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Publish
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                        title="Edit"
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(announcement.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete"
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnnouncementFormDialog
        open={showForm}
        onOpenChange={handleFormClose}
        announcement={editingAnnouncement}
      />
    </motion.div>
  );
}
