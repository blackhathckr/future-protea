/**
 * @fileoverview Score hero — the big gradient header shown at the top of a match.
 * Includes team crests, score (gold), overs line, live pulse, and target / CRR / RRR.
 */

import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TeamCrest } from './TeamCrest'
import { cn } from '@/lib/utils'
import type { Match } from '@/services/cricket/match.service'
import { currentRunRate, requiredRunRate } from '@/lib/cricket-utils'

interface ScoreHeroProps {
  match: Match
  team1Logo?: string | null
  team2Logo?: string | null
  className?: string
}

export function ScoreHero({ match, team1Logo, team2Logo, className }: ScoreHeroProps) {
  const isLive = match.status === 'live'
  const isCompleted = match.status === 'completed'
  const inningsNo = match.current_innings ?? 1

  const battingTeam =
    inningsNo === 2
      ? match.team2_score > match.team1_score ? 'team2' : (match.team2_overs > 0 ? 'team2' : 'team1')
      : 'team1'
  // Simple heuristic: show the score of the currently batting innings prominently
  const showT1First = battingTeam === 'team1'

  const t1RunRate = currentRunRate(match.team1_score, match.team1_overs)
  const t2RunRate = currentRunRate(match.team2_score, match.team2_overs)

  const target = inningsNo === 2 ? (match.team1_score + 1) : null
  const totalBalls = (match.total_overs || 0) * 6
  const ballsBowled =
    (Math.floor(match.team2_overs) * 6) + Math.round((match.team2_overs - Math.floor(match.team2_overs)) * 10)
  const ballsRemaining = Math.max(0, totalBalls - ballsBowled)
  const runsNeeded = target ? Math.max(0, target - match.team2_score) : 0
  const rrr = target ? requiredRunRate(target, match.team2_score, ballsRemaining) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border shadow-lg',
        'bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950',
        'dark:from-emerald-950 dark:via-emerald-900 dark:to-zinc-950',
        className,
      )}
    >
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-amber-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-emerald-300/10 blur-3xl" />

      <div className="relative p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {isLive && (
            <Badge className="bg-red-500 text-white border-0 hover:bg-red-500 animate-pulse">
              <Activity className="h-3 w-3 mr-1.5" />
              LIVE
            </Badge>
          )}
          {!isLive && (
            <Badge variant="secondary" className="bg-white/10 text-white border-0 backdrop-blur">
              {isCompleted ? 'COMPLETED' : 'UPCOMING'}
            </Badge>
          )}
          <span className="text-xs text-emerald-100/80">
            {match.venue && <>📍 {match.venue} • </>}
            {new Date(match.match_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        </div>

        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4 md:gap-8">
          {/* Team 1 */}
          <div className="flex flex-col items-center gap-2">
            <TeamCrest name={match.team1_name} logoUrl={team1Logo} size="lg" />
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-emerald-100/70">{showT1First ? 'Batting' : ''}</p>
              <p className="text-sm font-semibold text-white max-w-[7rem] truncate">{match.team1_name}</p>
            </div>
          </div>

          {/* Score block */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-200/80 mb-1">
              Innings {inningsNo}
            </p>
            <div className="flex items-baseline justify-center gap-2">
              <span
                className={cn(
                  'text-4xl md:text-5xl font-black tabular-nums',
                  'bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent',
                  'drop-shadow',
                )}
              >
                {showT1First ? match.team1_score : match.team2_score}
                <span className="text-2xl md:text-3xl">/{showT1First ? match.team1_wickets : match.team2_wickets}</span>
              </span>
              <span className="text-base md:text-lg font-semibold text-emerald-100/90">
                ({(showT1First ? match.team1_overs : match.team2_overs).toFixed(1)})
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] md:text-xs text-emerald-100/90">
              <span>CRR <strong className="text-white">{showT1First ? t1RunRate : t2RunRate}</strong></span>
              {target && inningsNo === 2 && (
                <>
                  <span>Target <strong className="text-amber-200">{target}</strong></span>
                  <span>Need <strong className="text-amber-200">{runsNeeded}</strong> in <strong className="text-white">{ballsRemaining}</strong></span>
                  <span>RRR <strong className="text-white">{rrr}</strong></span>
                </>
              )}
            </div>
            {match.winner && (
              <p className="mt-3 text-sm font-semibold text-amber-200">
                🏆 {match.winner} won the match
              </p>
            )}
            {match.toss_winner && !match.winner && (
              <p className="mt-2 text-[11px] text-emerald-100/70 italic">
                {match.toss_winner} won the toss and chose to {match.toss_decision}
              </p>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex flex-col items-center gap-2">
            <TeamCrest name={match.team2_name} logoUrl={team2Logo} size="lg" />
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-emerald-100/70">{!showT1First ? 'Batting' : ''}</p>
              <p className="text-sm font-semibold text-white max-w-[7rem] truncate">{match.team2_name}</p>
            </div>
          </div>
        </div>

        {/* Other team score (the not-batting team) */}
        {(isLive || isCompleted) && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-3 text-sm text-emerald-100/90">
            <TeamCrest name={showT1First ? match.team2_name : match.team1_name} logoUrl={showT1First ? team2Logo : team1Logo} size="xs" />
            <span className="font-medium">{showT1First ? match.team2_name : match.team1_name}</span>
            <span className="font-bold text-white tabular-nums">
              {showT1First
                ? `${match.team2_score}/${match.team2_wickets} (${match.team2_overs.toFixed(1)})`
                : `${match.team1_score}/${match.team1_wickets} (${match.team1_overs.toFixed(1)})`}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
