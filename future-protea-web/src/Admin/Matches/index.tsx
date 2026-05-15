/**
 * @fileoverview Match Management Page
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Eye, Edit, Trash2, Activity, Calendar, Trophy, Radio } from 'lucide-react'
import { MatchService, type Match } from '@/services/cricket/match.service'
import { PageHero } from '@/components/cricket/PageHero'
import { TeamCrest } from '@/components/cricket/TeamCrest'
import { currentRunRate } from '@/lib/cricket-utils'
import { toast } from 'sonner'
import { confirm } from '@/lib/confirm'
import { cn } from '@/lib/utils'

export function MatchesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [completedMatches, setCompletedMatches] = useState<Match[]>([])
  const activeTab = searchParams.get('tab') || 'live'

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    try {
      setLoading(true)
      const [live, upcoming, completed] = await Promise.all([
        MatchService.getMatches('live'),
        MatchService.getMatches('upcoming'),
        MatchService.getMatches('completed'),
      ])
      setLiveMatches(live)
      setUpcomingMatches(upcoming)
      setCompletedMatches(completed)
    } catch {
      toast.error('Failed to load matches')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete this match?', confirmLabel: 'Delete' })
    if (!ok) return
    try {
      await MatchService.deleteMatch(id)
      toast.success('Match deleted')
      loadMatches()
    } catch {
      toast.error('Failed to delete match')
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
      <PageHero
        title="Matches"
        description={`${liveMatches.length} live · ${upcomingMatches.length} upcoming · ${completedMatches.length} completed`}
        icon={Activity}
        variant="slate"
        actions={
          <Button
            onClick={() => navigate('/matches/create')}
            className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/30"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Match
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })}>
        <TabsList className="grid w-full md:max-w-md grid-cols-3">
          <TabsTrigger value="live" className="gap-1.5">
            <Activity className="h-4 w-4" /> Live ({liveMatches.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-1.5">
            <Calendar className="h-4 w-4" /> Upcoming ({upcomingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">
            <Trophy className="h-4 w-4" /> Completed ({completedMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4 mt-4">
          {liveMatches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {liveMatches.map((m) => <MatchCard key={m.id} match={m} onDelete={handleDelete} />)}
            </div>
          ) : <EmptyState icon={Activity} text="No live matches" />}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {upcomingMatches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingMatches.map((m) => <MatchCard key={m.id} match={m} onDelete={handleDelete} />)}
            </div>
          ) : <EmptyState icon={Calendar} text="No upcoming matches" />}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedMatches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {completedMatches.map((m) => <MatchCard key={m.id} match={m} onDelete={handleDelete} />)}
            </div>
          ) : <EmptyState icon={Trophy} text="No completed matches" />}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-12 w-12 text-muted-foreground/60 mb-3" />
        <p className="text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}

function MatchCard({ match, onDelete }: { match: Match; onDelete: (id: string) => void }) {
  const navigate = useNavigate()
  const isLive = match.status === 'live'
  const isCompleted = match.status === 'completed'
  const t1CRR = currentRunRate(match.team1_score, match.team1_overs)
  const t2CRR = currentRunRate(match.team2_score, match.team2_overs)

  return (
    <motion.div whileHover={{ y: -2 }}>
      <Card
        className={cn(
          'overflow-hidden cursor-pointer transition-shadow hover:shadow-lg',
          isLive && 'border-red-500/40 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white',
        )}
        onClick={() => navigate(`/matches/${match.id}`)}
      >
        <CardContent className={cn('p-5 space-y-3 relative', isLive && 'text-white')}>
          {isLive && <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-400/15 blur-3xl" />}

          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-2">
              {isLive ? (
                <Badge className="bg-red-500 hover:bg-red-500 text-white border-0 animate-pulse">
                  <Activity className="h-3 w-3 mr-1" /> LIVE
                </Badge>
              ) : isCompleted ? (
                <Badge variant="outline">COMPLETED</Badge>
              ) : (
                <Badge variant="secondary">UPCOMING</Badge>
              )}
              <span className={cn('text-xs', isLive ? 'text-emerald-100/80' : 'text-muted-foreground')}>
                {match.venue} · {match.total_overs} ov
              </span>
            </div>
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className={cn('h-8 w-8', isLive && 'text-white hover:bg-white/10')} onClick={() => navigate(`/matches/${match.id}`)}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
              {isLive && (
                <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => navigate(`/matches/${match.id}/score`)}>
                  <Radio className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button size="icon" variant="ghost" className={cn('h-8 w-8', isLive && 'text-white hover:bg-white/10')} onClick={() => navigate(`/matches/${match.id}/edit`)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className={cn('h-8 w-8', isLive ? 'text-red-300 hover:bg-white/10' : 'text-red-500')} onClick={() => onDelete(match.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 relative">
            <ScoreRow name={match.team1_name} logo={match.team1_logo_url} score={match.team1_score} wickets={match.team1_wickets} overs={match.team1_overs} hideScore={!isLive && !isCompleted} accent={isLive ? 'amber' : 'default'} />
            <ScoreRow name={match.team2_name} logo={match.team2_logo_url} score={match.team2_score} wickets={match.team2_wickets} overs={match.team2_overs} hideScore={!isLive && !isCompleted} accent={isLive ? 'amber' : 'default'} />
          </div>

          {(isLive || isCompleted) && (
            <div className={cn('flex items-center justify-between text-[11px] pt-2 border-t', isLive ? 'border-white/10 text-emerald-100/80' : 'border-border text-muted-foreground')}>
              <span>CRR T1 <strong className={isLive ? 'text-white' : 'text-foreground'}>{t1CRR}</strong></span>
              <span>CRR T2 <strong className={isLive ? 'text-white' : 'text-foreground'}>{t2CRR}</strong></span>
              {match.winner && (
                <Badge className="bg-amber-400 text-emerald-950 hover:bg-amber-400 text-[10px]">🏆 {match.winner}</Badge>
              )}
            </div>
          )}

          {!isLive && !isCompleted && (
            <p className={cn('text-xs', isLive ? 'text-emerald-100/80' : 'text-muted-foreground')}>
              {new Date(match.match_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ScoreRow({ name, logo, score, wickets, overs, hideScore, accent }: { name: string; logo?: string | null; score: number; wickets: number; overs: number; hideScore?: boolean; accent: 'amber' | 'default' }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <TeamCrest name={name} logoUrl={logo} size="xs" />
        <span className="font-semibold truncate text-sm">{name}</span>
      </div>
      {!hideScore && (
        <span className={cn('font-bold tabular-nums text-sm', accent === 'amber' && 'text-amber-300')}>
          {score}/{wickets} <span className="text-xs opacity-80">({overs.toFixed(1)})</span>
        </span>
      )}
    </div>
  )
}
