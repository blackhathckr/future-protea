/**
 * @fileoverview Gradient Stat Card Component - Cricket themed
 * @module Admin/Dashboard/components
 */

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import Lottie from 'lottie-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface GradientStatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  lottieAnimation?: any
  svgPath?: string
  onClick?: () => void
}

export function GradientStatCard({
  title,
  value,
  icon: Icon,
  trend,
  lottieAnimation,
  svgPath,
  onClick,
}: GradientStatCardProps) {
  const colorVar = '--primary'
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        className="relative overflow-hidden cursor-pointer border shadow-md hover:shadow-lg transition-all duration-300"
        style={{
          backgroundColor: `color-mix(in oklch, var(${colorVar}) 8%, transparent)`,
          borderColor: `color-mix(in oklch, var(${colorVar}) 20%, transparent)`,
          color: `var(${colorVar})`,
        } as React.CSSProperties}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium opacity-75">{title}</p>
              <div className="flex items-baseline gap-2">
                <h3 
                  className="text-3xl font-bold"
                  style={{ color: `var(${colorVar})` }}
                >
                  {value}
                </h3>
                {trend && (
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-1 rounded-full',
                      trend.isPositive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    )}
                  >
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                )}
              </div>
            </div>
            {lottieAnimation ? (
              <div className="h-12 w-12 ml-4 flex-shrink-0">
                <Lottie animationData={lottieAnimation} loop className="w-full h-full" />
              </div>
            ) : svgPath ? (
              <div className="h-12 w-12 ml-4 flex-shrink-0 flex items-center justify-center">
                <img src={svgPath} alt={title} className="h-full w-full object-contain" />
              </div>
            ) : (
              <div 
                className="rounded-lg p-2 ml-4 flex-shrink-0"
                style={{ backgroundColor: `color-mix(in oklch, var(${colorVar}) 15%, transparent)` } as React.CSSProperties}
              >
                <Icon className="h-5 w-5" style={{ color: `var(${colorVar})` }} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
