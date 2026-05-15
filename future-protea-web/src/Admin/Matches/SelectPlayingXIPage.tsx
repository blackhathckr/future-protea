/**
 * @fileoverview Select Playing XI — choose up to 11 players per team.
 * Mirrors Flutter select_playing_xi_screen.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, Save, ShieldAlert, Users2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MatchService, type Match } from '@/services/cricket/match.service'
import { TeamService } from '@/services/cricket/team.service'
import { ScoringService } from '@/services/cricket/scoring.service'
import { PageHero } from '@/components/cricket/PageHero'
import { TeamCrest } from '@/components/cricket/TeamCrest'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface RosterPlayer {
  player_id: string
  player_name: string
  player_id_code?: string
  is_captain?: boolean
  is_wicket_keeper?: boolean
  photo_url?: string
}

export function SelectPlayingXIPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [match, setMatch] = useState<Match | null>(null)
  const [team1Players, setTeam1Players] = useState<RosterPlayer[]>([])
  const [team2Players, setTeam2Players] = useState<RosterPlayer[]>([])
  const [selected1, setSelected1] = useState<Set<string>>(new Set())
  const [selected2, setSelected2] = useState<Set<string>>(new Set())
  const [activeTeam, setActiveTeam] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (id) load(id)
  }, [id])

  const load = async (matchId: string) => {
    try {
      setLoading(true)
      const m = await MatchService.getMatchById(matchId)
      setMatch(m)
      const teams = await TeamService.getTeams()
      const t1 = teams.find((t) => t.team_name === m.team1_name)
      const t2 = teams.find((t) => t.team_name === m.team2_name)
      const [t1Data, t2Data] = await Promise.all([
        t1 ? TeamService.getTeamById(t1.id).catch(() => null) : null,
        t2 ? TeamService.getTeamById(t2.id).catch(() => null) : null,
      ])
      const t1Roster: RosterPlayer[] = ((t1Data as any)?.players ?? []).map((p: any) => ({
        player_id: p.player_id ?? p.id,
        player_name: p.player_name ?? p.name,
        player_id_code: p.player_id_code,
        is_captain: p.is_captain,
        is_wicket_keeper: p.is_wicket_keeper,
        photo_url: p.photo_url,
      }))
      const t2Roster: RosterPlayer[] = ((t2Data as any)?.players ?? []).map((p: any) => ({
        player_id: p.player_id ?? p.id,
        player_name: p.player_name ?? p.name,
        player_id_code: p.player_id_code,
        is_captain: p.is_captain,
        is_wicket_keeper: p.is_wicket_keeper,
        photo_url: p.photo_url,
      }))
      setTeam1Players(t1Roster)
      setTeam2Players(t2Roster)

      // Pre-fill from already-approved match players (the current playing XI).
      // Fall back to every selected match_player if there's no approval data yet.
      const matchPlayers = await ScoringService.getMatchPlayers(matchId).catch(() => [])
      const anyApproved = matchPlayers.some((mp) => mp.status === 'approved')
      const s1 = new Set<string>()
      const s2 = new Set<string>()
      matchPlayers.forEach((mp) => {
        if (anyApproved && mp.status !== 'approved') return
        if (mp.team === m.team1_name) s1.add(mp.player_id)
        if (mp.team === m.team2_name) s2.add(mp.player_id)
      })
      setSelected1(s1)
      setSelected2(s2)
    } catch {
      toast.error('Failed to load teams')
      navigate('/matches')
    } finally {
      setLoading(false)
    }
  }

  const togglePlayer = (team: 1 | 2, pid: string) => {
    const setter = team === 1 ? setSelected1 : setSelected2
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(pid)) next.delete(pid)
      else next.add(pid)
      return next
    })
    setDirty(true)
  }

  const handleSave = async () => {
    if (!id || !match) return
    setSaving(true)
    try {
      // 1) Make sure match_players rows exist for every player on both team rosters.
      await ScoringService.populateMatchPlayers(id).catch(() => {})

      // 2) Pull the freshly-seeded match_players (each row has match_player.id we need to flip approval on).
      const matchPlayers = await ScoringService.getMatchPlayers(id).catch(() => [])

      // 3) For each player, set status=approved if selected, else rejected.
      const toUpdate: Array<Promise<unknown>> = []
      for (const mp of matchPlayers) {
        const isPicked = mp.team === match.team1_name
          ? selected1.has(mp.player_id)
          : selected2.has(mp.player_id)
        const desired = isPicked ? 'approved' : 'rejected'
        toUpdate.push(ScoringService.approveMatchPlayer(mp.id, desired).catch(() => {}))
      }
      await Promise.all(toUpdate)

      toast.success('Playing XI saved')
      setDirty(false)
      navigate(`/matches/${id}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to save playing XI')
    } finally {
      setSaving(false)
    }
  }

  const currentRoster = activeTeam === 1 ? team1Players : team2Players
  const currentSelected = activeTeam === 1 ? selected1 : selected2
  const currentTeamName = activeTeam === 1 ? match?.team1_name : match?.team2_name

  const count1 = selected1.size
  const count2 = selected2.size
  const tooMany = currentSelected.size > 11

  const counterColor = useMemo(() => {
    if (currentSelected.size === 11) return 'text-emerald-600 dark:text-emerald-400'
    if (currentSelected.size > 11) return 'text-red-600 dark:text-red-400'
    return 'text-muted-foreground'
  }, [currentSelected.size])

  if (loading || !match) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/matches/${match.id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Playing XI</p>
          <h1 className="text-xl font-bold truncate">{match.team1_name} vs {match.team2_name}</h1>
        </div>
      </div>

      <PageHero
        title="Select Playing XI"
        description="Choose up to 11 players per team. Captain (C) and wicket-keeper (WK) badges come from the team roster."
        icon={Users2}
        variant="blue"
      />

      {/* Team switcher */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((n) => {
          const isActive = activeTeam === n
          const name = n === 1 ? match.team1_name : match.team2_name
          const count = n === 1 ? count1 : count2
          return (
            <button
              key={n}
              onClick={() => setActiveTeam(n as 1 | 2)}
              className={cn(
                'rounded-2xl border-2 p-4 transition-all flex items-center gap-3',
                isActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow'
                  : 'border-border bg-card hover:border-primary/40',
              )}
            >
              <TeamCrest name={name} size="md" />
              <div className="text-left">
                <p className="font-semibold">{name}</p>
                <p className={cn('text-xs font-semibold', count === 11 ? 'text-emerald-600' : count > 11 ? 'text-red-600' : 'text-muted-foreground')}>{count}/11 selected</p>
              </div>
            </button>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold">{currentTeamName} squad</h2>
            <p className={cn('text-sm font-bold', counterColor)}>Playing XI: {currentSelected.size}/11</p>
          </div>
          <AnimatePresence>
            {tooMany && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="rounded-lg border border-red-400/40 bg-red-50/50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 text-sm flex items-center gap-2"
              >
                <ShieldAlert className="h-4 w-4" /> Too many players selected!
              </motion.div>
            )}
          </AnimatePresence>

          {dirty && (
            <div className="rounded-lg border border-amber-400/50 bg-amber-50/50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 px-3 py-2 text-sm">
              You have unsaved changes
            </div>
          )}

          <ul className="divide-y rounded-xl border bg-card">
            {currentRoster.map((p) => {
              const sel = currentSelected.has(p.player_id)
              return (
                <li
                  key={p.player_id}
                  onClick={() => togglePlayer(activeTeam, p.player_id)}
                  className={cn(
                    'flex items-center gap-3 p-3 cursor-pointer transition-colors',
                    sel ? 'bg-blue-50/40 dark:bg-blue-950/20' : 'hover:bg-accent',
                  )}
                >
                  <div className={cn(
                    'h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    sel ? 'bg-blue-500 border-blue-500' : 'border-muted-foreground/40',
                  )}>
                    {sel && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white text-xs font-bold flex items-center justify-center">
                      {p.player_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.player_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{p.player_id_code ?? '—'}</p>
                  </div>
                  {p.is_captain && <Badge className="bg-emerald-600 hover:bg-emerald-700 text-[10px]">C</Badge>}
                  {p.is_wicket_keeper && <Badge className="bg-blue-600 hover:bg-blue-700 text-[10px]">WK</Badge>}
                </li>
              )
            })}
            {currentRoster.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">
                No players in this team yet. Add players from the team page first.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      <div className="fixed left-0 right-0 bottom-0 z-30 bg-background/95 backdrop-blur border-t shadow-lg">
        <div className="max-w-5xl mx-auto p-3 px-4 flex items-center gap-3">
          <p className="text-sm text-muted-foreground flex-1">
            {match.team1_name}: <strong className="text-foreground">{count1}/11</strong> ·{' '}
            {match.team2_name}: <strong className="text-foreground">{count2}/11</strong>
          </p>
          <Button disabled={saving} onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving…' : 'Save Playing XI'}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
