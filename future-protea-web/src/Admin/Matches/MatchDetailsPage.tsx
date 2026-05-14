/**
 * @fileoverview Match Details Page
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { MatchService, type Match } from '@/services/cricket/match.service'
import { toast } from 'sonner'

export function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [match, setMatch] = useState<Match | null>(null)

  useEffect(() => {
    if (id) {
      loadMatch(id)
    }
  }, [id])

  const loadMatch = async (matchId: string) => {
    try {
      setLoading(true)
      const data = await MatchService.getMatchById(matchId)
      setMatch(data)
    } catch (error) {
      toast.error('Failed to load match details')
      navigate('/matches')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this match?')) return
    
    try {
      await MatchService.deleteMatch(id!)
      toast.success('Match deleted successfully')
      navigate('/matches')
    } catch (error) {
      toast.error('Failed to delete match')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    )
  }

  const getStatusBadge = () => {
    switch (match.status) {
      case 'live':
        return <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
      case 'upcoming':
        return <Badge variant="secondary">UPCOMING</Badge>
      case 'completed':
        return <Badge variant="outline">COMPLETED</Badge>
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/matches')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {match.team1_name} vs {match.team2_name}
            {getStatusBadge()}
          </h1>
          <p className="text-muted-foreground">Match Details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/matches/${match.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Match Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Venue</p>
              <p className="font-semibold">{match.venue || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-semibold">{new Date(match.match_date).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Overs</p>
              <p className="font-semibold">{match.total_overs}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-semibold capitalize">{match.status}</p>
            </div>
          </CardContent>
        </Card>

        {(match.status === 'live' || match.status === 'completed') && (
          <Card>
            <CardHeader>
              <CardTitle>Match Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{match.team1_name}</p>
                <p className="text-3xl font-bold">
                  {match.team1_score}/{match.team1_wickets}
                  <span className="text-lg text-muted-foreground ml-2">({match.team1_overs})</span>
                </p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">{match.team2_name}</p>
                <p className="text-3xl font-bold">
                  {match.team2_score}/{match.team2_wickets}
                  <span className="text-lg text-muted-foreground ml-2">({match.team2_overs})</span>
                </p>
              </div>
              {match.winner && (
                <div className="border-t pt-4">
                  <p className="text-sm text-green-600 font-medium">
                    🏆 {match.winner} won the match
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {match.toss_winner && (
        <Card>
          <CardHeader>
            <CardTitle>Toss Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Toss Winner</p>
              <p className="font-semibold">{match.toss_winner}</p>
            </div>
            {match.toss_decision && (
              <div>
                <p className="text-sm text-muted-foreground">Decision</p>
                <p className="font-semibold capitalize">{match.toss_decision}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
