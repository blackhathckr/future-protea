/**
 * @fileoverview Live Scoreboard — striker / non-striker / bowler stats + this-over balls.
 * Mirrors the Flutter feeder live-scoring scoreboard.
 */

import { motion } from 'framer-motion'
import { Activity, Handshake, User2, Crosshair } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BallBadge } from './BallBadge'
import { initialsOf, strikeRate, economyRate, ballLabel } from '@/lib/cricket-utils'
import { cn } from '@/lib/utils'

export interface BatsmanState {
  id?: string | null
  name?: string | null
  runs: number
  balls: number
  fours: number
  sixes: number
}

export interface BowlerState {
  id?: string | null
  name?: string | null
  overs: number
  runs: number
  wickets: number
  maidens: number
}

interface LiveScoreboardProps {
  striker?: BatsmanState | null
  nonStriker?: BatsmanState | null
  bowler?: BowlerState | null
  currentOverBalls?: Array<{ runs: number; is_wide?: boolean; is_noball?: boolean; is_bye?: boolean; is_legbye?: boolean; is_wicket?: boolean; extras?: number }>
  partnership?: { runs: number; balls: number } | null
  className?: string
}

function batsmanRow(b: BatsmanState | null | undefined, isOnStrike: boolean) {
  const sr = strikeRate(b?.runs ?? 0, b?.balls ?? 0)
  const srColor =
    sr >= 150 ? 'text-blue-600 dark:text-blue-400'
    : sr >= 100 ? 'text-amber-600 dark:text-amber-400'
    : sr >= 60 ? 'text-foreground'
    : 'text-red-600 dark:text-red-400'

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          'h-2.5 w-2.5 rounded-full flex-shrink-0',
          isOnStrike
            ? 'bg-amber-400 ring-2 ring-amber-300/40 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
            : 'border-2 border-muted-foreground/60',
        )}
      />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-semibold truncate', isOnStrike && 'text-foreground', !isOnStrike && 'text-muted-foreground')}>
          {b?.name ?? '—'}
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums flex items-center gap-2">
          <span className="font-bold text-foreground">{b?.runs ?? 0}</span>
          <span>({b?.balls ?? 0})</span>
          <span className="text-blue-600 dark:text-blue-400">{b?.fours ?? 0}×4</span>
          <span className="text-purple-600 dark:text-purple-400">{b?.sixes ?? 0}×6</span>
          <span className={cn('font-semibold', srColor)}>SR {sr.toFixed(1)}</span>
        </p>
      </div>
    </div>
  )
}

export function LiveScoreboard({
  striker,
  nonStriker,
  bowler,
  currentOverBalls = [],
  partnership,
  className,
}: LiveScoreboardProps) {
  const econ = economyRate(bowler?.runs ?? 0, bowler?.overs ?? 0)

  return (
    <Card className={cn('overflow-hidden border-2', className)}>
      <CardContent className="p-0">
        <div className="grid md:grid-cols-[1fr,auto,minmax(220px,auto)] divide-y md:divide-y-0 md:divide-x">
          {/* Batsmen */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-blue-600 dark:text-blue-400 font-bold">
              <User2 className="h-3.5 w-3.5" /> Batsmen
            </div>
            {batsmanRow(striker, true)}
            {batsmanRow(nonStriker, false)}
          </div>

          {/* Partnership */}
          <div className="p-4 flex md:flex-col items-center md:items-center justify-center gap-2 bg-amber-50/40 dark:bg-amber-900/10 min-w-[120px]">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-bold">
              <Handshake className="h-3.5 w-3.5" /> Partnership
            </div>
            <motion.p
              key={partnership?.runs ?? 0}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-black tabular-nums text-amber-700 dark:text-amber-300"
            >
              {partnership?.runs ?? 0}
              <span className="text-sm font-semibold text-amber-700/70 dark:text-amber-300/70">
                {' '}({partnership?.balls ?? 0})
              </span>
            </motion.p>
          </div>

          {/* Bowler */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-red-600 dark:text-red-400 font-bold">
              <Crosshair className="h-3.5 w-3.5" /> Bowler
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-500 to-rose-700 text-white text-xs font-bold flex items-center justify-center shadow">
                {initialsOf(bowler?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{bowler?.name ?? '—'}</p>
                <p className="text-[11px] text-muted-foreground tabular-nums flex flex-wrap items-center gap-2">
                  <span className="font-bold text-foreground">{bowler?.wickets ?? 0}-{bowler?.runs ?? 0}</span>
                  <span>({(bowler?.overs ?? 0).toFixed(1)})</span>
                  <span>M:{bowler?.maidens ?? 0}</span>
                  <span className="font-semibold">Eco {econ.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* This-over strip */}
        <div className="border-t bg-muted/30 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-bold text-muted-foreground">
            <Activity className="h-3.5 w-3.5" /> This Over
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {currentOverBalls.length === 0 ? (
              <Badge variant="outline" className="text-xs">No balls bowled yet</Badge>
            ) : (
              currentOverBalls.map((b, i) => (
                <BallBadge key={i} delay={i * 0.04} size="sm" label={ballLabel(b)} />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
