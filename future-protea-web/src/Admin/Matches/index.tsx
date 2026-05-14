/**
 * @fileoverview Match Management Page
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Eye, Edit, Trash2, Activity, Calendar, Trophy } from 'lucide-react'
import { MatchService, type Match } from '@/services/cricket/match.service'
import { toast } from 'sonner'

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
    } catch (error) {
      toast.error('Failed to load matches')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return
    
    try {
      await MatchService.deleteMatch(id)
      toast.success('Match deleted successfully')
      loadMatches()
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Matches</h1>
          <p className="text-muted-foreground">Manage all cricket matches</p>
        </div>
        <Button onClick={() => navigate('/matches/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Match
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live" className="gap-2">
            <Activity className="h-4 w-4" />
            Live ({liveMatches.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming ({upcomingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <Trophy className="h-4 w-4" />
            Completed ({completedMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          {liveMatches.length > 0 ? (
            liveMatches.map((match) => (
              <MatchCard key={match.id} match={match} onDelete={handleDelete} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No live matches</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingMatches.length > 0 ? (
            upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} onDelete={handleDelete} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No upcoming matches</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedMatches.length > 0 ? (
            completedMatches.map((match) => (
              <MatchCard key={match.id} match={match} onDelete={handleDelete} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No completed matches</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

function MatchCard({ match, onDelete }: { match: Match; onDelete: (id: string) => void }) {
  const navigate = useNavigate()

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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">
                {match.team1_name} vs {match.team2_name}
              </CardTitle>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{match.venue}</span>
              <span>•</span>
              <span>{new Date(match.match_date).toLocaleDateString()}</span>
              <span>•</span>
              <span>{match.total_overs} overs</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/matches/${match.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/matches/${match.id}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(match.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {(match.status === 'live' || match.status === 'completed') && (
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold mb-1">{match.team1_name}</p>
              <p className="text-2xl font-bold">
                {match.team1_score}/{match.team1_wickets}
                <span className="text-sm text-muted-foreground ml-2">({match.team1_overs})</span>
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">{match.team2_name}</p>
              <p className="text-2xl font-bold">
                {match.team2_score}/{match.team2_wickets}
                <span className="text-sm text-muted-foreground ml-2">({match.team2_overs})</span>
              </p>
            </div>
          </div>
          
          {match.winner && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-green-600">
                {match.winner} won the match
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
