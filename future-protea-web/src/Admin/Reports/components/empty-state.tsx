import Lottie from 'lottie-react';
import animationData from '../assets/reports.json';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({
  title = 'No report data',
  message = 'No report data available for the selected period.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Lottie animationData={animationData} loop style={{ width: 200, height: 200 }} />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">{message}</p>
    </div>
  );
}
