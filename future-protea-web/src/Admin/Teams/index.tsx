/**
 * @fileoverview Team Management Page
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Shield, Users, Search } from 'lucide-react'
import { TeamService, type Team } from '@/services/cricket/team.service'
import { PageHero } from '@/components/cricket/PageHero'
import { TeamCrest } from '@/components/cricket/TeamCrest'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { confirm } from '@/lib/confirm'

export function TeamsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const data = await TeamService.getTeams()
      setTeams(data)
    } catch {
      toast.error('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete this team?', description: 'All squad memberships will be cleared.', confirmLabel: 'Delete' })
    if (!ok) return
    try {
      await TeamService.deleteTeam(id)
      toast.success('Team deleted')
      loadTeams()
    } catch {
      toast.error('Failed to delete team')
    }
  }

  const filtered = teams.filter((t) =>
    [t.team_name, t.team_code, t.team_type, t.school_name, t.club_name]
      .filter(Boolean)
      .some((v) => v!.toLowerCase().includes(query.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHero
        title="Teams"
        description={`${teams.length} team${teams.length === 1 ? '' : 's'} registered — schools, clubs and academies.`}
        icon={Shield}
        variant="slate"
        actions={
          <Button
            onClick={() => navigate('/teams/create')}
            className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/30"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Team
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, code, type…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((team) => (
            <TeamCard key={team.id} team={team} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground/60 mb-3" />
            <p className="text-muted-foreground">{query ? 'No teams match your search' : 'No teams found'}</p>
            {!query && (
              <Button onClick={() => navigate('/teams/create')} className="mt-4">
                Create Your First Team
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

function TeamCard({ team, onDelete }: { team: Team; onDelete: (id: string) => void }) {
  const navigate = useNavigate()
  const sub = team.school_name || team.club_name

  return (
    <motion.div whileHover={{ y: -2 }}>
      <Card
        className="overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-emerald-500/30 group"
        onClick={() => navigate(`/teams/${team.id}`)}
      >
        {/* Clean header with the crest inline — no decorative gradient banner.
            The team_type badge moves to the top-right for at-a-glance scanning. */}
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <TeamCrest name={team.team_name} logoUrl={team.logo_url} size="lg" />
            {team.team_type && (
              <Badge variant="secondary" className="capitalize text-[10px] shrink-0">
                {team.team_type}
              </Badge>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold truncate">{team.team_name}</h3>
              {team.team_code && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {team.team_code}
                </Badge>
              )}
            </div>
            {sub && (
              <p className="text-xs text-muted-foreground truncate mt-1">{sub}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline" onClick={() => navigate(`/teams/${team.id}`)} className="flex-1">
              <Users className="h-3.5 w-3.5 mr-1.5" /> Squad
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate(`/teams/${team.id}/edit`)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => onDelete(team.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
