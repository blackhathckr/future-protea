/**
 * @fileoverview Team crest — logo if available, otherwise initials in a gradient circle.
 */

import { cn } from '@/lib/utils'
import { initialsOf } from '@/lib/cricket-utils'

interface TeamCrestProps {
  name?: string | null
  logoUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZES: Record<NonNullable<TeamCrestProps['size']>, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
  xl: 'h-20 w-20 text-lg',
}

export function TeamCrest({ name, logoUrl, size = 'md', className }: TeamCrestProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name ?? 'Team'}
        className={cn('rounded-full object-cover bg-white ring-2 ring-white/40 shadow', SIZES[size], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-bold text-white shadow ring-2 ring-white/40',
        'bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600',
        SIZES[size],
        className,
      )}
    >
      {initialsOf(name)}
    </div>
  )
}
