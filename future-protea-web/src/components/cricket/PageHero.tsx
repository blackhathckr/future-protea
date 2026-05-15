/**
 * @fileoverview Reusable gradient page hero used across cricket pages.
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface PageHeroProps {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  variant?: 'orange' | 'green' | 'blue' | 'purple' | 'slate'
  className?: string
}

const VARIANTS = {
  orange:
    'from-orange-500 via-amber-500 to-rose-500',
  green:
    'from-emerald-700 via-emerald-600 to-emerald-800',
  blue:
    'from-sky-600 via-blue-600 to-indigo-700',
  purple:
    'from-fuchsia-600 via-purple-600 to-violet-700',
  // Clean, professional dark surface — the default for admin index pages.
  // Pairs a deep slate gradient with a subtle emerald accent rather than a
  // saturated brand colour, keeping the page hierarchy calm.
  slate:
    'from-slate-900 via-slate-800 to-slate-900',
} as const

export function PageHero({ title, description, icon: Icon, actions, variant = 'orange', className }: PageHeroProps) {
  const isSlate = variant === 'slate'
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border shadow-lg p-5 md:p-7',
        'bg-gradient-to-br text-white',
        isSlate && 'border-slate-700/60',
        VARIANTS[variant],
        className,
      )}
    >
      {/* Decorative halos — emerald-tinted on slate, white on coloured variants. */}
      <div
        className={cn(
          'pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full blur-3xl',
          isSlate ? 'bg-emerald-500/20' : 'bg-white/15',
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full blur-3xl',
          isSlate ? 'bg-sky-500/10' : 'bg-white/10',
        )}
      />
      {/* Thin top accent line — only on the slate variant for that "premium" feel. */}
      {isSlate && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
      )}

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div
              className={cn(
                'h-12 w-12 rounded-xl backdrop-blur flex items-center justify-center ring-1',
                isSlate
                  ? 'bg-emerald-500/10 ring-emerald-400/30 text-emerald-300'
                  : 'bg-white/15 ring-white/30',
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h1>
            {description && (
              <p
                className={cn(
                  'mt-1 text-sm md:text-base max-w-2xl',
                  isSlate ? 'text-slate-300' : 'text-white/85',
                )}
              >
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </motion.div>
  )
}
