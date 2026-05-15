/**
 * @fileoverview Cricket Admin Dashboard
 * @module Admin/Dashboard
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, Calendar, Trophy, Shield, Users, Target,
  Plus, Zap, Eye, ChevronRight, Crown, Flame,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GradientStatCard } from './components/GradientStatCard'
import liveCricketAnimation from './assets/live_cricket.json'
import cricketAnimateSvg from './assets/cricket-animate.svg'
import activeMatchSvg from './assets/active_match.svg'
import crickterBanner from './assets/crickter_banner.png'
import { MatchService, type Match } from '@/services/cricket/match.service'
import { TournamentService } from '@/services/cricket/tournament.service'
import { TeamService } from '@/services/cricket/team.service'
import { PlayerService } from '@/services/cricket/player.service'
import { toast } from 'sonner'
import { TeamCrest } from '@/components/cricket/TeamCrest'
import { currentRunRate } from '@/lib/cricket-utils'
import { cn } from '@/lib/utils'

interface DashboardStats {
  liveMatches: number
  upcomingMatches: number
  completedMatches: number
  totalTeams: number
  totalPlayers: number
  activeTournaments: number
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    liveMatches: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    totalTeams: 0,
    totalPlayers: 0,
    activeTournaments: 0,
  })
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [recentMatches, setRecentMatches] = useState<Match[]>([])
  const [topPlayers, setTopPlayers] = useState<any>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [live, upcoming, completed, teams, players, tournaments, topPlayersData] = await Promise.all([
        MatchService.getMatches('live').catch(() => []),
        MatchService.getMatches('upcoming').catch(() => []),
        MatchService.getMatches('completed').catch(() => []),
        TeamService.getTeams().catch(() => []),
        PlayerService.getPlayers().catch(() => []),
        TournamentService.getTournaments().catch(() => []),
        PlayerService.getTopPlayers().catch(() => null),
      ])

      setStats({
        liveMatches: live.length,
        upcomingMatches: upcoming.length,
        completedMatches: completed.length,
        totalTeams: teams.length,
        totalPlayers: players.length,
        activeTournaments: tournaments.filter((t: any) => t.status === 'in_progress').length,
      })

      setLiveMatches(live.slice(0, 3))
      setUpcomingMatches(upcoming.slice(0, 5))
      setRecentMatches(completed.slice(0, 5))
      setTopPlayers(topPlayersData)
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Hero — full-bleed cinematic banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          'relative overflow-hidden rounded-3xl border shadow-xl p-6 md:p-8',
          // Emerald base sits behind the image so the card never shows a
          // white flash while the photo loads or if it fails to load.
          'bg-emerald-950 text-white isolate',
        )}
      >
        {/* Full-bleed batsman photo as the hero background. */}
        <img
          src={crickterBanner}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Single, uniform dark scrim — keeps text legible across the entire
            card without any visible fade band. Slightly stronger on the left
            side where the title sits, lighter on the right where the stat
            cards already have their own frosted backdrop. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-black/55"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-950/60 via-emerald-950/20 to-transparent"
        />

        <div className="relative grid lg:grid-cols-[1fr,auto] gap-6 items-center">
          <div>
            <Badge className="bg-amber-400 text-emerald-950 border-0 hover:bg-amber-400 mb-3">
              <Flame className="h-3 w-3 mr-1" /> Cricket Admin
            </Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Run the season from one <span className="text-amber-300">scoreboard</span>.
            </h1>
            <p className="mt-2 text-emerald-100/85 max-w-2xl">
              Live matches, ball-by-ball scoring, playing XI selection, tournament brackets, standings,
              and statistics — every workflow your feeder team uses in the app, on the web.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => navigate('/matches/create')} size="sm" className="bg-amber-400 text-emerald-950 hover:bg-amber-300">
                <Plus className="mr-2 h-4 w-4" /> New Match
              </Button>
              <Button onClick={() => navigate('/tournaments/create')} size="sm" variant="secondary" className="bg-white/10 border-0 text-white hover:bg-white/20">
                <Trophy className="mr-2 h-4 w-4" /> New Tournament
              </Button>
              <Button onClick={() => navigate('/teams/create')} size="sm" variant="secondary" className="bg-white/10 border-0 text-white hover:bg-white/20">
                <Shield className="mr-2 h-4 w-4" /> New Team
              </Button>
              <Button onClick={() => navigate('/players/register')} size="sm" variant="secondary" className="bg-white/10 border-0 text-white hover:bg-white/20">
                <Users className="mr-2 h-4 w-4" /> Register Player
              </Button>
            </div>
          </div>
          <div className="hidden lg:flex flex-col items-end gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur px-4 py-3 border border-white/15">
              <Activity className="h-5 w-5 text-red-300 animate-pulse" />
              <div>
                <p className="text-xs text-emerald-100/70 uppercase tracking-wider">Live right now</p>
                <p className="text-2xl font-black tabular-nums">{stats.liveMatches}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur px-4 py-3 border border-white/15">
              <Target className="h-5 w-5 text-amber-300" />
              <div>
                <p className="text-xs text-emerald-100/70 uppercase tracking-wider">Active tournaments</p>
                <p className="text-2xl font-black tabular-nums">{stats.activeTournaments}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <GradientStatCard title="Live Matches" value={stats.liveMatches} icon={Activity} lottieAnimation={liveCricketAnimation} trend={{ value: 12, isPositive: true }} onClick={() => navigate('/matches?tab=live')} />
        <GradientStatCard title="Upcoming Matches" value={stats.upcomingMatches} icon={Calendar} onClick={() => navigate('/matches?tab=upcoming')} />
        <GradientStatCard title="Completed Matches" value={stats.completedMatches} icon={Trophy} trend={{ value: 8, isPositive: true }} onClick={() => navigate('/matches?tab=completed')} />
        <GradientStatCard title="Total Teams" value={stats.totalTeams} icon={Shield} onClick={() => navigate('/teams')} />
        <GradientStatCard title="Total Players" value={stats.totalPlayers} icon={Users} svgPath={cricketAnimateSvg} trend={{ value: 15, isPositive: true }} onClick={() => navigate('/players')} />
        <GradientStatCard title="Active Tournaments" value={stats.activeTournaments} icon={Target} svgPath={activeMatchSvg} onClick={() => navigate('/tournaments')} />
      </div>

      {/* Live Now */}
      {liveMatches.length > 0 && (
        <Card className="border-red-500/30 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              Live Now
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/matches?tab=live')}>
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {liveMatches.map((match) => (
                <LiveMatchCard key={match.id} match={match} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Upcoming Matches
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/matches?tab=upcoming')}>
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingMatches.length > 0 ? (
                upcomingMatches.map((match) => <MatchListItem key={match.id} match={match} />)
              ) : (
                <EmptyHint text="No upcoming matches" icon={Calendar} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Recent Results
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/matches?tab=completed')}>
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentMatches.length > 0 ? (
                recentMatches.map((match) => <MatchListItem key={match.id} match={match} showWinner />)
              ) : (
                <EmptyHint text="No completed matches" icon={Trophy} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {topPlayers && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" /> Top Run Scorers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topPlayers.top_run_scorers?.slice(0, 5).map((player: any, index: number) => (
                  <TopPerformerRow
                    key={player.player_id ?? index}
                    rank={index + 1}
                    name={player.player_name}
                    sub={`${player.matches_played ?? 0} matches`}
                    value={player.total_runs}
                    unit="runs"
                    accent="orange"
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-500" /> Top Wicket Takers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topPlayers.top_wicket_takers?.slice(0, 5).map((player: any, index: number) => (
                  <TopPerformerRow
                    key={player.player_id ?? index}
                    rank={index + 1}
                    name={player.player_name}
                    sub={`${player.matches_played ?? 0} matches`}
                    value={player.total_wickets}
                    unit="wkts"
                    accent="purple"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  )
}

function EmptyHint({ text, icon: Icon }: { text: string; icon: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <Icon className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  )
}

function LiveMatchCard({ match }: { match: Match }) {
  const navigate = useNavigate()
  const t1CRR = currentRunRate(match.team1_score, match.team1_overs)
  const t2CRR = currentRunRate(match.team2_score, match.team2_overs)

  return (
    <motion.div whileHover={{ y: -2 }} className="cursor-pointer" onClick={() => navigate(`/matches/${match.id}`)}>
      <Card className="border-red-500/30 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white overflow-hidden">
        <CardContent className="p-4 space-y-3 relative">
          <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />
          <div className="flex items-center justify-between">
            <Badge className="bg-red-500 text-white border-0 hover:bg-red-500 animate-pulse text-[10px]">
              <Activity className="h-2.5 w-2.5 mr-1" /> LIVE
            </Badge>
            <span className="text-[11px] text-emerald-100/70 truncate max-w-[120px]">{match.venue}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TeamCrest name={match.team1_name} logoUrl={match.team1_logo_url} size="xs" />
                <span className="text-sm font-semibold truncate">{match.team1_name}</span>
              </div>
              <span className="text-sm font-bold tabular-nums text-amber-300">
                {match.team1_score}/{match.team1_wickets}
                <span className="text-xs text-emerald-100/70 ml-1">({match.team1_overs.toFixed(1)})</span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TeamCrest name={match.team2_name} logoUrl={match.team2_logo_url} size="xs" />
                <span className="text-sm font-semibold truncate">{match.team2_name}</span>
              </div>
              <span className="text-sm font-bold tabular-nums text-amber-300">
                {match.team2_score}/{match.team2_wickets}
                <span className="text-xs text-emerald-100/70 ml-1">({match.team2_overs.toFixed(1)})</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-emerald-100/80 pt-1 border-t border-white/10">
            <span>CRR T1 <strong className="text-white">{t1CRR}</strong></span>
            <span>CRR T2 <strong className="text-white">{t2CRR}</strong></span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function MatchListItem({ match, showWinner }: { match: Match; showWinner?: boolean }) {
  const navigate = useNavigate()
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors group"
      onClick={() => navigate(`/matches/${match.id}`)}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex -space-x-1.5">
          <TeamCrest name={match.team1_name} size="xs" className="ring-2 ring-background" />
          <TeamCrest name={match.team2_name} size="xs" className="ring-2 ring-background" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{match.team1_name} vs {match.team2_name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{match.venue}</p>
        </div>
      </div>
      <div className="text-right ml-2 flex-shrink-0">
        {showWinner && match.winner ? (
          <Badge variant="outline" className="text-[10px]">🏆 {match.winner}</Badge>
        ) : (
          <p className="text-[11px] text-muted-foreground">{new Date(match.match_date).toLocaleDateString()}</p>
        )}
      </div>
      <Eye className="h-4 w-4 ml-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}

function TopPerformerRow({ rank, name, sub, value, unit, accent }: { rank: number; name: string; sub: string; value: number; unit: string; accent: 'orange' | 'purple' }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
  const accentClasses = accent === 'orange'
    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {medal ? (
          <span className="text-2xl">{medal}</span>
        ) : (
          <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold', accentClasses)}>
            {rank}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold tabular-nums">{value}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{unit}</p>
      </div>
    </div>
  )
}
