/**
 * @fileoverview Live Scoring page — ball-by-ball entry.
 * Mirrors the Flutter feeder live_scoring_screen workflow.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Radio, Undo2, ArrowRightLeft, FastForward, AlertTriangle,
  Target, Share2, Donut, X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MatchService, type Match } from '@/services/cricket/match.service'
import { ScoringService } from '@/services/cricket/scoring.service'
import type { Ball, RecordBallPayload, MatchPlayer } from '@/types/cricket.types'
import { ScoreHero } from '@/components/cricket/ScoreHero'
import { LiveScoreboard, type BatsmanState, type BowlerState } from '@/components/cricket/LiveScoreboard'
import { useLiveMatchStream } from '@/hooks/useLiveMatchStream'
import { toast } from 'sonner'
import { SHOT_DIRECTIONS, WICKET_TYPES, ballLabel, formatOvers } from '@/lib/cricket-utils'
import { confirm } from '@/lib/confirm'
import { cn } from '@/lib/utils'

export function LiveScoringPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<MatchPlayer[]>([])
  const [balls, setBalls] = useState<Ball[]>([])

  const [strikerId, setStrikerId] = useState<string>('')
  const [nonStrikerId, setNonStrikerId] = useState<string>('')
  const [bowlerId, setBowlerId] = useState<string>('')

  const [shotDirection, setShotDirection] = useState<string>('')
  const [wicketDialog, setWicketDialog] = useState<{ open: boolean; runs: number }>({ open: false, runs: 0 })
  const [wicketType, setWicketType] = useState<string>('bowled')
  const [fielderId, setFielderId] = useState<string>('')
  const [dismissedBatsman, setDismissedBatsman] = useState<'striker' | 'non_striker'>('striker')
  const [newStrikerId, setNewStrikerId] = useState<string>('')

  useEffect(() => {
    if (id) load(id)
  }, [id])

  const load = async (matchId: string) => {
    try {
      setLoading(true)
      const m = await MatchService.getMatchById(matchId)
      setMatch(m)
      let [bs, ps] = await Promise.all([
        ScoringService.getBalls(matchId).catch(() => []),
        ScoringService.getMatchPlayers(matchId).catch(() => []),
      ])
      // If no match players yet, auto-populate from the team rosters
      if (ps.length === 0) {
        try {
          await ScoringService.populateMatchPlayers(matchId)
          ps = await ScoringService.getMatchPlayers(matchId).catch(() => [])
        } catch {
          // Non-fatal — feeder can still select players manually if rosters exist
        }
      }
      setBalls(bs)
      setPlayers(ps)

      // Pre-fill from last active ball
      const inningsNo = m.current_innings ?? 1
      const last = bs.filter((b) => b.innings === inningsNo && b.is_active).slice(-1)[0]
      if (last) {
        setStrikerId(last.batsman_id ?? '')
        setNonStrikerId(last.non_striker_id ?? '')
        setBowlerId(last.bowler_id ?? '')
      }
    } catch {
      toast.error('Failed to load match')
      navigate('/matches')
    } finally {
      setLoading(false)
    }
  }

  // Refresh match + balls when another scorer records a ball
  useLiveMatchStream(id, () => {
    if (!id) return
    Promise.all([
      MatchService.getMatchById(id).catch(() => null),
      ScoringService.getBalls(id).catch(() => []),
    ]).then(([m, bs]) => {
      if (m) setMatch(m)
      setBalls(bs)
    })
  })

  const inningsNo = match?.current_innings ?? 1
  const inningsBalls = useMemo(() => balls.filter((b) => b.innings === inningsNo && b.is_active), [balls, inningsNo])
  const lastBall = inningsBalls[inningsBalls.length - 1]
  const totalBallsBowled = inningsBalls.filter((b) => !b.is_wide && !b.is_noball).length
  const currentOverNumber = lastBall ? lastBall.over_number : 0
  const currentOverBalls = inningsBalls.filter((b) => b.over_number === currentOverNumber)
  const legalBallsThisOver = currentOverBalls.filter((b) => !b.is_wide && !b.is_noball).length
  const isOverComplete = legalBallsThisOver >= 6
  const nextOverNumber = isOverComplete ? currentOverNumber + 1 : currentOverNumber
  const nextBallNumber = isOverComplete ? 1 : legalBallsThisOver + 1

  const battingTeam = useMemo(() => (match ? (inningsNo === 1 ? match.team1_name : match.team2_name) : ''), [match, inningsNo])
  const bowlingTeam = useMemo(() => (match ? (inningsNo === 1 ? match.team2_name : match.team1_name) : ''), [match, inningsNo])

  const battingPlayers = useMemo(() => players.filter((p) => p.team === battingTeam), [players, battingTeam])
  const bowlingPlayers = useMemo(() => players.filter((p) => p.team === bowlingTeam), [players, bowlingTeam])

  const derived = useMemo(() => {
    const strikerBalls = inningsBalls.filter((b) => b.batsman_id === strikerId && !b.is_wide && !b.is_bye && !b.is_legbye)
    const nonStrikerBalls = inningsBalls.filter((b) => b.batsman_id === nonStrikerId && !b.is_wide && !b.is_bye && !b.is_legbye)
    const bowlerBalls = inningsBalls.filter((b) => b.bowler_id === bowlerId)
    const nameOf = (pid: string) => {
      const p = players.find((q) => q.player_id === pid)
      return p?.name ?? p?.player_name ?? null
    }
    const strikerName = nameOf(strikerId)
    const nonStrikerName = nameOf(nonStrikerId)
    const bowlerName = nameOf(bowlerId)

    const striker: BatsmanState = {
      id: strikerId,
      name: strikerName,
      runs: strikerBalls.reduce((s, b) => s + b.runs, 0),
      balls: strikerBalls.length,
      fours: strikerBalls.filter((b) => b.runs === 4).length,
      sixes: strikerBalls.filter((b) => b.runs === 6).length,
    }
    const nonStriker: BatsmanState = {
      id: nonStrikerId,
      name: nonStrikerName,
      runs: nonStrikerBalls.reduce((s, b) => s + b.runs, 0),
      balls: nonStrikerBalls.length,
      fours: nonStrikerBalls.filter((b) => b.runs === 4).length,
      sixes: nonStrikerBalls.filter((b) => b.runs === 6).length,
    }
    const legalBowlerBalls = bowlerBalls.filter((b) => !b.is_wide && !b.is_noball).length
    const bowler: BowlerState = {
      id: bowlerId,
      name: bowlerName,
      overs: Number(formatOvers(legalBowlerBalls)),
      runs: bowlerBalls.reduce((s, b) => s + b.runs + b.extras, 0),
      wickets: bowlerBalls.filter((b) => b.is_wicket && b.wicket_type !== 'run_out').length,
      maidens: 0,
    }
    return { striker, nonStriker, bowler }
  }, [inningsBalls, strikerId, nonStrikerId, bowlerId, players])

  const ensureSelections = () => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      toast.error('Select striker, non-striker, and bowler first')
      return false
    }
    if (strikerId === nonStrikerId) {
      toast.error('Striker and non-striker must be different')
      return false
    }
    return true
  }

  const submitBall = async (payload: Partial<RecordBallPayload>) => {
    if (!id || !match) return
    if (!ensureSelections()) return
    setSubmitting(true)
    try {
      const body: RecordBallPayload = {
        innings: inningsNo,
        over_number: nextOverNumber,
        ball_number: nextBallNumber,
        batsman_id: strikerId,
        non_striker_id: nonStrikerId,
        bowler_id: bowlerId,
        runs: 0,
        shot_direction: shotDirection || undefined,
        client_ball_id: crypto.randomUUID(),
        ...payload,
      }
      await ScoringService.recordBall(id, body)
      const [m, bs] = await Promise.all([
        MatchService.getMatchById(id),
        ScoringService.getBalls(id).catch(() => []),
      ])
      setMatch(m)
      setBalls(bs)
      setShotDirection('')

      // Swap strike on odd runs (non-wicket, off the bat)
      if ((body.runs ?? 0) % 2 === 1 && !body.is_wide && !body.is_noball && !body.is_wicket) {
        setStrikerId(nonStrikerId)
        setNonStrikerId(strikerId)
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to record ball')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRun = (runs: number) => submitBall({ runs })
  const handleExtra = (type: 'wide' | 'noball' | 'bye' | 'legbye') => {
    const map: Record<typeof type, Partial<RecordBallPayload>> = {
      wide: { is_wide: true, runs: 1 },
      noball: { is_noball: true, runs: 1 },
      bye: { is_bye: true, runs: 1 },
      legbye: { is_legbye: true, runs: 1 },
    }
    submitBall(map[type])
  }

  const openWicket = (runs: number) => setWicketDialog({ open: true, runs })
  const confirmWicket = () => {
    submitBall({
      runs: wicketDialog.runs,
      is_wicket: true,
      wicket_type: wicketType,
      dismissed_by_id: fielderId || undefined,
    })
    setWicketDialog({ open: false, runs: 0 })

    // Bring new striker in
    if (dismissedBatsman === 'striker') {
      setStrikerId(newStrikerId || '')
    } else {
      setNonStrikerId(newStrikerId || '')
    }
    setNewStrikerId('')
    setWicketType('bowled')
    setFielderId('')
  }

  const handleUndo = async () => {
    if (!id) return
    const ok = await confirm({
      title: 'Undo the last ball?',
      description: 'The most recent delivery will be removed and all stats will be recalculated.',
      confirmLabel: 'Undo',
    })
    if (!ok) return
    setSubmitting(true)
    try {
      await ScoringService.deleteLastBall(id)
      const [m, bs] = await Promise.all([
        MatchService.getMatchById(id),
        ScoringService.getBalls(id).catch(() => []),
      ])
      setMatch(m)
      setBalls(bs)
      toast.success('Last ball undone')
    } catch {
      toast.error('Failed to undo')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSwapStrike = () => {
    setStrikerId(nonStrikerId)
    setNonStrikerId(strikerId)
  }

  if (loading || !match) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/matches/${match.id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <Badge className="bg-red-500 text-white border-0 hover:bg-red-500 animate-pulse mb-1">
            <Radio className="h-3 w-3 mr-1" /> LIVE SCORING
          </Badge>
          <h1 className="text-xl font-bold">Innings {inningsNo} · Over {nextOverNumber + 1}.{nextBallNumber}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleUndo}>
          <Undo2 className="h-4 w-4 mr-2" /> Undo
        </Button>
      </div>

      <ScoreHero match={match} team1Logo={match.team1_logo_url} team2Logo={match.team2_logo_url} />

      <LiveScoreboard
        striker={derived.striker}
        nonStriker={derived.nonStriker}
        bowler={derived.bowler}
        currentOverBalls={currentOverBalls}
      />

      {/* Player selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PlayerSelector label="Striker" players={battingPlayers} value={strikerId} onChange={setStrikerId} accent="amber" />
        <PlayerSelector label="Non-Striker" players={battingPlayers} value={nonStrikerId} onChange={setNonStrikerId} accent="muted" />
        <PlayerSelector label="Bowler" players={bowlingPlayers} value={bowlerId} onChange={setBowlerId} accent="red" />
      </div>

      {/* Runs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Record Ball</CardTitle>
            <span className="text-xs text-muted-foreground">{totalBallsBowled} legal balls bowled this innings</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((r) => (
              <Button
                key={r}
                variant="outline"
                disabled={submitting}
                onClick={() => handleRun(r)}
                className={cn(
                  'h-14 text-xl font-black tabular-nums shadow-sm transition-transform active:scale-95',
                  r === 0 && 'bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-700',
                  r === 4 && 'bg-blue-600 text-white hover:bg-blue-700 border-blue-700',
                  r === 6 && 'bg-purple-600 text-white hover:bg-purple-700 border-purple-700',
                  ![0, 4, 6].includes(r) && 'hover:bg-accent',
                )}
              >
                {r}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" disabled={submitting} onClick={() => handleExtra('wide')}>Wide</Button>
            <Button variant="outline" disabled={submitting} onClick={() => handleExtra('noball')}>No Ball</Button>
            <Button variant="outline" disabled={submitting} onClick={() => handleExtra('bye')}>Bye</Button>
            <Button variant="outline" disabled={submitting} onClick={() => handleExtra('legbye')}>Leg Bye</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="destructive"
              disabled={submitting}
              onClick={() => openWicket(0)}
              className="col-span-2 md:col-span-1"
            >
              <AlertTriangle className="h-4 w-4 mr-2" /> Wicket
            </Button>
            <Button variant="outline" onClick={handleSwapStrike}>
              <ArrowRightLeft className="h-4 w-4 mr-2" /> Swap Strike
            </Button>
            <Button variant="outline" disabled={submitting || !isOverComplete} onClick={() => toast.info('End-over: pick new bowler above')}>
              <FastForward className="h-4 w-4 mr-2" /> End Over
            </Button>
            <Button variant="outline" onClick={() => navigator.share?.({ title: 'Live Match', url: window.location.href }).catch(() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied')))}>
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
          </div>

          {/* Shot direction */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Donut className="h-3.5 w-3.5" /> Shot direction (optional)
              </p>
              {shotDirection && (
                <Button size="sm" variant="ghost" onClick={() => setShotDirection('')}>
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SHOT_DIRECTIONS.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setShotDirection(z)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    shotDirection === z
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-background hover:bg-accent',
                  )}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wicket dialog */}
      <Dialog open={wicketDialog.open} onOpenChange={(open) => setWicketDialog((p) => ({ ...p, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Record a wicket
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Dismissal type</Label>
              <Select value={wicketType} onValueChange={setWicketType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WICKET_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Batsman out</Label>
              <Select value={dismissedBatsman} onValueChange={(v: any) => setDismissedBatsman(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="striker">Striker</SelectItem>
                  <SelectItem value="non_striker">Non-Striker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fielder / Catcher (optional)</Label>
              <Select value={fielderId} onValueChange={setFielderId}>
                <SelectTrigger><SelectValue placeholder="Select fielder" /></SelectTrigger>
                <SelectContent>
                  {bowlingPlayers.map((p) => (
                    <SelectItem key={p.player_id} value={p.player_id}>{p.name ?? p.player_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>New batsman</Label>
              <Select value={newStrikerId} onValueChange={setNewStrikerId}>
                <SelectTrigger><SelectValue placeholder="Select replacement" /></SelectTrigger>
                <SelectContent>
                  {battingPlayers
                    .filter((p) => p.player_id !== strikerId && p.player_id !== nonStrikerId)
                    .map((p) => (
                      <SelectItem key={p.player_id} value={p.player_id}>{p.name ?? p.player_name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Runs taken on this ball</Label>
              <Input
                type="number"
                min={0}
                max={6}
                value={wicketDialog.runs}
                onChange={(e) => setWicketDialog((p) => ({ ...p, runs: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWicketDialog({ open: false, runs: 0 })}>Cancel</Button>
            <Button className="bg-red-500 hover:bg-red-600" onClick={confirmWicket}>
              <Target className="h-4 w-4 mr-2" /> Confirm Wicket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recent ball reel */}
      {inningsBalls.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Balls</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {inningsBalls.slice(-30).reverse().map((b) => (
                <span key={b.id} className="rounded-md border bg-muted/30 px-2 py-1 text-[11px]">
                  <strong>{b.over_number}.{b.ball_number}</strong> · {ballLabel(b)} · {b.batsman_name ?? '—'}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

function PlayerSelector({
  label, players, value, onChange, accent,
}: {
  label: string
  players: MatchPlayer[]
  value: string
  onChange: (v: string) => void
  accent: 'amber' | 'muted' | 'red'
}) {
  const accentClass = accent === 'amber'
    ? 'border-amber-400/40 bg-amber-50/40 dark:bg-amber-900/10'
    : accent === 'red'
      ? 'border-red-400/40 bg-red-50/40 dark:bg-red-900/10'
      : 'bg-muted/30'
  return (
    <div className={cn('rounded-xl border p-3 space-y-1.5', accentClass)}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-background">
          <SelectValue placeholder={`Select ${label.toLowerCase()}…`} />
        </SelectTrigger>
        <SelectContent>
          {players.length === 0 && <SelectItem value="none" disabled>No players</SelectItem>}
          {players.map((p) => (
            <SelectItem key={p.player_id} value={p.player_id}>
              {p.name ?? p.player_name}{p.is_captain ? ' (C)' : ''}{p.is_wicket_keeper ? ' (WK)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
