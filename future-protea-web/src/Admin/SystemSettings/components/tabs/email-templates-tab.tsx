/**
 * @fileoverview Email Template Management Tab
 * @module Admin/SystemSettings/components/tabs/email-templates-tab
 */

import { memo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Mail, Eye, Power } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { toast } from 'sonner';
import { NotificationService, type EmailTemplate } from '@/services/notification.service';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';

export const EmailTemplatesTab = memo(function EmailTemplatesTab() {
  const queryClient = useQueryClient();
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formActive, setFormActive] = useState(true);

  const { data: templates, isLoading, isError } = useQuery({
    queryKey: ['admin', 'email-templates'],
    queryFn: async () => {
      const res = await NotificationService.getTemplates({ limit: 50 });
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; subject: string; body: string; isActive: boolean }) =>
      NotificationService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-templates'] });
      toast.success('Template created');
      resetForm();
      setCreateOpen(false);
    },
    onError: () => toast.error('Failed to create template'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmailTemplate> }) =>
      NotificationService.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-templates'] });
      toast.success('Template updated');
      resetForm();
      setEditTemplate(null);
    },
    onError: () => toast.error('Failed to update template'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => NotificationService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-templates'] });
      toast.success('Template deleted');
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete template'),
  });

  const resetForm = useCallback(() => {
    setFormName('');
    setFormSubject('');
    setFormBody('');
    setFormActive(true);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setCreateOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((template: EmailTemplate) => {
    setFormName(template.name);
    setFormSubject(template.subject);
    setFormBody(template.body);
    setFormActive(template.isActive);
    setEditTemplate(template);
  }, []);

  const handleSubmitCreate = useCallback(() => {
    createMutation.mutate({ name: formName, subject: formSubject, body: formBody, isActive: formActive });
  }, [createMutation, formName, formSubject, formBody, formActive]);

  const handleSubmitEdit = useCallback(() => {
    if (!editTemplate) return;
    updateMutation.mutate({ id: editTemplate.id, data: { name: formName, subject: formSubject, body: formBody, isActive: formActive } });
  }, [updateMutation, editTemplate, formName, formSubject, formBody, formActive]);

  const handleToggleActive = useCallback((template: EmailTemplate) => {
    updateMutation.mutate({ id: template.id, data: { isActive: !template.isActive } });
  }, [updateMutation]);

  // Extract variables from body using {{var}} pattern
  const extractedVariables = formBody.match(/\{\{(\w+)\}\}/g)?.map((v) => v.replace(/\{\{|\}\}/g, '')) ?? [];

  if (isLoading) return <LoadingState message="Loading email templates..." />;
  if (isError) return <EmptyState title="Error" message="Failed to load email templates." />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage email notification templates. Use {'{{variable}}'} syntax for dynamic content.
        </p>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {!templates || templates.length === 0 ? (
        <EmptyState title="No templates" description="Create your first email template to get started." />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{template.subject}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(template.variables ?? []).map((v) => (
                        <Badge key={v} variant="secondary" className="text-xs">{`{{${v}}}`}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={template.isActive
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-gray-50 text-gray-700'}
                    >
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewTemplate(template)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleActive(template)}>
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(template)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(template.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen || !!editTemplate} onOpenChange={(isOpen) => { if (!isOpen) { setCreateOpen(false); setEditTemplate(null); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {editTemplate ? 'Edit Template' : 'New Email Template'}
            </DialogTitle>
            <DialogDescription>
              {editTemplate ? 'Update the email template details.' : 'Create a new email notification template.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input placeholder="e.g. Welcome Email" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input placeholder="e.g. Welcome to Future Protea, {{firstName}}!" value={formSubject} onChange={(e) => setFormSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Body (HTML)</Label>
              <Textarea
                placeholder="<h1>Hello {{firstName}},</h1><p>Welcome to Future Protea!</p>"
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            {extractedVariables.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Detected Variables</Label>
                <div className="flex flex-wrap gap-1">
                  {extractedVariables.map((v) => (
                    <Badge key={v} variant="secondary" className="text-xs">{`{{${v}}}`}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditTemplate(null); resetForm(); }}>Cancel</Button>
            <Button
              onClick={editTemplate ? handleSubmitEdit : handleSubmitCreate}
              disabled={!formName || !formSubject || !formBody || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(isOpen) => !isOpen && setPreviewTemplate(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>Subject: {previewTemplate?.subject}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border p-4 bg-white dark:bg-gray-950">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: previewTemplate?.body ?? '' }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
});
