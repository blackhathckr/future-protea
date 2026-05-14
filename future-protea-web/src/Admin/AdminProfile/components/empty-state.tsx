import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({
  title = 'No data found',
  message = 'Profile data is not available at this time.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">{message}</p>
    </div>
  );
}
