/**
 * @fileoverview Shared Loading State Component
 * @module components/loading-state
 *
 * @description
 * Reusable loading indicator with optional Lottie animation.
 * Used across all features for consistent loading UX.
 * Accepts a custom message (typically a translated string from the feature).
 */

import Lottie from 'lottie-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  /** Loading message displayed below the animation */
  message?: string;
  /** Lottie animation data (JSON). Falls back to skeleton pulse if not provided */
  animationData?: Record<string, unknown>;
  /** Animation width in pixels */
  width?: number;
  /** Animation height in pixels */
  height?: number;
  /** Variant: 'full' for page-level, 'inline' for card-level */
  variant?: 'full' | 'inline';
}

export function LoadingState({
  message,
  animationData,
  width = 200,
  height = 200,
  variant = 'full',
}: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      {animationData ? (
        <Lottie
          animationData={animationData}
          loop
          style={{ width, height }}
        />
      ) : (
        <div className="space-y-4 w-full max-w-sm">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      )}
      {message && (
        <p className="text-muted-foreground mt-4 text-center text-sm">{message}</p>
      )}
    </div>
  );
}
