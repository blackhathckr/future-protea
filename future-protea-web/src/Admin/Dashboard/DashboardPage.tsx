/**
 * @fileoverview Cricket Admin Dashboard
 * @module Admin/Dashboard
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, Calendar, Trophy, Shield, Users, Target, Plus, TrendingUp, Zap, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { GradientStatCard } from './components/GradientStatCard'
import liveCricketAnimation from './assets/live_cricket.json'
import cricketAnimateSvg from './assets/cricket-animate.svg'
import activeMatchSvg from './assets/active_match.svg'
import { MatchService, type Match } from '@/services/cricket/match.service'
import { TournamentService } from '@/services/cricket/tournament.service'
import { TeamService } from '@/services/cricket/team.service'
import { PlayerService } from '@/services/cricket/player.service'
import { toast } from 'sonner'

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
      const [
        live,
        upcoming,
        completed,
        teams,
        players,
        tournaments,
        topPlayersData,
      ] = await Promise.all([
        MatchService.getMatches('live'),
        MatchService.getMatches('upcoming'),
        MatchService.getMatches('completed'),
        TeamService.getTeams(),
        PlayerService.getPlayers(),
        TournamentService.getTournaments(),
        PlayerService.getTopPlayers().catch(() => null),
      ])

      setStats({
        liveMatches: live.length,
        upcomingMatches: upcoming.length,
        completedMatches: completed.length,
        totalTeams: teams.length,
        totalPlayers: players.length,
        activeTournaments: tournaments.filter(t => t.status === 'in_progress').length,
      })

      setLiveMatches(live.slice(0, 3))
      setUpcomingMatches(upcoming.slice(0, 5))
      setRecentMatches(completed.slice(0, 5))
      setTopPlayers(topPlayersData)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Cricket Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time match and player analytics</p>
      </div>

      {/* Cricket-Themed Gradient Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <GradientStatCard
          title="Live Matches"
          value={stats.liveMatches}
          icon={Activity}
          lottieAnimation={liveCricketAnimation}
          trend={{ value: 12, isPositive: true }}
          onClick={() => navigate('/matches?tab=live')}
        />
        <GradientStatCard
          title="Upcoming Matches"
          value={stats.upcomingMatches}
          icon={Calendar}
          onClick={() => navigate('/matches?tab=upcoming')}
        />
        <GradientStatCard
          title="Completed Matches"
          value={stats.completedMatches}
          icon={Trophy}
          trend={{ value: 8, isPositive: true }}
          onClick={() => navigate('/matches?tab=completed')}
        />
        <GradientStatCard
          title="Total Teams"
          value={stats.totalTeams}
          icon={Shield}
          onClick={() => navigate('/teams')}
        />
        <GradientStatCard
          title="Total Players"
          value={stats.totalPlayers}
          icon={Users}
          svgPath={cricketAnimateSvg}
          trend={{ value: 15, isPositive: true }}
          onClick={() => navigate('/players')}
        />
        <GradientStatCard
          title="Active Tournaments"
          value={stats.activeTournaments}
          icon={Target}
          svgPath={activeMatchSvg}
          onClick={() => navigate('/tournaments')}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button onClick={() => navigate('/matches/create')} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              New Match
            </Button>
            <Button onClick={() => navigate('/tournaments/create')} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              New Tournament
            </Button>
            <Button onClick={() => navigate('/teams/create')} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              New Team
            </Button>
            <Button onClick={() => navigate('/players/register')} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Register Player
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-600" />
              Live Now
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/matches?tab=live')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {liveMatches.map((match) => (
                <LiveMatchCard key={match.id} match={match} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Matches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Matches</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/matches?tab=upcoming')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingMatches.length > 0 ? (
                upcomingMatches.map((match) => (
                  <MatchListItem key={match.id} match={match} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming matches</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Results</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/matches?tab=completed')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentMatches.length > 0 ? (
                recentMatches.map((match) => (
                  <MatchListItem key={match.id} match={match} showWinner />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No completed matches</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {topPlayers && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Run Scorers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPlayers.top_run_scorers?.slice(0, 5).map((player: any, index: number) => (
                  <div key={player.player_id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{player.player_name}</p>
                        <p className="text-sm text-muted-foreground">{player.matches_played} matches</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold">{player.total_runs}</p>
                      <p className="text-sm text-muted-foreground">runs</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Wicket Takers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPlayers.top_wicket_takers?.slice(0, 5).map((player: any, index: number) => (
                  <div key={player.player_id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{player.player_name}</p>
                        <p className="text-sm text-muted-foreground">{player.matches_played} matches</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold">{player.total_wickets}</p>
                      <p className="text-sm text-muted-foreground">wickets</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  )
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bgColor, 
  onClick 
}: { 
  title: string
  value: number
  icon: any
  color: string
  bgColor: string
  onClick?: () => void
}) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Live Match Card Component
function LiveMatchCard({ match }: { match: Match }) {
  const navigate = useNavigate()
  
  return (
    <div 
      className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
      onClick={() => navigate(`/matches/${match.id}`)}
    >
      <div className="flex items-center justify-between mb-3">
        <Badge variant="destructive" className="animate-pulse">
          <Activity className="h-3 w-3 mr-1" />
          LIVE
        </Badge>
        <span className="text-sm text-muted-foreground">{match.venue}</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{match.team1_name}</span>
          <span className="font-bold">
            {match.team1_score}/{match.team1_wickets} ({match.team1_overs})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{match.team2_name}</span>
          <span className="font-bold">
            {match.team2_score}/{match.team2_wickets} ({match.team2_overs})
          </span>
        </div>
      </div>
    </div>
  )
}

// Match List Item Component
function MatchListItem({ match, showWinner }: { match: Match; showWinner?: boolean }) {
  const navigate = useNavigate()
  
  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
      onClick={() => navigate(`/matches/${match.id}`)}
    >
      <div className="flex-1">
        <p className="font-medium text-sm">{match.team1_name} vs {match.team2_name}</p>
        <p className="text-xs text-muted-foreground">{match.venue}</p>
      </div>
      <div className="text-right">
        {showWinner && match.winner ? (
          <Badge variant="outline">{match.winner} won</Badge>
        ) : (
          <p className="text-xs text-muted-foreground">
            {new Date(match.match_date).toLocaleDateString()}
          </p>
        )}
      </div>
      <Eye className="h-4 w-4 ml-2 text-muted-foreground" />
    </div>
  )
}
