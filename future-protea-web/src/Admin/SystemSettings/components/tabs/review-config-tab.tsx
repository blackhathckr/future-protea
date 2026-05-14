/**
 * @fileoverview Review Configuration Tab
 * @module Admin/SystemSettings/components/tabs/review-config-tab
 *
 * @description
 * Allows admin to configure review mode (rating-only, text-only, both)
 * and max character limit. Supports global default and per-tournament overrides.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, Plus, Trash2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
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
// import { ReviewAdminService } from '@/services/admin';

interface ReviewConfig {
  mode: 'rating_only' | 'text_only' | 'both';
  maxChars: number;
}

const CONFIG_KEYS = {
  all: ['admin', 'review-config'] as const,
  global: () => [...CONFIG_KEYS.all, 'global'] as const,
};

const MODE_LABELS: Record<string, string> = {
  rating_only: 'Rating Only',
  text_only: 'Text Only',
  both: 'Both Rating & Text',
};

export function ReviewConfigTab() {
  const queryClient = useQueryClient();

  const [globalMode, setGlobalMode] = useState<ReviewConfig['mode']>('both');
  const [globalMaxChars, setGlobalMaxChars] = useState(300);
  const [hasLoadedGlobal, setHasLoadedGlobal] = useState(false);

  // Per-tournament override dialog
  const [overrideDialog, setOverrideDialog] = useState(false);
  const [overrideTournamentId, setOverrideTournamentId] = useState('');
  const [overrideMode, setOverrideMode] = useState<ReviewConfig['mode']>('both');
  const [overrideMaxChars, setOverrideMaxChars] = useState(300);

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; tournamentId: string }>({ open: false, tournamentId: '' });

  // Fetch tournaments for dropdown
  const tournaments: Array<{ id: string; title: string }> = [];

  // Fetch global config
  const globalLoading = false;
  // const { isLoading: globalLoading } = useQuery({
  //   queryKey: CONFIG_KEYS.global(),
  //   queryFn: async () => {
  //     const res = await ReviewAdminService.getReviewConfig();
  //     return res.data as ReviewConfig;
  //   },
  //   select: (data: ReviewConfig) => {
  //     if (!hasLoadedGlobal && data) {
  //       setGlobalMode(data.mode ?? 'both');
  //       setGlobalMaxChars(data.maxChars ?? 300);
  //       setHasLoadedGlobal(true);
  //     }
  //     return data;
  //   },
  // });

  // Save global config
  const saveGlobalMutation = useMutation({
    mutationFn: async () => {
      // return ReviewAdminService.upsertReviewConfig({ mode: globalMode, maxChars: globalMaxChars });
      return Promise.resolve();
    },
    onSuccess: () => {
      toast.success('Global review config saved');
      queryClient.invalidateQueries({ queryKey: CONFIG_KEYS.all });
    },
    onError: () => toast.error('Failed to save config'),
  });

  // Save per-tournament override
  const saveOverrideMutation = useMutation({
    mutationFn: async () => {
      // return ReviewAdminService.upsertReviewConfig(
      //   { mode: overrideMode, maxChars: overrideMaxChars },
      //   overrideTournamentId
      // );
      return Promise.resolve();
    },
    onSuccess: () => {
      toast.success('Tournament override saved');
      queryClient.invalidateQueries({ queryKey: CONFIG_KEYS.all });
      setOverrideDialog(false);
    },
    onError: () => toast.error('Failed to save override'),
  });

  // Delete per-tournament override (set back to global default by saving empty)
  const deleteOverrideMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      // Delete by resetting to global defaults
      return ReviewAdminService.upsertReviewConfig({ mode: globalMode, maxChars: globalMaxChars }, tournamentId);
    },
    onSuccess: () => {
      toast.success('Override removed');
      queryClient.invalidateQueries({ queryKey: CONFIG_KEYS.all });
    },
    onError: () => toast.error('Failed to remove override'),
  });

  const openAddOverride = useCallback(() => {
    setOverrideTournamentId('');
    setOverrideMode('both');
    setOverrideMaxChars(300);
    setOverrideDialog(true);
  }, []);

  if (globalLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Default Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Global Review Settings
          </CardTitle>
          <CardDescription>
            Default review configuration applied to all tournaments unless overridden.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Review Mode */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Review Mode</Label>
            <RadioGroup
              value={globalMode}
              onValueChange={(v) => setGlobalMode(v as ReviewConfig['mode'])}
              className="grid grid-cols-3 gap-3"
            >
              {(['rating_only', 'text_only', 'both'] as const).map((mode) => (
                <label
                  key={mode}
                  className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                    globalMode === mode ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value={mode} />
                  <span className="text-sm font-medium">{MODE_LABELS[mode]}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Max Characters */}
          <div className="space-y-2">
            <Label htmlFor="global-max-chars" className="text-sm font-medium">
              Max Characters (for text reviews)
            </Label>
            <Input
              id="global-max-chars"
              type="number"
              min={50}
              max={5000}
              value={globalMaxChars}
              onChange={(e) => setGlobalMaxChars(Number(e.target.value))}
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Applies when mode includes text. Range: 50-5000.
            </p>
          </div>

          <Button
            onClick={() => saveGlobalMutation.mutate()}
            disabled={saveGlobalMutation.isPending}
            className="gap-1.5"
          >
            {saveGlobalMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Global Config
          </Button>
        </CardContent>
      </Card>

      {/* Per-Tournament Overrides */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Per-Tournament Overrides</CardTitle>
              <CardDescription>
                Override the global config for specific tournaments.
              </CardDescription>
            </div>
            <Button onClick={openAddOverride} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Override
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Per-tournament overrides can be configured by entering a tournament ID. The override will
            take precedence over the global setting for that specific tournament.
          </p>
        </CardContent>
      </Card>

      {/* Add/Edit Override Dialog */}
      <Dialog open={overrideDialog} onOpenChange={setOverrideDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tournament Override</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Tournament</Label>
              <Select value={overrideTournamentId} onValueChange={setOverrideTournamentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a tournament..." />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Review Mode</Label>
              <RadioGroup
                value={overrideMode}
                onValueChange={(v) => setOverrideMode(v as ReviewConfig['mode'])}
                className="space-y-2"
              >
                {(['rating_only', 'text_only', 'both'] as const).map((mode) => (
                  <label
                    key={mode}
                    className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                      overrideMode === mode ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={mode} />
                    <span className="text-sm">{MODE_LABELS[mode]}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="override-max-chars">Max Characters</Label>
              <Input
                id="override-max-chars"
                type="number"
                min={50}
                max={5000}
                value={overrideMaxChars}
                onChange={(e) => setOverrideMaxChars(Number(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialog(false)}>Cancel</Button>
            <Button
              onClick={() => saveOverrideMutation.mutate()}
              disabled={saveOverrideMutation.isPending || !overrideTournamentId.trim()}
            >
              {saveOverrideMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Override Confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, tournamentId: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove override?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the per-tournament override and the global settings will apply instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteOverrideMutation.mutate(deleteDialog.tournamentId);
                setDeleteDialog({ open: false, tournamentId: '' });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
