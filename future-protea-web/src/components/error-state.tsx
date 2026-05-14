/**
 * @fileoverview Shared Error State Component
 * @module components/error-state
 *
 * @description
 * Reusable error display with retry action.
 * Used when API calls or data fetching fails.
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error message */
  message?: string;
  /** Retry button label */
  retryLabel?: string;
  /** Retry action handler */
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  retryLabel = 'Try Again',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-6 gap-2">
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
