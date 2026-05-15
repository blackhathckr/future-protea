/**
 * @fileoverview Ball-by-ball badge displayed in over strips and Balls tab.
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ballColor } from '@/lib/cricket-utils'

interface BallBadgeProps {
  label: string
  size?: 'sm' | 'md' | 'lg'
  delay?: number
  className?: string
}

const SIZES: Record<NonNullable<BallBadgeProps['size']>, string> = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
}

export function BallBadge({ label, size = 'md', delay = 0, className }: BallBadgeProps) {
  const { bg, text } = ballColor(label)
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 360, damping: 22 }}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold shadow ring-2 ring-white/40 dark:ring-black/40',
        SIZES[size],
        bg,
        text,
        className,
      )}
    >
      {label}
    </motion.div>
  )
}
