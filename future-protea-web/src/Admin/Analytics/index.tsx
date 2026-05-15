/**
 * @fileoverview Analytics Page — real-time aggregates over the cricket DB.
 * Backed by /api/analytics/* endpoints. Auto-refreshes every 30s.
 *
 * Visual layer only — every hook, state shape, service call, and refresh
 * cadence is identical to the previous revision. The presentation has been
 * rebuilt around a proper SVG area chart, gradient KPI cards, podium-style
 * top-player lists, and a colour-coded activity feed.
 */

import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Activity, Users, Trophy, Shield, TrendingUp, RefreshCw, Crown, Zap,
  Target, Award, Medal, Flame, ArrowUpRight, ArrowDownRight, Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/cricket/PageHero'
import { AnalyticsAdmin } from '@/services/admin/admin-core.service'
import type { AnalyticsOverview, MatchesTrendPoint, RoleDistribution, AuditLogEntry } from '@/types/admin-core.types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Root page
// ─────────────────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [trend, setTrend] = useState<MatchesTrendPoint[]>([])
  const [roles, setRoles] = useState<RoleDistribution[]>([])
  const [activity, setActivity] = useState<AuditLogEntry[]>([])
  const [topPlayers, setTopPlayers] = useState<{ top_run_scorers: any[]; top_wicket_takers: any[] } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const [ov, tr, rd, ra, tp] = await Promise.all([
        AnalyticsAdmin.overview().catch(() => null),
        AnalyticsAdmin.matchesTrend(30).catch(() => ({ data: [] as MatchesTrendPoint[] })),
        AnalyticsAdmin.roleDistribution().catch(() => ({ data: [] as RoleDistribution[] })),
        AnalyticsAdmin.recentActivity(15).catch(() => ({ data: [] as AuditLogEntry[] })),
        AnalyticsAdmin.topPlayers(5).catch(() => ({ data: { top_run_scorers: [], top_wicket_takers: [] } })),
      ])
      if (ov?.data) setOverview(ov.data)
      setTrend((tr as any)?.data ?? [])
      setRoles((rd as any)?.data ?? [])
      setActivity((ra as any)?.data ?? [])
      setTopPlayers((tp as any)?.data ?? null)
      setLastUpdated(new Date())
    } catch {
      if (!silent) toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 30s for real-time feel
  useEffect(() => {
    const t = setInterval(() => load(true), 30_000)
    return () => clearInterval(t)
  }, [load])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-3xl bg-muted/40 animate-pulse" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-72 lg:col-span-2 rounded-xl bg-muted/40 animate-pulse" />
          <div className="h-72 rounded-xl bg-muted/40 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHero
        title="Analytics"
        description={`Real-time aggregates across matches, players, and tournaments. Last updated ${lastUpdated.toLocaleTimeString()}.`}
        icon={BarChart3}
        variant="slate"
        actions={
          <Button onClick={() => load()} variant="secondary" disabled={refreshing} className="bg-white/10 hover:bg-white/20 text-white border-0">
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} /> Refresh
          </Button>
        }
      />

      {/* Live ribbon */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-medium">Live · auto-refresh every 30s</span>
        </div>
      </div>

      {/* Primary KPIs — unified emerald brand palette across every card.
          The "Live Now" tile is the only exception: it keeps a red pulsing
          ping dot since "live" is a universally-understood urgency colour,
          but its card body is still emerald to stay on-brand. */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Total Matches"    value={overview?.matches.total ?? 0}             icon={Activity} />
        <Kpi label="Live Now"         value={overview?.matches.live ?? 0}              icon={Flame}    live />
        <Kpi label="Teams"            value={overview?.teams.total ?? 0}               icon={Shield}   />
        <Kpi label="Tournaments"      value={overview?.tournaments.total ?? 0}         icon={Trophy}   />
        <Kpi label="Users"            value={overview?.users.total ?? 0}               icon={Users}    />
        <Kpi label="Approved Players" value={overview?.users.approved_players ?? 0}    icon={Crown}    />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Kpi label="Total Runs"          value={overview?.activity.total_runs ?? 0}             icon={Zap}        />
        <Kpi label="Total Wickets"       value={overview?.activity.total_wickets ?? 0}          icon={Target}     />
        <Kpi label="Avg Runs / Match"    value={overview?.activity.avg_runs_per_match ?? 0}     icon={BarChart3}  />
        <Kpi label="Avg Wickets / Match" value={overview?.activity.avg_wickets_per_match ?? 0}  icon={TrendingUp} />
      </div>

      {/* Trend chart + role distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" /> Matches per day
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Last {trend.length} days · interactive</p>
              </div>
              <TrendSummary points={trend} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <TrendChart points={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" /> User role distribution
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{roles.reduce((a, r) => a + r.count, 0)} users total</p>
          </CardHeader>
          <CardContent>
            <RoleDistributionList roles={roles} />
          </CardContent>
        </Card>
      </div>

      {/* Top players */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-orange-500" /> Top run scorers
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Career totals across all matches</p>
          </CardHeader>
          <CardContent>
            <PlayerList rows={topPlayers?.top_run_scorers ?? []} valueKey="total_runs" unit="runs" accent="orange" />
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Medal className="h-4 w-4 text-violet-500" /> Top wicket takers
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Career totals across all matches</p>
          </CardHeader>
          <CardContent>
            <PlayerList rows={topPlayers?.top_wicket_takers ?? []} valueKey="total_wickets" unit="wkts" accent="violet" />
          </CardContent>
        </Card>
      </div>

      {/* Recent admin activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600" /> Recent admin activity
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Last 15 privileged actions</p>
        </CardHeader>
        <CardContent className="p-0">
          <ActivityFeed items={activity} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI card — bound to the active theme's primary colour
//
// Every card derives its gradient, ring, and text colour from `var(--primary)`
// via `color-mix`. When the user switches palettes (or toggles dark mode), the
// CSS variable updates and these cards re-tint automatically — no JS needed.
// The "Live Now" card adds a pulsing red ping dot regardless of palette
// because "live" is a universally-recognised urgency colour.
// ─────────────────────────────────────────────────────────────────────────────

function Kpi({ label, value, icon: Icon, live }: { label: string; value: number; icon: any; live?: boolean }) {
  // Inline style values use CSS color-mix so the cards follow the active
  // theme palette (--primary) and respond to light/dark mode automatically.
  const gradient =
    'linear-gradient(135deg, ' +
    'color-mix(in oklch, var(--primary) 18%, transparent) 0%, ' +
    'color-mix(in oklch, var(--primary) 6%, transparent) 55%, ' +
    'transparent 100%)'
  const ringColor    = 'color-mix(in oklch, var(--primary) 28%, transparent)'
  const iconRingClr  = 'color-mix(in oklch, var(--primary) 22%, transparent)'
  const valueColor   = 'var(--primary)'
  const iconBgColor  = 'color-mix(in oklch, var(--background) 65%, transparent)'

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
      <Card
        className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow"
        style={{
          background: gradient,
          boxShadow: `inset 0 0 0 1px ${ringColor}`,
        } as React.CSSProperties}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
              <p
                className="mt-1.5 text-2xl font-black tabular-nums"
                style={{ color: valueColor }}
              >
                {formatNumber(value)}
              </p>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur shrink-0"
              style={{
                backgroundColor: iconBgColor,
                boxShadow: `inset 0 0 0 1px ${iconRingClr}`,
              } as React.CSSProperties}
            >
              <Icon className="h-4 w-4" style={{ color: valueColor }} />
            </div>
          </div>
          {live && (
            <div className="absolute top-2 right-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 10_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n.toLocaleString()
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Trend chart — smooth area chart with gradient fill + hover dot
// ─────────────────────────────────────────────────────────────────────────────

function TrendSummary({ points }: { points: MatchesTrendPoint[] }) {
  if (points.length < 2) return null
  const total = points.reduce((a, p) => a + p.total, 0)
  const half = Math.floor(points.length / 2)
  const firstHalf = points.slice(0, half).reduce((a, p) => a + p.total, 0)
  const secondHalf = points.slice(half).reduce((a, p) => a + p.total, 0)
  const delta = firstHalf === 0 ? 0 : ((secondHalf - firstHalf) / Math.max(firstHalf, 1)) * 100
  const up = delta >= 0
  return (
    <div className="flex items-baseline gap-3">
      <div>
        <p className="text-2xl font-black tabular-nums">{total}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total · 30d</p>
      </div>
      {points.length > 4 && (
        <div className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
          up ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400',
        )}>
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(delta).toFixed(0)}%
        </div>
      )}
    </div>
  )
}

function TrendChart({ points }: { points: MatchesTrendPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  // Pre-compute everything for the chart in one memo
  const chart = useMemo(() => {
    if (points.length === 0) return null
    const W = 800
    const H = 220
    const PAD_L = 36
    const PAD_R = 12
    const PAD_T = 18
    const PAD_B = 26
    const innerW = W - PAD_L - PAD_R
    const innerH = H - PAD_T - PAD_B
    const max = Math.max(1, ...points.map((p) => p.total))
    const stepX = points.length > 1 ? innerW / (points.length - 1) : innerW
    const xs = points.map((_, i) => PAD_L + i * stepX)
    const ys = points.map((p) => PAD_T + innerH - (p.total / max) * innerH)

    // Build a smooth path using a Catmull-Rom → Bézier conversion for the
    // visible line, plus a closed-area path for the gradient fill below it.
    const linePath = (() => {
      if (points.length < 2) return `M${xs[0]},${ys[0]}`
      const pts = xs.map((x, i) => [x, ys[i]] as const)
      let d = `M${pts[0][0]},${pts[0][1]}`
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] ?? pts[i]
        const p1 = pts[i]
        const p2 = pts[i + 1]
        const p3 = pts[i + 2] ?? pts[i + 1]
        const t = 0.18 // smoothing
        const c1x = p1[0] + (p2[0] - p0[0]) * t
        const c1y = p1[1] + (p2[1] - p0[1]) * t
        const c2x = p2[0] - (p3[0] - p1[0]) * t
        const c2y = p2[1] - (p3[1] - p1[1]) * t
        d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`
      }
      return d
    })()

    const areaPath = `${linePath} L${xs[xs.length - 1]},${PAD_T + innerH} L${xs[0]},${PAD_T + innerH} Z`

    // Y-axis gridlines (4 segments)
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      y: PAD_T + innerH * f,
      label: Math.round(max * (1 - f)).toString(),
    }))

    return { W, H, PAD_L, PAD_R, PAD_T, PAD_B, innerH, max, xs, ys, linePath, areaPath, gridLines }
  }, [points])

  if (!chart) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-center gap-2">
        <Calendar className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No matches recorded yet.</p>
      </div>
    )
  }

  const { W, H, PAD_L, PAD_T, innerH, xs, ys, linePath, areaPath, gridLines } = chart
  const hovered = hoverIdx !== null ? points[hoverIdx] : null

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgb(16 185 129)" stopOpacity="0.55" />
            <stop offset="60%"  stopColor="rgb(16 185 129)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="rgb(16 185 129)" />
            <stop offset="50%"  stopColor="rgb(34 197 94)"  />
            <stop offset="100%" stopColor="rgb(20 184 166)" />
          </linearGradient>
          <filter id="trendGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Gridlines + Y-axis labels */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={PAD_L} x2={W - 12} y1={g.y} y2={g.y}
              stroke="currentColor"
              className="text-border"
              strokeDasharray="3 4"
              strokeWidth="1"
              opacity="0.5"
            />
            <text x={PAD_L - 6} y={g.y + 3} textAnchor="end" fontSize="10" className="fill-muted-foreground">
              {g.label}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#trendArea)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#trendLine)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#trendGlow)"
        />

        {/* Data dots */}
        {xs.map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={ys[i]}
            r={hoverIdx === i ? 5 : 3}
            className={cn(
              'transition-all duration-150',
              hoverIdx === i ? 'fill-emerald-500' : 'fill-background',
            )}
            stroke="rgb(16 185 129)"
            strokeWidth="2"
          />
        ))}

        {/* Hover vertical guide */}
        {hoverIdx !== null && (
          <line
            x1={xs[hoverIdx]} x2={xs[hoverIdx]}
            y1={PAD_T} y2={PAD_T + innerH}
            stroke="currentColor"
            className="text-emerald-500"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.6"
          />
        )}

        {/* Hit areas */}
        {xs.map((x, i) => {
          const half = xs.length > 1 ? (xs[1] - xs[0]) / 2 : (W - PAD_L) / 2
          return (
            <rect
              key={`hit-${i}`}
              x={x - half}
              y={PAD_T}
              width={half * 2}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          )
        })}
      </svg>

      {/* X-axis dates — show first / mid / last */}
      <div className="flex justify-between px-9 text-[10px] text-muted-foreground -mt-2">
        <span>{formatTrendDate(points[0]?.date)}</span>
        {points.length > 2 && <span>{formatTrendDate(points[Math.floor(points.length / 2)]?.date)}</span>}
        <span>{formatTrendDate(points[points.length - 1]?.date)}</span>
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 rounded-lg border bg-background/95 backdrop-blur px-3 py-1.5 shadow-md text-xs flex items-center gap-2 pointer-events-none"
        >
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{formatTrendDate(hovered.date)}</span>
          <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{hovered.total} matches</span>
        </div>
      )}
    </div>
  )
}

function formatTrendDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

// ─────────────────────────────────────────────────────────────────────────────
// Role distribution
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  admin:                'from-red-500 to-rose-500',
  super_admin:          'from-red-500 to-rose-500',
  feeder:               'from-emerald-500 to-teal-500',
  scorer:               'from-emerald-500 to-teal-500',
  player:               'from-sky-500 to-blue-600',
  viewer:               'from-amber-500 to-orange-500',
  spectator:            'from-amber-500 to-orange-500',
  coach:                'from-blue-500 to-indigo-500',
  umpire:               'from-violet-500 to-purple-600',
  tournament_organiser: 'from-orange-500 to-red-500',
  team_admin:           'from-fuchsia-500 to-pink-500',
  school_admin:         'from-cyan-500 to-blue-500',
  club_admin:           'from-lime-500 to-emerald-500',
}

function RoleDistributionList({ roles }: { roles: RoleDistribution[] }) {
  if (roles.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-center gap-2">
        <Users className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No user data yet.</p>
      </div>
    )
  }
  const total = roles.reduce((a, r) => a + r.count, 0)
  const max = Math.max(1, ...roles.map((r) => r.count))
  return (
    <ul className="space-y-3">
      {roles.map((r) => {
        const pct = total === 0 ? 0 : Math.round((r.count / total) * 100)
        const widthPct = (r.count / max) * 100
        const grad = ROLE_COLORS[r.role] ?? 'from-slate-500 to-slate-600'
        return (
          <li key={r.role} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold capitalize">{r.role.replace(/_/g, ' ')}</span>
              <span className="flex items-baseline gap-1.5 tabular-nums">
                <span className="font-bold">{r.count}</span>
                <span className="text-muted-foreground text-[10px]">· {pct}%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={cn('h-full rounded-full bg-gradient-to-r', grad)}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Top players (podium-style for top 3, simple rows for the rest)
// ─────────────────────────────────────────────────────────────────────────────

function PlayerList({ rows, valueKey, unit, accent }: { rows: any[]; valueKey: string; unit: string; accent: 'orange' | 'violet' }) {
  if (rows.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-center gap-2">
        <Trophy className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No data yet.</p>
      </div>
    )
  }
  return (
    <ul className="space-y-2">
      {rows.map((p, i) => {
        const rank = i + 1
        const isPodium = rank <= 3
        const rankClass = {
          1: 'bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-950 ring-amber-400/40',
          2: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 ring-slate-300/40',
          3: 'bg-gradient-to-br from-orange-300 to-amber-700 text-orange-950 ring-orange-400/40',
        }[rank]
        const fallbackGrad = accent === 'orange'
          ? 'from-orange-500 to-rose-500'
          : 'from-violet-500 to-fuchsia-500'

        return (
          <li
            key={p.player_id ?? i}
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-lg transition-colors',
              isPodium ? 'bg-muted/30 ring-1 ring-border hover:bg-muted/50' : 'hover:bg-muted/40',
            )}
          >
            {/* Rank chip */}
            <div className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black ring-2 shrink-0',
              isPodium ? rankClass : 'bg-muted text-muted-foreground ring-border',
            )}>
              {rank}
            </div>
            {/* Avatar */}
            {p.photo_url ? (
              <img src={p.photo_url} className="h-9 w-9 rounded-full object-cover ring-1 ring-border" alt="" />
            ) : (
              <div className={cn(
                'h-9 w-9 rounded-full text-white text-xs font-bold flex items-center justify-center bg-gradient-to-br shadow-sm',
                fallbackGrad,
              )}>
                {(p.player_name ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{p.player_name ?? 'Unknown'}</p>
              {p.team_name && (
                <p className="text-[10px] text-muted-foreground truncate">{p.team_name}</p>
              )}
            </div>
            {/* Value */}
            <div className="text-right shrink-0">
              <p className="font-black tabular-nums text-sm leading-none">{p[valueKey] ?? 0}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{unit}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity feed (colour-coded action badges + relative time)
// ─────────────────────────────────────────────────────────────────────────────

function ActivityFeed({ items }: { items: AuditLogEntry[] }) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <Activity className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      </div>
    )
  }
  return (
    <ul className="divide-y">
      {items.map((a) => (
        <li key={a.id} className="px-5 py-3 flex items-center gap-3 text-sm hover:bg-muted/30 transition-colors">
          <ActionBadge action={a.action} />
          <span className="text-muted-foreground capitalize">{a.entity_type}</span>
          <span className="font-mono text-xs text-muted-foreground truncate">{a.entity_id.slice(0, 12)}</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {a.actor?.name ?? <span className="italic">system</span>}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums" title={new Date(a.created_at).toLocaleString()}>
            {formatRelative(a.created_at)}
          </span>
        </li>
      ))}
    </ul>
  )
}

function ActionBadge({ action }: { action: string }) {
  const lower = action.toLowerCase()
  const tone =
    lower.includes('delete') || lower.includes('remove') ? 'red' :
    lower.includes('create') || lower.includes('add')    ? 'emerald' :
    lower.includes('update') || lower.includes('edit')   ? 'sky' :
    lower.includes('login')  || lower.includes('auth')   ? 'violet' :
    'muted'
  const cls = {
    red:     'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    sky:     'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
    violet:  'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
    muted:   'border-border bg-muted text-muted-foreground',
  }[tone]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md border font-mono text-[10px] font-semibold uppercase tracking-wider w-fit', cls)}>
      {action}
    </span>
  )
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const diffSec = Math.floor((Date.now() - then) / 1000)
  if (diffSec < 60)     return `${diffSec}s ago`
  if (diffSec < 3600)   return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400)  return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}
