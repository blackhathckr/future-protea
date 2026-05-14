import Lottie from 'lottie-react';
import animationData from '../assets/system-settings.json';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({
  title = 'No data available',
  message = 'System settings data is not available at this time.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Lottie animationData={animationData} loop style={{ width: 200, height: 200 }} />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">{message}</p>
    </div>
  );
}
