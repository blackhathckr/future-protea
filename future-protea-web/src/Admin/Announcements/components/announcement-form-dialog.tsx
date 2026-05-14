import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
} from '../hooks/use-announcements';
import type { Announcement } from '@/services/admin/announcement-admin.service';

const TARGET_ROLES = [
  { value: 'LEARNER', label: 'Learners' },
  { value: 'EDUCATOR', label: 'Educators' },
];

interface AnnouncementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement?: Announcement | null;
}

export function AnnouncementFormDialog({
  open,
  onOpenChange,
  announcement,
}: AnnouncementFormDialogProps) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    targetRoles: ['LEARNER', 'EDUCATOR'],
    expiresAt: '',
  });

  const createMutation = useCreateAnnouncementMutation();
  const updateMutation = useUpdateAnnouncementMutation();
  const isEditing = !!announcement;

  useEffect(() => {
    if (announcement) {
      setForm({
        title: announcement.title,
        content: announcement.content,
        targetRoles: announcement.targetRoles,
        expiresAt: announcement.expiresAt
          ? new Date(announcement.expiresAt).toISOString().split('T')[0]
          : '',
      });
    } else {
      setForm({
        title: '',
        content: '',
        targetRoles: ['LEARNER', 'EDUCATOR'],
        expiresAt: '',
      });
    }
  }, [announcement, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;

    const payload = {
      title: form.title,
      content: form.content,
      targetRoles: form.targetRoles,
      expiresAt: form.expiresAt
        ? new Date(form.expiresAt).toISOString()
        : undefined,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: announcement!.id, data: payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const toggleRole = (role: string) => {
    setForm((f) => ({
      ...f,
      targetRoles: f.targetRoles.includes(role)
        ? f.targetRoles.filter((r) => r !== role)
        : [...f.targetRoles, role],
    }));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Announcement' : 'Create Announcement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Announcement title"
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={form.content}
              onChange={(e) =>
                setForm((f) => ({ ...f, content: e.target.value }))
              }
              placeholder="Announcement content"
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label>Target Audience</Label>
            <div className="flex gap-4">
              {TARGET_ROLES.map((role) => (
                <label
                  key={role.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={form.targetRoles.includes(role.value)}
                    onCheckedChange={() => toggleRole(role.value)}
                  />
                  <span className="text-sm">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Expires At (optional)</Label>
            <Input
              type="date"
              value={form.expiresAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, expiresAt: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Saving...'
                : isEditing
                  ? 'Update'
                  : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
