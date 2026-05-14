/**
 * @fileoverview Team Management Page
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Shield, Users } from 'lucide-react'
import { TeamService, type Team } from '@/services/cricket/team.service'
import { toast } from 'sonner'

export function TeamsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const data = await TeamService.getTeams()
      setTeams(data)
    } catch (error) {
      toast.error('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return
    
    try {
      await TeamService.deleteTeam(id)
      toast.success('Team deleted successfully')
      loadTeams()
    } catch (error) {
      toast.error('Failed to delete team')
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
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Manage cricket teams</p>
        </div>
        <Button onClick={() => navigate('/teams/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      {teams.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No teams found</p>
            <Button onClick={() => navigate('/teams/create')} className="mt-4">
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

function TeamCard({ team, onDelete }: { team: Team; onDelete: (id: string) => void }) {
  const navigate = useNavigate()

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {team.logo_url ? (
              <img 
                src={team.logo_url} 
                alt={team.team_name}
                className="w-12 h-12 rounded-full object-cover bg-white"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{team.team_name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">{team.team_type || 'Team'}</Badge>
                {team.team_code && <span className="text-xs text-muted-foreground">{team.team_code}</span>}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/teams/${team.id}`)}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-1" />
            Players
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/teams/${team.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(team.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
