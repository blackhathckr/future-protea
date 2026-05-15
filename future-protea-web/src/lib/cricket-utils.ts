/**
 * @fileoverview Cricket calculation helpers — overs, run rate, strike rate, ball labels.
 */

export function formatOvers(totalBalls: number, ballsPerOver = 6): string {
  if (!Number.isFinite(totalBalls) || totalBalls < 0) return '0.0'
  const overs = Math.floor(totalBalls / ballsPerOver)
  const balls = totalBalls % ballsPerOver
  return `${overs}.${balls}`
}

export function oversToBalls(overs: number, ballsPerOver = 6): number {
  if (!Number.isFinite(overs) || overs < 0) return 0
  const whole = Math.floor(overs)
  const fraction = Math.round((overs - whole) * 10)
  return whole * ballsPerOver + fraction
}

export function currentRunRate(runs: number, overs: number): number {
  if (!overs || overs <= 0) return 0
  const wholeOvers = Math.floor(overs)
  const balls = Math.round((overs - wholeOvers) * 10)
  const totalBalls = wholeOvers * 6 + balls
  if (totalBalls === 0) return 0
  return Number(((runs / totalBalls) * 6).toFixed(2))
}

export function requiredRunRate(target: number, currentRuns: number, ballsRemaining: number): number {
  if (ballsRemaining <= 0) return 0
  const runsNeeded = Math.max(0, target - currentRuns)
  return Number(((runsNeeded / ballsRemaining) * 6).toFixed(2))
}

export function strikeRate(runs: number, balls: number): number {
  if (!balls) return 0
  return Number(((runs / balls) * 100).toFixed(2))
}

export function economyRate(runs: number, overs: number): number {
  if (!overs) return 0
  const wholeOvers = Math.floor(overs)
  const balls = Math.round((overs - wholeOvers) * 10)
  const totalBalls = wholeOvers * 6 + balls
  if (!totalBalls) return 0
  return Number(((runs / totalBalls) * 6).toFixed(2))
}

export function ballLabel(ball: { runs: number; is_wide?: boolean; is_noball?: boolean; is_bye?: boolean; is_legbye?: boolean; is_wicket?: boolean; extras?: number }): string {
  if (ball.is_wicket) return 'W'
  if (ball.is_wide) return `Wd${ball.runs ? `+${ball.runs}` : ''}`
  if (ball.is_noball) return `Nb${ball.runs ? `+${ball.runs}` : ''}`
  if (ball.is_bye) return `B${ball.runs}`
  if (ball.is_legbye) return `Lb${ball.runs}`
  return String(ball.runs)
}

export function ballColor(label: string): { bg: string; text: string } {
  if (label === 'W') return { bg: 'bg-red-500', text: 'text-white' }
  if (label === '6') return { bg: 'bg-purple-600', text: 'text-white' }
  if (label === '4') return { bg: 'bg-blue-600', text: 'text-white' }
  if (label === '0') return { bg: 'bg-zinc-700 dark:bg-zinc-600', text: 'text-white' }
  if (label.startsWith('W')) return { bg: 'bg-red-500', text: 'text-white' }
  if (label.startsWith('N')) return { bg: 'bg-amber-500', text: 'text-white' }
  if (label.startsWith('B') || label.startsWith('L')) return { bg: 'bg-emerald-600', text: 'text-white' }
  return { bg: 'bg-zinc-200 dark:bg-zinc-700', text: 'text-foreground' }
}

export function initialsOf(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}

export function teamShortCode(name?: string | null): string {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.slice(0, 3).toUpperCase()
  return parts
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 3)
    .toUpperCase()
}

export const SHOT_DIRECTIONS = [
  'Fine Leg',
  'Square Leg',
  'Mid-wicket',
  'Mid On',
  'Long On',
  'Long Off',
  'Cover',
  'Point',
  'Third Man',
] as const

export const WICKET_TYPES = [
  'bowled',
  'caught',
  'lbw',
  'run_out',
  'stumped',
  'hit_wicket',
  'retired_hurt',
  'obstructing',
] as const
