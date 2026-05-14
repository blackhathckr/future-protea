import Lottie from 'lottie-react';
import animationData from '../assets/users.json';

interface LoadingStateProps {
  message?: string;
  animationData?: Record<string, unknown>;
}

export function LoadingState({ message = 'Loading users...', animationData: customAnimation }: LoadingStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <Lottie animationData={customAnimation ?? animationData} loop style={{ width: 280, height: 280 }} />
      <p className="text-muted-foreground mt-4 text-center">{message}</p>
    </div>
  );
}
