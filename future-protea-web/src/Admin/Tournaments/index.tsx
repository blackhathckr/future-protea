/**
 * @fileoverview Tournament Management Page
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Edit, Trash2, Trophy, Calendar } from 'lucide-react'
import { TournamentService, type Tournament } from '@/services/cricket/tournament.service'
import { toast } from 'sonner'

export function TournamentsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      const data = await TournamentService.getTournaments()
      setTournaments(data)
    } catch (error) {
      toast.error('Failed to load tournaments')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return
    
    try {
      await TournamentService.deleteTournament(id)
      toast.success('Tournament deleted successfully')
      loadTournaments()
    } catch (error) {
      toast.error('Failed to delete tournament')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const upcomingTournaments = tournaments.filter(t => t.status === 'upcoming')
  const activeTournaments = tournaments.filter(t => t.status === 'in_progress')
  const completedTournaments = tournaments.filter(t => t.status === 'completed')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tournaments</h1>
          <p className="text-muted-foreground">Manage cricket tournaments</p>
        </div>
        <Button onClick={() => navigate('/tournaments/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Tournament
        </Button>
      </div>

      {/* Active Tournaments */}
      {activeTournaments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-green-600" />
            Active Tournaments ({activeTournaments.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Tournaments */}
      {upcomingTournaments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Upcoming Tournaments ({upcomingTournaments.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tournaments */}
      {completedTournaments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gray-600" />
            Completed Tournaments ({completedTournaments.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {tournaments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tournaments found</p>
            <Button onClick={() => navigate('/tournaments/create')} className="mt-4">
              Create Your First Tournament
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

function TournamentCard({ tournament, onDelete }: { tournament: Tournament; onDelete: (id: string) => void }) {
  const navigate = useNavigate()

  const getStatusBadge = () => {
    switch (tournament.status) {
      case 'in_progress':
        return <Badge className="bg-green-600">Active</Badge>
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>
      case 'completed':
        return <Badge variant="outline">Completed</Badge>
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-4">
          {tournament.logo_url ? (
            <img 
              src={tournament.logo_url} 
              alt={tournament.name}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-primary/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          )}
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg truncate">{tournament.name}</CardTitle>
              {getStatusBadge()}
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Type: {tournament.type || 'N/A'} {tournament.overs ? `(${tournament.overs} Overs)` : ''}</p>
              <p>Start: {new Date(tournament.start_date).toLocaleDateString()}</p>
              <p>End: {new Date(tournament.end_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tournament.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {tournament.description}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/tournaments/${tournament.id}`)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/tournaments/${tournament.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(tournament.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
