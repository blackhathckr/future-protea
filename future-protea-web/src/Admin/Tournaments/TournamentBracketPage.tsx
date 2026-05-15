/**
 * @fileoverview Tournament Bracket / Standings visual.
 * Renders knockout matches as a bracket; pool/league standings as a points table.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Trophy, Network } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TournamentService, type Fixture, type Tournament } from '@/services/cricket/tournament.service'
import { PageHero } from '@/components/cricket/PageHero'
import { TeamCrest } from '@/components/cricket/TeamCrest'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const KNOCKOUT_KEYWORDS = ['final', 'semi', 'quarter', 'eliminator', 'qualifier', 'play-off', 'playoff']

export function TournamentBracketPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) load(id) }, [id])

  const load = async (tid: string) => {
    try {
      setLoading(true)
      const [t, f] = await Promise.all([
        TournamentService.getTournamentById(tid),
        TournamentService.getTournamentFixtures(tid).catch(() => []),
      ])
      setTournament(t)
      setFixtures(f)
    } catch {
      toast.error('Failed to load tournament')
      navigate('/tournaments')
    } finally {
      setLoading(false)
    }
  }

  const knockoutRounds = useMemo(() => {
    const ko = fixtures.filter((f) => f.group_name && KNOCKOUT_KEYWORDS.some((k) => f.group_name!.toLowerCase().includes(k)))
    const byRound: Record<string, Fixture[]> = {}
    ko.forEach((f) => {
      const key = f.group_name!.toLowerCase()
      const round = KNOCKOUT_KEYWORDS.find((k) => key.includes(k)) ?? key
      byRound[round] = byRound[round] ?? []
      byRound[round]!.push(f)
    })
    const order = ['eliminator', 'qualifier', 'quarter', 'semi', 'final', 'play-off', 'playoff']
    return order
      .filter((k) => byRound[k])
      .map((k) => ({ round: k, fixtures: byRound[k]! }))
  }, [fixtures])

  const leagueFixtures = useMemo(
    () => fixtures.filter((f) => !f.group_name || !KNOCKOUT_KEYWORDS.some((k) => f.group_name!.toLowerCase().includes(k))),
    [fixtures],
  )

  if (loading || !tournament) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/tournaments/${tournament.id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Bracket</p>
          <h1 className="text-xl font-bold truncate">{tournament.name}</h1>
        </div>
      </div>

      <PageHero
        title="Tournament Bracket"
        description="Knockout matches are arranged left-to-right by round. League fixtures are listed below."
        icon={Network}
        variant="purple"
      />

      {knockoutRounds.length > 0 ? (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-8 min-w-max">
            {knockoutRounds.map(({ round, fixtures }, roundIdx) => (
              <div key={round} className="flex flex-col justify-around gap-6 min-w-[280px]">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold text-center">
                  {round} {roundIdx === knockoutRounds.length - 1 && '🏆'}
                </p>
                {fixtures.map((f) => (
                  <BracketFixture key={f.id} fixture={f} />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No knockout fixtures yet. Create fixtures with stage names like “Quarter Final”, “Semi Final”, or “Final”.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-500" /> League / Group Fixtures
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leagueFixtures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No league fixtures recorded.</p>
          ) : (
            <ul className="space-y-2">
              {leagueFixtures.map((f) => <LeagueFixtureRow key={f.id} fixture={f} />)}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function BracketFixture({ fixture }: { fixture: Fixture }) {
  const t1Won = fixture.team1_score != null && fixture.team2_score != null && fixture.team1_score > fixture.team2_score
  const t2Won = fixture.team1_score != null && fixture.team2_score != null && fixture.team2_score > fixture.team1_score
  return (
    <Card className="border-2 hover:border-primary/60 transition-colors">
      <CardContent className="p-3 space-y-1.5">
        <TeamLine name={fixture.team1_name} score={fixture.team1_score} wickets={fixture.team1_wickets} overs={fixture.team1_overs} winner={t1Won} />
        <div className="h-px bg-border" />
        <TeamLine name={fixture.team2_name} score={fixture.team2_score} wickets={fixture.team2_wickets} overs={fixture.team2_overs} winner={t2Won} />
        <p className="text-[10px] text-muted-foreground text-center pt-1">
          {new Date(fixture.match_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          {fixture.venue ? ` · ${fixture.venue}` : ''}
        </p>
      </CardContent>
    </Card>
  )
}

function TeamLine({ name, score, wickets, overs, winner }: { name: string; score?: number | null; wickets?: number | null; overs?: number | null; winner?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between gap-2', winner && 'text-emerald-600 dark:text-emerald-400 font-semibold')}>
      <div className="flex items-center gap-2 min-w-0">
        <TeamCrest name={name} size="xs" />
        <span className="truncate text-sm">{name}</span>
      </div>
      {score != null ? (
        <span className="text-xs font-mono tabular-nums">{score}/{wickets ?? 0} ({(overs ?? 0).toFixed(1)})</span>
      ) : <span className="text-xs text-muted-foreground">—</span>}
    </div>
  )
}

function LeagueFixtureRow({ fixture }: { fixture: Fixture }) {
  return (
    <li className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <TeamCrest name={fixture.team1_name} size="xs" />
          <span className="text-sm font-medium truncate">{fixture.team1_name}</span>
          <span className="text-xs text-muted-foreground">vs</span>
          <TeamCrest name={fixture.team2_name} size="xs" />
          <span className="text-sm font-medium truncate">{fixture.team2_name}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {new Date(fixture.match_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          {fixture.venue ? ` · ${fixture.venue}` : ''}
          {fixture.group_name ? ` · ${fixture.group_name}` : ''}
        </p>
      </div>
      {fixture.team1_score != null && fixture.team2_score != null ? (
        <Badge variant="outline" className="font-mono text-[10px]">
          {fixture.team1_score}/{fixture.team1_wickets ?? 0} – {fixture.team2_score}/{fixture.team2_wickets ?? 0}
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-[10px]">scheduled</Badge>
      )}
    </li>
  )
}
