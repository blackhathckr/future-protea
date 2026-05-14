import Lottie from 'lottie-react';
import animationData from '../assets/tickets.json';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading support tickets...' }: LoadingStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <Lottie animationData={animationData} loop style={{ width: 280, height: 280 }} />
      <p className="text-muted-foreground mt-4 text-center">{message}</p>
    </div>
  );
}
