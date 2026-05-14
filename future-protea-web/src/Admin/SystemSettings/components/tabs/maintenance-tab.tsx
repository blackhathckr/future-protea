import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import { useMaintenanceQuery, useDeleteMaintenanceMutation } from '../../hooks';
import { getMaintenanceStatusBadge } from '../../data';
import type { MaintenanceWindow } from '../../data/types';
import { CreateMaintenanceDialog } from '../dialogs/create-maintenance-dialog';

const MaintenanceRow = memo(function MaintenanceRow({
  item,
  onDelete,
  isDeleting,
}: {
  item: MaintenanceWindow;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const status = getMaintenanceStatusBadge(item.status);

  return (
    <motion.tr className="border-b transition-colors hover:bg-muted/50">
      <TableCell className="font-medium">{item.title}</TableCell>
      <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
      <TableCell>{new Date(item.scheduledAt).toLocaleString()}</TableCell>
      <TableCell>{item.estimatedDuration}h</TableCell>
      <TableCell>
        <Badge variant="outline" className={status.className}>
          {status.label}
        </Badge>
      </TableCell>
      <TableCell>{item.createdBy}</TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(item.id)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </motion.tr>
  );
});

export const MaintenanceTab = memo(function MaintenanceTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useMaintenanceQuery();
  const deleteMutation = useDeleteMaintenanceMutation();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return <LoadingState message="Loading maintenance windows..." />;
  }

  if (isError) {
    return (
      <EmptyState title="Error" message="Failed to load maintenance windows." />
    );
  }

  const items = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Maintenance
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No Maintenance Windows"
          description="No scheduled maintenance windows."
          
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <MaintenanceRow
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateMaintenanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
});
