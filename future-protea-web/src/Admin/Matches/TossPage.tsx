/**
 * @fileoverview Toss workflow — who won, batting decision, umpire.
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Coins } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MatchService, type Match } from '@/services/cricket/match.service'
import { PageHero } from '@/components/cricket/PageHero'
import { TeamCrest } from '@/components/cricket/TeamCrest'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function TossPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [winner, setWinner] = useState<string>('')
  const [decision, setDecision] = useState<'bat' | 'bowl' | ''>('')
  const [umpire, setUmpire] = useState('')

  useEffect(() => {
    if (id) load(id)
  }, [id])

  const load = async (matchId: string) => {
    try {
      setLoading(true)
      const m = await MatchService.getMatchById(matchId)
      setMatch(m)
      if (m.toss_winner) setWinner(m.toss_winner)
      if (m.toss_decision) setDecision(m.toss_decision as 'bat' | 'bowl')
    } catch {
      toast.error('Failed to load match')
      navigate('/matches')
    } finally {
      setLoading(false)
    }
  }

  const save = async (startAfter?: boolean) => {
    if (!id || !match) return
    if (!winner || !decision) {
      toast.error('Pick toss winner and decision')
      return
    }
    setSaving(true)
    try {
      await MatchService.updateMatch(id, {
        toss_winner: winner,
        toss_decision: decision,
      } as any)
      toast.success('Toss saved')
      if (startAfter) {
        navigate(`/matches/${id}/start`)
      } else {
        navigate(`/matches/${id}`)
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to save toss')
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
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Match · {match.venue}</p>
          <h1 className="text-xl font-bold truncate">{match.team1_name} vs {match.team2_name}</h1>
        </div>
      </div>

      <PageHero
        title="Who won the toss?"
        description="Record the toss outcome before the match starts so we can drive the right innings flow."
        icon={Coins}
        variant="green"
      />

      <Card>
        <CardContent className="p-5 space-y-6">
          {/* Team selection */}
          <div>
            <p className="text-sm font-semibold mb-3">Toss winner</p>
            <div className="grid grid-cols-2 gap-3">
              {[match.team1_name, match.team2_name].map((name) => (
                <PickCard key={name} active={winner === name} onClick={() => setWinner(name)}>
                  <TeamCrest name={name} size="lg" />
                  <p className="mt-2 font-semibold text-center">{name}</p>
                </PickCard>
              ))}
            </div>
          </div>

          {/* Decision */}
          <div>
            <p className="text-sm font-semibold mb-3">Decision</p>
            <div className="grid grid-cols-2 gap-3">
              <PickCard active={decision === 'bat'} onClick={() => setDecision('bat')}>
                <span className="text-4xl">🏏</span>
                <p className="mt-2 font-semibold">Bat</p>
              </PickCard>
              <PickCard active={decision === 'bowl'} onClick={() => setDecision('bowl')}>
                <span className="text-4xl">🎯</span>
                <p className="mt-2 font-semibold">Bowl</p>
              </PickCard>
            </div>
          </div>

          {/* Umpire */}
          <div className="space-y-1.5">
            <Label>Umpire (optional)</Label>
            <Input value={umpire} onChange={(e) => setUmpire(e.target.value)} placeholder="Enter umpire name" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button disabled={saving} variant="outline" onClick={() => save(false)}>
              Save Toss
            </Button>
            <Button disabled={saving} onClick={() => save(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Check className="h-4 w-4 mr-2" /> Save & Continue to Start
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function PickCard({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all',
        active ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md scale-[1.01]' : 'border-border bg-card hover:border-primary/40',
      )}
    >
      {active && (
        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}
      {children}
    </button>
  )
}
