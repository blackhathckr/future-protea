import Lottie from 'lottie-react';
import animationData from '../assets/users.json';

interface EmptyStateProps {
  title?: string;
  message?: string;
  animationData?: Record<string, unknown>;
}

export function EmptyState({
  title = 'No users found',
  message = 'No user data available at this time.',
  animationData: customAnimation,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Lottie animationData={customAnimation ?? animationData} loop style={{ width: 200, height: 200 }} />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">{message}</p>
    </div>
  );
}
