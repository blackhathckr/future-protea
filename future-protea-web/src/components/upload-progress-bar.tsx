import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Upload, CheckCircle2, XCircle } from 'lucide-react'

interface UploadProgressBarProps {
  filename: string
  percent: number
  status?: 'uploading' | 'complete' | 'error'
  className?: string
}

export function UploadProgressBar({
  filename,
  percent,
  status = 'uploading',
  className,
}: UploadProgressBarProps) {
  const Icon = status === 'complete' ? CheckCircle2 : status === 'error' ? XCircle : Upload

  return (
    <div className={cn('space-y-2 rounded-lg border p-3', className)}>
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            status === 'uploading' && 'text-primary animate-pulse',
            status === 'complete' && 'text-green-500',
            status === 'error' && 'text-destructive'
          )}
        />
        <span className="text-sm font-medium truncate flex-1">{filename}</span>
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            status === 'uploading' && 'text-primary',
            status === 'complete' && 'text-green-500',
            status === 'error' && 'text-destructive'
          )}
        >
          {status === 'error' ? 'Failed' : `${percent}%`}
        </span>
      </div>
      <Progress
        value={percent}
        className={cn(
          'h-2',
          status === 'complete' && '[&>[data-slot=progress-indicator]]:bg-green-500',
          status === 'error' && '[&>[data-slot=progress-indicator]]:bg-destructive'
        )}
      />
    </div>
  )
}
