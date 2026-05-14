/**
 * @fileoverview Shared Empty State Component
 * @module components/empty-state
 *
 * @description
 * Reusable empty state indicator with optional Lottie animation and action button.
 * Used across all features when there's no data to display.
 * Wraps the existing Empty UI primitives with Lottie support.
 */

import type { LucideIcon } from 'lucide-react';
import Lottie from 'lottie-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  /** Title text (e.g., "No courses found") */
  title: string;
  /** Description text (e.g., "Try adjusting your filters") */
  description?: string;
  /** Lottie animation data (JSON) */
  animationData?: Record<string, unknown>;
  /** Fallback icon when no Lottie animation is provided */
  icon?: LucideIcon;
  /** Animation width in pixels */
  width?: number;
  /** Animation height in pixels */
  height?: number;
  /** Optional action button label */
  actionLabel?: string;
  /** Optional action button click handler */
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  animationData,
  icon: Icon,
  width = 240,
  height = 240,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      {animationData ? (
        <Lottie
          animationData={animationData}
          loop
          style={{ width, height }}
        />
      ) : Icon ? (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      ) : null}

      <h3 className="mt-2 text-lg font-semibold">{title}</h3>

      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}

      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
