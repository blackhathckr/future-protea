/**
 * @fileoverview Start Match — pick opening striker/non-striker/bowler, then go live.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Activity, Save } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MatchService, type Match } from '@/services/cricket/match.service'
import { ScoringService } from '@/services/cricket/scoring.service'
import type { MatchPlayer } from '@/types/cricket.types'
import { PageHero } from '@/components/cricket/PageHero'
import { TeamCrest } from '@/components/cricket/TeamCrest'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function StartMatchPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<MatchPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [striker, setStriker] = useState('')
  const [nonStriker, setNonStriker] = useState('')
  const [bowler, setBowler] = useState('')
  const [umpire, setUmpire] = useState('')

  useEffect(() => {
    if (id) load(id)
  }, [id])

  const load = async (matchId: string) => {
    try {
      setLoading(true)
      const m = await MatchService.getMatchById(matchId)
      setMatch(m)
      const ps = await ScoringService.getMatchPlayers(matchId).catch(() => [])
      setPlayers(ps)
    } catch {
      toast.error('Failed to load match')
      navigate('/matches')
    } finally {
      setLoading(false)
    }
  }

  const battingTeam = useMemo(() => {
    if (!match) return ''
    if (!match.toss_winner || !match.toss_decision) return match.team1_name
    return match.toss_decision === 'bat'
      ? match.toss_winner
      : (match.toss_winner === match.team1_name ? match.team2_name : match.team1_name)
  }, [match])

  const bowlingTeam = useMemo(() => {
    if (!match) return ''
    return battingTeam === match.team1_name ? match.team2_name : match.team1_name
  }, [match, battingTeam])

  const battingPlayers = players.filter((p) => p.team === battingTeam)
  const bowlingPlayers = players.filter((p) => p.team === bowlingTeam)

  const handleStart = async () => {
    if (!id || !match) return
    if (!striker || !nonStriker || !bowler) {
      toast.error('Pick striker, non-striker, and opening bowler')
      return
    }
    if (striker === nonStriker) {
      toast.error('Striker and non-striker must be different')
      return
    }
    setSaving(true)
    try {
      await MatchService.updateMatch(id, { status: 'live', current_innings: 1 } as any)
      toast.success('Match is now LIVE')
      navigate(`/matches/${id}/score`)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to start match')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !match) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/matches/${match.id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Pre-match</p>
          <h1 className="text-xl font-bold truncate">{match.team1_name} vs {match.team2_name}</h1>
        </div>
      </div>

      <PageHero
        title="Start Match"
        description="Confirm the opening lineup and we'll switch the match to LIVE."
        icon={Activity}
        variant="orange"
      />

      <Card>
        <CardContent className="p-5 space-y-6">
          {/* Matchup summary */}
          <div className="grid grid-cols-3 items-center gap-4 rounded-xl border bg-muted/30 p-4">
            <div className="flex flex-col items-center text-center">
              <TeamCrest name={match.team1_name} size="lg" />
              <p className="mt-2 font-semibold">{match.team1_name}</p>
              {battingTeam === match.team1_name ? (
                <Badge className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-[10px]">BATTING 1st</Badge>
              ) : (
                <Badge variant="outline" className="mt-1 text-[10px]">BOWLING</Badge>
              )}
            </div>
            <p className="text-center text-3xl font-black text-muted-foreground">VS</p>
            <div className="flex flex-col items-center text-center">
              <TeamCrest name={match.team2_name} size="lg" />
              <p className="mt-2 font-semibold">{match.team2_name}</p>
              {battingTeam === match.team2_name ? (
                <Badge className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-[10px]">BATTING 1st</Badge>
              ) : (
                <Badge variant="outline" className="mt-1 text-[10px]">BOWLING</Badge>
              )}
            </div>
          </div>

          {!match.toss_winner && (
            <div className="rounded-lg border-2 border-amber-400/50 bg-amber-50/50 dark:bg-amber-900/10 p-3 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm">No toss yet — record the toss first for accurate batting order.</p>
              <Button variant="outline" size="sm" onClick={() => navigate(`/matches/${match.id}/toss`)}>
                Go to Toss
              </Button>
            </div>
          )}

          {/* Selectors */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Striker</Label>
              <Select value={striker} onValueChange={setStriker}>
                <SelectTrigger><SelectValue placeholder="Select striker" /></SelectTrigger>
                <SelectContent>
                  {battingPlayers.length === 0 && <SelectItem value="none" disabled>No players selected — pick a playing XI first.</SelectItem>}
                  {battingPlayers.map((p) => (
                    <SelectItem key={p.player_id} value={p.player_id}>{p.name ?? p.player_name}{p.is_captain ? ' (C)' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Non-Striker</Label>
              <Select value={nonStriker} onValueChange={setNonStriker}>
                <SelectTrigger><SelectValue placeholder="Select non-striker" /></SelectTrigger>
                <SelectContent>
                  {battingPlayers.map((p) => (
                    <SelectItem key={p.player_id} value={p.player_id} disabled={p.player_id === striker}>{p.name ?? p.player_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Opening Bowler</Label>
              <Select value={bowler} onValueChange={setBowler}>
                <SelectTrigger><SelectValue placeholder="Select bowler" /></SelectTrigger>
                <SelectContent>
                  {bowlingPlayers.length === 0 && <SelectItem value="none" disabled>No bowlers selected — pick a playing XI first.</SelectItem>}
                  {bowlingPlayers.map((p) => (
                    <SelectItem key={p.player_id} value={p.player_id}>{p.name ?? p.player_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Umpire</Label>
              <Input value={umpire} onChange={(e) => setUmpire(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            <Button variant="outline" disabled={saving} onClick={() => navigate(`/matches/${match.id}/playing-xi`)}>
              <Save className="h-4 w-4 mr-2" /> Adjust Playing XI
            </Button>
            <Button disabled={saving} onClick={handleStart} className={cn('text-white', 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600')}>
              <Activity className="h-4 w-4 mr-2" /> Start Innings
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
