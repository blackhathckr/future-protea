import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading profile...' }: LoadingStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground mt-4 text-center">{message}</p>
    </div>
  );
}
