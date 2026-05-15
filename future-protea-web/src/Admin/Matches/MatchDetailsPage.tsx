/**
 * @fileoverview Match Details Page — Scoreboard / Scorecard / Balls / Stats / Stars
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Edit, Trash2, Activity, ListChecks, BarChart3, Star, ClipboardList,
  Coins, Users2, Radio,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MatchService, type Match } from '@/services/cricket/match.service'
import { ScoringService } from '@/services/cricket/scoring.service'
import type { Ball, Scorecard, BattingScore, BowlingScore } from '@/types/cricket.types'
import { ScoreHero } from '@/components/cricket/ScoreHero'
import { LiveScoreboard, type BatsmanState, type BowlerState } from '@/components/cricket/LiveScoreboard'
import { BallBadge } from '@/components/cricket/BallBadge'
import { TeamCrest } from '@/components/cricket/TeamCrest'
import { useLiveMatchStream } from '@/hooks/useLiveMatchStream'
import { toast } from 'sonner'
import { confirm } from '@/lib/confirm'
import { ballLabel, strikeRate, economyRate, formatOvers, initialsOf } from '@/lib/cricket-utils'
import { cn } from '@/lib/utils'

export function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [match, setMatch] = useState<Match | null>(null)
  const [scorecard, setScorecard] = useState<Scorecard | null>(null)
  const [balls, setBalls] = useState<Ball[]>([])

  useEffect(() => {
    if (id) loadAll(id)
  }, [id])

  const loadAll = async (matchId: string) => {
    try {
      setLoading(true)
      const m = await MatchService.getMatchById(matchId)
      setMatch(m)
      const [sc, bs] = await Promise.all([
        ScoringService.getScorecard(matchId).catch(() => null),
        ScoringService.getBalls(matchId).catch(() => []),
      ])
      if (sc) setScorecard(sc)
      setBalls(bs)
    } catch {
      toast.error('Failed to load match details')
      navigate('/matches')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    const ok = await confirm({ title: 'Delete this match?', description: 'All ball-by-ball data, scorecards, and analytics will be removed.', confirmLabel: 'Delete' })
    if (!ok) return
    try {
      await MatchService.deleteMatch(id)
      toast.success('Match deleted')
      navigate('/matches')
    } catch {
      toast.error('Failed to delete match')
    }
  }

  // Auto-refresh on every live update
  useLiveMatchStream(match?.status === 'live' ? id : null, () => {
    if (id) {
      Promise.all([
        MatchService.getMatchById(id).catch(() => null),
        ScoringService.getScorecard(id).catch(() => null),
        ScoringService.getBalls(id).catch(() => []),
      ]).then(([m, sc, bs]) => {
        if (m) setMatch(m)
        if (sc) setScorecard(sc)
        setBalls(bs)
      })
    }
  })

  // Derive live state from latest ball + scorecard
  const derived = useMemo(() => deriveLiveState(match, balls, scorecard), [match, balls, scorecard])

  if (loading || !match) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/matches')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Match details</p>
          <h1 className="text-xl font-bold truncate">{match.team1_name} vs {match.team2_name}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {match.status === 'upcoming' && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate(`/matches/${match.id}/playing-xi`)}>
                <Users2 className="h-4 w-4 mr-2" /> Playing XI
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/matches/${match.id}/toss`)}>
                <Coins className="h-4 w-4 mr-2" /> Toss
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate(`/matches/${match.id}/start`)}>
                <Activity className="h-4 w-4 mr-2" /> Start Match
              </Button>
            </>
          )}
          {match.status === 'live' && (
            <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => navigate(`/matches/${match.id}/score`)}>
              <Radio className="h-4 w-4 mr-2" /> Live Scoring
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate(`/matches/${match.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScoreHero match={match} team1Logo={match.team1_logo_url} team2Logo={match.team2_logo_url} />

      {/* Live scoreboard (striker, non-striker, bowler) */}
      <LiveScoreboard
        striker={derived.striker}
        nonStriker={derived.nonStriker}
        bowler={derived.bowler}
        currentOverBalls={derived.currentOverBalls}
        partnership={derived.partnership}
      />

      {/* Tabs */}
      <Tabs defaultValue="scoreboard" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-1 w-full max-w-3xl">
          <TabsTrigger value="scoreboard" className="gap-1.5"><Activity className="h-4 w-4" /><span className="hidden sm:inline">Scoreboard</span></TabsTrigger>
          <TabsTrigger value="scorecard" className="gap-1.5"><ListChecks className="h-4 w-4" /><span className="hidden sm:inline">Scorecard</span></TabsTrigger>
          <TabsTrigger value="balls" className="gap-1.5"><ClipboardList className="h-4 w-4" /><span className="hidden sm:inline">Balls</span></TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5"><BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">Stats</span></TabsTrigger>
          <TabsTrigger value="stars" className="gap-1.5"><Star className="h-4 w-4" /><span className="hidden sm:inline">Stars</span></TabsTrigger>
        </TabsList>

        <TabsContent value="scoreboard" className="mt-6 space-y-6">
          <ScoreboardTab match={match} scorecard={scorecard} balls={balls} />
        </TabsContent>

        <TabsContent value="scorecard" className="mt-6 space-y-6">
          <ScorecardTab match={match} scorecard={scorecard} />
        </TabsContent>

        <TabsContent value="balls" className="mt-6 space-y-4">
          <BallsTab balls={balls} />
        </TabsContent>

        <TabsContent value="stats" className="mt-6 space-y-4">
          <StatsTab match={match} scorecard={scorecard} balls={balls} />
        </TabsContent>

        <TabsContent value="stars" className="mt-6 space-y-4">
          <StarsTab scorecard={scorecard} />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Live state derivation
