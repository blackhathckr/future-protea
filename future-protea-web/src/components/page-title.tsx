/**
 * @fileoverview Shared Page Title Component
 * @module components/page-title
 *
 * @description
 * Reusable page header with icon, title, and optional description.
 * Used at the top of feature pages for consistent visual hierarchy.
 * Supports Framer Motion animation variants.
 */

import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageTitleProps {
  /** Icon displayed next to the title */
  icon?: LucideIcon;
  /** Page title text */
  title: string;
  /** Optional subtitle/description */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Framer Motion animation variants */
  variants?: Record<string, unknown>;
  /** Framer Motion initial state */
  initial?: string;
  /** Framer Motion animate state */
  animate?: string;
}

export function PageTitle({
  icon: Icon,
  title,
  description,
  className,
  variants,
  initial,
  animate,
}: PageTitleProps) {
  return (
    <motion.div
      className={cn('flex items-start gap-3', className)}
      variants={variants}
      initial={initial}
      animate={animate}
    >
      {Icon && (
        <div className="mt-1 flex-shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      )}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
    </motion.div>
  );
}
