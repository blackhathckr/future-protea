/**
 * @fileoverview Player Journey — career stats + per-match history.
 * Backed by GET /players/:id/journey.
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, User2, Trophy, Activity, Edit } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHero } from '@/components/cricket/PageHero'
import { PlayerService, type PlayerJourney } from '@/services/cricket/player.service'
import { TeamCrest } from '@/components/cricket/TeamCrest'
import { toast } from 'sonner'
import { strikeRate, economyRate } from '@/lib/cricket-utils'
import { cn } from '@/lib/utils'

export function PlayerJourneyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<PlayerJourney | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) load(id) }, [id])

  const load = async (pid: string) => {
    try {
      setLoading(true)
      const journey = await PlayerService.getPlayerJourney(pid)
      setData(journey)
    } catch {
      toast.error('Failed to load player journey')
      navigate('/players')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const { player, career_stats: stats, matches } = data

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/players')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Player journey</p>
          <h1 className="text-xl font-bold truncate">{player.name}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/players/${id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" /> Edit
        </Button>
      </div>

      <PageHero
        title={player.name}
        description={[player.batting_style, player.bowling_style].filter(Boolean).join(' · ') || 'Career across every recorded match.'}
        icon={User2}
        variant="blue"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Matches" value={stats.total_matches} />
        <StatTile label="Runs" value={stats.total_runs} accent="text-blue-600" />
        <StatTile label="Highest" value={stats.highest_score} />
        <StatTile label="50s / 100s" value={`${stats.fifties} / ${stats.hundreds}`} />
        <StatTile label="SR" value={stats.strike_rate} />
        <StatTile label="Avg" value={stats.batting_average} />
        <StatTile label="Wickets" value={stats.total_wickets} accent="text-purple-600" />
        <StatTile label="Best" value={stats.best_bowling || '—'} />
      </div>

      <Tabs defaultValue="batting">
        <TabsList>
          <TabsTrigger value="batting" className="gap-1.5"><Trophy className="h-4 w-4" /> Batting</TabsTrigger>
          <TabsTrigger value="bowling" className="gap-1.5"><Activity className="h-4 w-4" /> Bowling</TabsTrigger>
        </TabsList>
        <TabsContent value="batting" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Per-match batting</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                    <tr>
                      <th className="text-left p-2.5">Match</th>
                      <th className="text-left p-2.5">Date</th>
                      <th className="text-center p-2.5">R</th>
                      <th className="text-center p-2.5">B</th>
                      <th className="text-center p-2.5">4s</th>
                      <th className="text-center p-2.5">6s</th>
                      <th className="text-right p-2.5">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.filter((m) => m.balls_faced > 0).map((m) => (
                      <tr key={m.id} className="border-t hover:bg-accent/50 cursor-pointer" onClick={() => navigate(`/matches/${m.match_id}`)}>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <TeamCrest name={m.team1_name} size="xs" />
                            <span className="text-xs">vs</span>
                            <TeamCrest name={m.team2_name} size="xs" />
                            <span className="text-xs truncate">{m.team1_name} v {m.team2_name}</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-xs text-muted-foreground">{new Date(m.match_date).toLocaleDateString()}</td>
                        <td className={cn('text-center p-2.5 tabular-nums font-semibold', m.runs_scored >= 50 && 'text-emerald-600')}>{m.runs_scored}</td>
                        <td className="text-center p-2.5 tabular-nums">{m.balls_faced}</td>
                        <td className="text-center p-2.5 tabular-nums">{m.fours}</td>
                        <td className="text-center p-2.5 tabular-nums">{m.sixes}</td>
                        <td className="text-right p-2.5 tabular-nums">{strikeRate(m.runs_scored, m.balls_faced).toFixed(1)}</td>
                      </tr>
                    ))}
                    {matches.filter((m) => m.balls_faced > 0).length === 0 && (
                      <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">No batting history yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bowling" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Per-match bowling</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                    <tr>
                      <th className="text-left p-2.5">Match</th>
                      <th className="text-left p-2.5">Date</th>
                      <th className="text-center p-2.5">O</th>
                      <th className="text-center p-2.5">R</th>
                      <th className="text-center p-2.5">W</th>
                      <th className="text-right p-2.5">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.filter((m) => m.overs_bowled > 0).map((m) => (
                      <tr key={m.id} className="border-t hover:bg-accent/50 cursor-pointer" onClick={() => navigate(`/matches/${m.match_id}`)}>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <TeamCrest name={m.team1_name} size="xs" />
                            <span className="text-xs">vs</span>
                            <TeamCrest name={m.team2_name} size="xs" />
                            <span className="text-xs truncate">{m.team1_name} v {m.team2_name}</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-xs text-muted-foreground">{new Date(m.match_date).toLocaleDateString()}</td>
                        <td className="text-center p-2.5 tabular-nums">{m.overs_bowled.toFixed(1)}</td>
                        <td className="text-center p-2.5 tabular-nums">{m.runs_conceded}</td>
                        <td className={cn('text-center p-2.5 tabular-nums font-semibold', m.wickets_taken >= 3 && 'text-emerald-600')}>{m.wickets_taken}</td>
                        <td className="text-right p-2.5 tabular-nums">{economyRate(m.runs_conceded, m.overs_bowled).toFixed(2)}</td>
                      </tr>
                    ))}
                    {matches.filter((m) => m.overs_bowled > 0).length === 0 && (
                      <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No bowling history yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn('mt-1 text-2xl font-black tabular-nums', accent)}>{value}</p>
      </CardContent>
    </Card>
  )
}

void Badge