// ─────────────────────────────────────────────────────────────────────────────

function deriveLiveState(match: Match | null, balls: Ball[], scorecard: Scorecard | null): {
  striker: BatsmanState | null
  nonStriker: BatsmanState | null
  bowler: BowlerState | null
  currentOverBalls: Ball[]
  partnership: { runs: number; balls: number } | null
} {
  if (!match || balls.length === 0) {
    return { striker: null, nonStriker: null, bowler: null, currentOverBalls: [], partnership: null }
  }

  const inningsNo = match.current_innings ?? 1
  const inningsBalls = balls.filter((b) => b.innings === inningsNo && b.is_active)
  const last = inningsBalls[inningsBalls.length - 1]

  const currentOverNo = last?.over_number ?? 0
  const currentOverBalls = inningsBalls.filter((b) => b.over_number === currentOverNo)

  const strikerId = last?.batsman_id ?? null
  const nonStrikerId = last?.non_striker_id ?? null
  const bowlerId = last?.bowler_id ?? null

  const battingFor = (pid: string | null): BatsmanState | null => {
    if (!pid) return null
    const bs: BattingScore | undefined = scorecard?.batting?.find((b) => b.player_id === pid)
    if (bs) {
      return { id: bs.player_id, name: bs.name, runs: bs.runs_scored, balls: bs.balls_faced, fours: bs.fours, sixes: bs.sixes }
    }
    // Fallback: aggregate from balls
    const ballsForPlayer = inningsBalls.filter((b) => b.batsman_id === pid)
    const runs = ballsForPlayer.reduce((s, b) => s + (b.is_wide || b.is_bye || b.is_legbye ? 0 : b.runs), 0)
    const ballsFaced = ballsForPlayer.filter((b) => !b.is_wide).length
    const fours = ballsForPlayer.filter((b) => b.runs === 4 && !b.is_wide && !b.is_bye && !b.is_legbye).length
    const sixes = ballsForPlayer.filter((b) => b.runs === 6 && !b.is_wide && !b.is_bye && !b.is_legbye).length
    return { id: pid, name: last?.batsman_name ?? null, runs, balls: ballsFaced, fours, sixes }
  }

  const bowlingFor = (pid: string | null): BowlerState | null => {
    if (!pid) return null
    const bs: BowlingScore | undefined = scorecard?.bowling?.find((b) => b.player_id === pid)
    if (bs) {
      return { id: bs.player_id, name: bs.name, overs: bs.overs_bowled, runs: bs.runs_conceded, wickets: bs.wickets_taken, maidens: bs.maidens }
    }
    const ballsForBowler = inningsBalls.filter((b) => b.bowler_id === pid)
    const legalBalls = ballsForBowler.filter((b) => !b.is_wide && !b.is_noball).length
    const runs = ballsForBowler.reduce((s, b) => s + b.runs + b.extras, 0)
    const wickets = ballsForBowler.filter((b) => b.is_wicket && b.wicket_type !== 'run_out').length
    return {
      id: pid,
      name: last?.bowler_name ?? null,
      overs: Number(formatOvers(legalBalls)),
      runs,
      wickets,
      maidens: 0,
    }
  }

  // Partnership: from the most recent wicket (or innings start) to now
  let partnershipStart = 0
  for (let i = inningsBalls.length - 1; i >= 0; i--) {
    if (inningsBalls[i]!.is_wicket) {
      partnershipStart = i + 1
      break
    }
  }
  const partnershipBalls = inningsBalls.slice(partnershipStart)
  const partnership = {
    runs: partnershipBalls.reduce((s, b) => s + b.runs + b.extras, 0),
    balls: partnershipBalls.filter((b) => !b.is_wide && !b.is_noball).length,
  }

  return {
    striker: battingFor(strikerId),
    nonStriker: battingFor(nonStrikerId),
    bowler: bowlingFor(bowlerId),
    currentOverBalls,
    partnership,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoreboard Tab — Match info + overview cards
// ─────────────────────────────────────────────────────────────────────────────

function ScoreboardTab({ match, scorecard, balls }: { match: Match; scorecard: Scorecard | null; balls: Ball[] }) {
  const t1Innings = scorecard?.innings?.find((i) => i.innings_number === 1)
  const t2Innings = scorecard?.innings?.find((i) => i.innings_number === 2)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Match Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Venue" value={match.venue || 'Not specified'} />
          <Row label="Date" value={new Date(match.match_date).toLocaleString()} />
          <Row label="Total Overs" value={String(match.total_overs)} />
          <Row label="Status" value={match.status.replace('_', ' ')} className="capitalize" />
          {match.toss_winner && (
            <Row label="Toss" value={`${match.toss_winner} — chose to ${match.toss_decision ?? '—'}`} />
          )}
          {match.winner && <Row label="Winner" value={match.winner} className="text-emerald-600 font-semibold" />}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Innings Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InningsBlock title={match.team1_name} innings={t1Innings} score={match.team1_score} wickets={match.team1_wickets} overs={match.team1_overs} />
          <InningsBlock title={match.team2_name} innings={t2Innings} score={match.team2_score} wickets={match.team2_wickets} overs={match.team2_overs} />
        </CardContent>
      </Card>

      {balls.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Most Recent Over</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentOverStrip balls={balls} match={match} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-semibold text-right', className)}>{value}</span>
    </div>
  )
}

function InningsBlock({ title, innings, score, wickets, overs }: { title: string; innings: any; score: number; wickets: number; overs: number }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <TeamCrest name={title} size="sm" />
          <p className="font-semibold truncate">{title}</p>
        </div>
        <p className="text-2xl font-black tabular-nums">{score}/{wickets} <span className="text-sm text-muted-foreground">({overs.toFixed(1)})</span></p>
      </div>
      {innings?.extras && (
        <p className="text-xs text-muted-foreground">
          Extras: <strong className="text-foreground">{innings.extras.total}</strong>
          {innings.extras.wides ? <> · w {innings.extras.wides}</> : null}
          {innings.extras.noballs ? <> · nb {innings.extras.noballs}</> : null}
          {innings.extras.byes ? <> · b {innings.extras.byes}</> : null}
          {innings.extras.legbyes ? <> · lb {innings.extras.legbyes}</> : null}
        </p>
      )}
    </div>
  )
}

function RecentOverStrip({ balls, match }: { balls: Ball[]; match: Match }) {
  const inningsNo = match.current_innings ?? 1
  const inningsBalls = balls.filter((b) => b.innings === inningsNo && b.is_active)
  if (inningsBalls.length === 0) return <p className="text-sm text-muted-foreground">No balls bowled yet</p>
  const lastOverNo = inningsBalls[inningsBalls.length - 1]!.over_number
  const overBalls = inningsBalls.filter((b) => b.over_number === lastOverNo)
  const totalRuns = overBalls.reduce((s, b) => s + b.runs + b.extras, 0)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Over {lastOverNo + 1}</p>
        <p className="text-sm text-muted-foreground">{overBalls[0]?.bowler_name ?? '—'}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {overBalls.map((b, i) => <BallBadge key={b.id} label={ballLabel(b)} delay={i * 0.05} />)}
      </div>
      <Badge variant="outline" className="text-sm font-bold">{totalRuns} runs</Badge>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Scorecard Tab
// ─────────────────────────────────────────────────────────────────────────────

function ScorecardTab({ match, scorecard }: { match: Match; scorecard: Scorecard | null }) {
  if (!scorecard) {
    return <EmptyCard title="No scorecard yet" body="The scorecard will appear once balls are recorded." />
  }
  const innings = scorecard.innings ?? []
  const t1 = scorecard.batting?.filter((b) => b.team === match.team1_name) ?? []
  const t2 = scorecard.batting?.filter((b) => b.team === match.team2_name) ?? []
  const t1Bowl = scorecard.bowling?.filter((b) => b.team === match.team2_name) ?? []
  const t2Bowl = scorecard.bowling?.filter((b) => b.team === match.team1_name) ?? []

  return (
    <div className="space-y-6">
      {[
        { label: match.team1_name, batting: t1, bowling: t1Bowl, innings: innings.find((i) => i.innings_number === 1) },
        { label: match.team2_name, batting: t2, bowling: t2Bowl, innings: innings.find((i) => i.innings_number === 2) },
      ].map((side) => (
        <Card key={side.label}>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TeamCrest name={side.label} size="sm" /> {side.label}
              </CardTitle>
              {side.innings && (
                <span className="text-lg font-bold tabular-nums">
                  {side.innings.total_runs}/{side.innings.total_wickets}
                  <span className="text-sm text-muted-foreground ml-1">({side.innings.total_overs.toFixed(1)})</span>
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <BattingTable batting={side.batting} />
            <BowlingTable bowling={side.bowling} />
            {side.innings && side.innings.extras.total > 0 && (
              <p className="text-xs text-muted-foreground">
                Extras: <strong className="text-foreground">{side.innings.extras.total}</strong>
                {side.innings.extras.wides ? <> · w {side.innings.extras.wides}</> : null}
                {side.innings.extras.noballs ? <> · nb {side.innings.extras.noballs}</> : null}
                {side.innings.extras.byes ? <> · b {side.innings.extras.byes}</> : null}
                {side.innings.extras.legbyes ? <> · lb {side.innings.extras.legbyes}</> : null}
              </p>
            )}
            {side.innings?.fall_of_wickets && side.innings.fall_of_wickets.length > 0 && (
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Fall of wickets</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {side.innings.fall_of_wickets.map((fow) => (
                    <span key={fow.wicket_number} className="rounded-md bg-background border px-2 py-1">
                      <strong>{fow.runs_at_fall}/{fow.wicket_number}</strong>
                      <span className="text-muted-foreground"> · {fow.batsman_name ?? '—'} ({fow.overs_at_fall.toFixed(1)})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function BattingTable({ batting }: { batting: BattingScore[] }) {
  if (batting.length === 0) {
    return <p className="text-sm text-muted-foreground">Yet to bat</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left p-2.5">Batter</th>
            <th className="text-center p-2.5">R</th>
            <th className="text-center p-2.5">B</th>
            <th className="text-center p-2.5">4s</th>
            <th className="text-center p-2.5">6s</th>
            <th className="text-right p-2.5">SR</th>
          </tr>
        </thead>
        <tbody>
          {batting.map((b) => (
            <tr key={b.id} className="border-t">
              <td className="p-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{b.name}</span>
                  {b.is_captain && <Badge className="bg-emerald-600 hover:bg-emerald-700 text-[10px] h-4 px-1">C</Badge>}
                  {b.is_wicket_keeper && <Badge className="bg-blue-600 hover:bg-blue-700 text-[10px] h-4 px-1">WK</Badge>}
                </div>
                {b.is_out && b.out_type && (
                  <p className="text-[11px] text-muted-foreground">
                    {b.out_type}{b.dismissed_by ? ` b ${b.dismissed_by}` : ''}
                  </p>
                )}
                {!b.is_out && <p className="text-[11px] text-emerald-600">not out</p>}
              </td>
              <td className="text-center p-2.5 font-bold tabular-nums">{b.runs_scored}</td>
              <td className="text-center p-2.5 tabular-nums">{b.balls_faced}</td>
              <td className="text-center p-2.5 tabular-nums">{b.fours}</td>
              <td className="text-center p-2.5 tabular-nums">{b.sixes}</td>
              <td className="text-right p-2.5 tabular-nums">{strikeRate(b.runs_scored, b.balls_faced).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BowlingTable({ bowling }: { bowling: BowlingScore[] }) {
  if (bowling.length === 0) return null
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left p-2.5">Bowler</th>
            <th className="text-center p-2.5">O</th>
            <th className="text-center p-2.5">M</th>
            <th className="text-center p-2.5">R</th>
            <th className="text-center p-2.5">W</th>
            <th className="text-right p-2.5">Econ</th>
          </tr>
        </thead>
        <tbody>
          {bowling.map((b) => (
            <tr key={b.id} className="border-t">
              <td className="p-2.5 font-semibold">{b.name}</td>
              <td className="text-center p-2.5 tabular-nums">{b.overs_bowled.toFixed(1)}</td>
              <td className="text-center p-2.5 tabular-nums">{b.maidens}</td>
              <td className="text-center p-2.5 tabular-nums">{b.runs_conceded}</td>
              <td className="text-center p-2.5 font-bold tabular-nums">{b.wickets_taken}</td>
              <td className="text-right p-2.5 tabular-nums">{economyRate(b.runs_conceded, b.overs_bowled).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Balls Tab
// ─────────────────────────────────────────────────────────────────────────────

function BallsTab({ balls }: { balls: Ball[] }) {
  if (balls.length === 0) {
    return <EmptyCard title="No balls recorded yet" body="Start live scoring to see ball-by-ball detail here." />
  }

  // Group by innings then over
  const byInnings = balls.reduce<Record<number, Record<number, Ball[]>>>((acc, b) => {
    if (!b.is_active) return acc
    if (!acc[b.innings]) acc[b.innings] = {}
    if (!acc[b.innings]![b.over_number]) acc[b.innings]![b.over_number] = []
    acc[b.innings]![b.over_number]!.push(b)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.keys(byInnings).map((inn) => {
        const overs = byInnings[Number(inn)]!
        return (
          <Card key={inn}>
            <CardHeader>
              <CardTitle className="text-base">Innings {inn}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.keys(overs).sort((a, b) => Number(b) - Number(a)).map((overNo) => {
                const oBalls = overs[Number(overNo)]!
                const totalRuns = oBalls.reduce((s, b) => s + b.runs + b.extras, 0)
                return (
                  <div key={overNo} className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Over {Number(overNo) + 1}</Badge>
                        <span className="text-xs text-muted-foreground">{oBalls[0]?.bowler_name ?? 'Bowler'}</span>
                      </div>
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-xs">{totalRuns} runs</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {oBalls.map((b, i) => (
                        <div key={b.id} className="flex items-center gap-2 rounded-md bg-background border px-2 py-1.5 text-xs">
                          <BallBadge label={ballLabel(b)} size="sm" delay={i * 0.03} />
                          <div className="flex flex-col leading-tight">
                            <span className="font-medium">{b.batsman_name ?? '—'}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {b.over_number}.{b.ball_number}
                              {b.shot_direction ? ` · ${b.shot_direction}` : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {oBalls.some((b) => b.commentary) && (
                      <div className="mt-2 pt-2 border-t space-y-1">
                        {oBalls.filter((b) => b.commentary).map((b) => (
                          <p key={b.id} className="text-[11px] text-muted-foreground italic">
                            <strong className="not-italic text-foreground">{b.over_number}.{b.ball_number}</strong> {b.commentary}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats Tab
// ─────────────────────────────────────────────────────────────────────────────

function StatsTab({ match, scorecard, balls }: { match: Match; scorecard: Scorecard | null; balls: Ball[] }) {
  const allBatting = scorecard?.batting ?? []
  const totalFours = allBatting.reduce((s, b) => s + b.fours, 0)
  const totalSixes = allBatting.reduce((s, b) => s + b.sixes, 0)
  const totalDots = balls.filter((b) => b.is_active && b.runs === 0 && !b.is_wide && !b.is_noball && !b.is_bye && !b.is_legbye).length
  const totalExtras = (scorecard?.innings ?? []).reduce((s, i) => s + i.extras.total, 0)
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatTile label="Fours" value={totalFours} icon="🟦" accent="from-blue-500/10 to-blue-500/5 border-blue-500/20" />
      <StatTile label="Sixes" value={totalSixes} icon="🟪" accent="from-purple-500/10 to-purple-500/5 border-purple-500/20" />
      <StatTile label="Extras" value={totalExtras} icon="⚪" accent="from-amber-500/10 to-amber-500/5 border-amber-500/20" />
      <StatTile label="Dot balls" value={totalDots} icon="⚫" accent="from-zinc-500/10 to-zinc-500/5 border-zinc-500/20" />

      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-base">Run rate snapshot</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <RunRateRow label={match.team1_name} runs={match.team1_score} overs={match.team1_overs} />
          <RunRateRow label={match.team2_name} runs={match.team2_score} overs={match.team2_overs} />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-base">Innings status</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(scorecard?.innings ?? []).map((inn) => (
            <div key={inn.innings_number} className="flex items-center justify-between">
              <span className="text-muted-foreground">Innings {inn.innings_number}</span>
              <Badge variant="outline" className="capitalize">{inn.status}</Badge>
            </div>
          ))}
          {(scorecard?.innings ?? []).length === 0 && (
            <p className="text-muted-foreground">Innings data not yet available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatTile({ label, value, icon, accent }: { label: string; value: number; icon: string; accent: string }) {
  return (
    <Card className={cn('bg-gradient-to-br border', accent)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span className="text-lg">{icon}</span>
        </div>
        <p className="text-3xl font-black tabular-nums mt-2">{value}</p>
      </CardContent>
    </Card>
  )
}

function RunRateRow({ label, runs, overs }: { label: string; runs: number; overs: number }) {
  const crr = overs > 0 ? Number(((runs / (Math.floor(overs) * 6 + Math.round((overs - Math.floor(overs)) * 10))) * 6).toFixed(2)) || 0 : 0
  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
      <span className="font-medium">{label}</span>
      <span className="text-sm tabular-nums"><strong>{runs}/{overs.toFixed(1)}</strong> · CRR <strong>{crr}</strong></span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Stars Tab
// ─────────────────────────────────────────────────────────────────────────────

function StarsTab({ scorecard }: { scorecard: Scorecard | null }) {
  if (!scorecard) {
    return <EmptyCard title="No standout performers yet" body="Top batters and bowlers will appear once data is recorded." />
  }
  const topBat = [...(scorecard.batting ?? [])].sort((a, b) => b.runs_scored - a.runs_scored).slice(0, 5)
  const topBowl = [...(scorecard.bowling ?? [])].sort((a, b) => b.wickets_taken - a.wickets_taken || a.runs_conceded - b.runs_conceded).slice(0, 5)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base">⭐ Top Batters</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {topBat.map((b, i) => (
              <li key={b.id} className="flex items-center gap-3 p-3">
                <RankBadge rank={i + 1} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.balls_faced}b · {b.fours}×4 · {b.sixes}×6 · SR {strikeRate(b.runs_scored, b.balls_faced).toFixed(1)}</p>
                </div>
                <p className="text-2xl font-black tabular-nums">{b.runs_scored}</p>
              </li>
            ))}
            {topBat.length === 0 && <li className="p-4 text-sm text-muted-foreground">No batting data yet.</li>}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base">⭐ Top Bowlers</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {topBowl.map((b, i) => (
              <li key={b.id} className="flex items-center gap-3 p-3">
                <RankBadge rank={i + 1} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.overs_bowled.toFixed(1)}ov · M {b.maidens} · Econ {economyRate(b.runs_conceded, b.overs_bowled).toFixed(2)}</p>
                </div>
                <p className="text-2xl font-black tabular-nums">{b.wickets_taken}<span className="text-base text-muted-foreground">-{b.runs_conceded}</span></p>
              </li>
            ))}
            {topBowl.length === 0 && <li className="p-4 text-sm text-muted-foreground">No bowling data yet.</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
  if (medal) return <span className="text-2xl w-9 text-center">{medal}</span>
  return <div className="h-9 w-9 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">{rank}</div>
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{body}</p>
      </CardContent>
    </Card>
  )
}

// Suppress unused-vars lint for icons used only in nav, not body
void initialsOf
