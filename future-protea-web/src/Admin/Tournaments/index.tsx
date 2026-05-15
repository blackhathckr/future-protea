/**
 * @fileoverview Tournament Management Page
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Edit, Trash2, Trophy, Calendar, MapPin } from 'lucide-react'
import { TournamentService, type Tournament } from '@/services/cricket/tournament.service'
import { PageHero } from '@/components/cricket/PageHero'
import { toast } from 'sonner'
import { confirm } from '@/lib/confirm'
import { cn } from '@/lib/utils'

export function TournamentsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  useEffect(() => { loadTournaments() }, [])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      const data = await TournamentService.getTournaments()
      setTournaments(data)
    } catch {
      toast.error('Failed to load tournaments')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete this tournament?', description: 'Fixtures, standings, and stats will be removed.', confirmLabel: 'Delete' })
    if (!ok) return
    try {
      await TournamentService.deleteTournament(id)
      toast.success('Tournament deleted')
      loadTournaments()
    } catch {
      toast.error('Failed to delete tournament')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const upcoming = tournaments.filter((t) => t.status === 'upcoming')
  const active = tournaments.filter((t) => t.status === 'in_progress')
  const completed = tournaments.filter((t) => t.status === 'completed')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHero
        title="Tournaments"
        description={`${active.length} active · ${upcoming.length} upcoming · ${completed.length} completed`}
        icon={Trophy}
        variant="slate"
        actions={
          <Button
            onClick={() => navigate('/tournaments/create')}
            className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/30"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Tournament
          </Button>
        }
      />

      <Section title="Active Tournaments" icon={Trophy} accent="text-emerald-600" tournaments={active} onDelete={handleDelete} />
      <Section title="Upcoming Tournaments" icon={Calendar} accent="text-blue-600" tournaments={upcoming} onDelete={handleDelete} />
      <Section title="Completed Tournaments" icon={Trophy} accent="text-muted-foreground" tournaments={completed} onDelete={handleDelete} />

      {tournaments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground/60 mb-3" />
            <p className="text-muted-foreground">No tournaments found</p>
            <Button onClick={() => navigate('/tournaments/create')} className="mt-4">Create Your First Tournament</Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

function Section({ title, icon: Icon, accent, tournaments, onDelete }: { title: string; icon: any; accent: string; tournaments: Tournament[]; onDelete: (id: string) => void }) {
  if (tournaments.length === 0) return null
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Icon className={cn('h-5 w-5', accent)} />
        {title} <span className="text-muted-foreground font-normal">({tournaments.length})</span>
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((t) => (
          <TournamentCard key={t.id} tournament={t} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

function TournamentCard({ tournament, onDelete }: { tournament: Tournament; onDelete: (id: string) => void }) {
  const navigate = useNavigate()
  const statusVariant = tournament.status === 'in_progress'
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
    : tournament.status === 'upcoming'
      ? 'bg-blue-500 hover:bg-blue-600 text-white'
      : 'bg-muted text-muted-foreground'

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

  return (
    <motion.div whileHover={{ y: -2 }}>
      <Card
        className="overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-emerald-500/30 group"
        onClick={() => navigate(`/tournaments/${tournament.id}`)}
      >
        <CardContent className="p-5 space-y-4">
          {/* Top row — logo + name + status badge, no decorative banner. */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {tournament.logo_url ? (
                <img
                  src={tournament.logo_url}
                  alt=""
                  className="h-14 w-14 rounded-xl object-cover bg-muted shrink-0 ring-1 ring-border"
                />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-slate-800 ring-1 ring-border shrink-0 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-emerald-400" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold truncate leading-tight">{tournament.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {tournament.type && (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {tournament.type}
                    </Badge>
                  )}
                  {tournament.overs ? (
                    <span className="text-[11px] text-muted-foreground">{tournament.overs} overs</span>
                  ) : null}
                </div>
              </div>
            </div>
            <Badge className={cn('border-0 capitalize shrink-0', statusVariant)}>
              {tournament.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Metadata */}
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
              </span>
            </p>
            {tournament.venue && (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{tournament.venue}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/tournaments/${tournament.id}`)}>
              <Eye className="h-3.5 w-3.5 mr-1.5" /> View
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate(`/tournaments/${tournament.id}/edit`)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => onDelete(tournament.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
