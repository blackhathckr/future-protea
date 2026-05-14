import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, UserPlus, Shield, UserMinus, ShieldAlert, Edit } from 'lucide-react'
import { TeamService, type TeamStats } from '@/services/cricket/team.service'
import { PlayerService, type Player } from '@/services/cricket/player.service'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export function TeamDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<any | null>(null)
  const [stats, setStats] = useState<TeamStats | null>(null)
  
  // Players
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [selectedPlayerToAdd, setSelectedPlayerToAdd] = useState<string>('')
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  useEffect(() => {
    if (id) {
      loadTeamData(id)
      loadAllPlayers()
    }
  }, [id])

  const loadTeamData = async (teamId: string) => {
    try {
      setLoading(true)
      const data = await TeamService.getTeamById(teamId)
      setTeam(data)
      
      try {
        const statsData = await TeamService.getTeamStats(teamId)
        setStats(statsData)
      } catch (e) {
        console.error('Stats failed to load', e)
      }
    } catch (error) {
      toast.error('Failed to load team details')
      navigate('/teams')
    } finally {
      setLoading(false)
    }
  }

  const loadAllPlayers = async () => {
    try {
      const data = await PlayerService.getPlayers()
      setAllPlayers(data.filter(p => p.approved))
    } catch (error) {
      console.error('Failed to load players for dropdown')
    }
  }

  const handleAddPlayer = async () => {
    if (!id || !selectedPlayerToAdd) return
    try {
      setIsAddingPlayer(true)
      await TeamService.addPlayerToTeam(id, selectedPlayerToAdd)
      toast.success('Player added to team')
      setAddDialogOpen(false)
      setSelectedPlayerToAdd('')
      loadTeamData(id)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add player')
    } finally {
      setIsAddingPlayer(false)
    }
  }

  const handleRemovePlayer = async (playerId: string) => {
    if (!id) return
    if (!confirm('Are you sure you want to remove this player from the team?')) return
    try {
      await TeamService.removePlayerFromTeam(id, playerId)
      toast.success('Player removed')
      loadTeamData(id)
    } catch (error) {
      toast.error('Failed to remove player')
    }
  }

  const handleToggleRole = async (playerId: string, currentRole: string, toggle: 'captain' | 'wk') => {
    if (!id) return
    try {
      if (toggle === 'captain') {
        await TeamService.updatePlayerRole(id, playerId, { is_captain: true })
      } else {
        await TeamService.updatePlayerRole(id, playerId, { is_wicket_keeper: true })
      }
      toast.success('Role updated')
      loadTeamData(id)
    } catch (error) {
      toast.error('Failed to update role')
    }
  }

  if (loading || !team) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Filter out players already in the team
  const availablePlayers = allPlayers.filter(p => 
    !team.players?.some((tp: any) => tp.player_id === p.id)
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teams')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {team.logo_url ? (
              <img src={team.logo_url} alt="Logo" className="w-16 h-16 rounded-full object-cover bg-white" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                {team.team_name}
                {team.team_code && <Badge variant="secondary" className="text-sm">{team.team_code}</Badge>}
              </h1>
              <p className="text-muted-foreground capitalize">
                {team.team_type} {team.school_name ? `- ${team.school_name}` : team.club_name ? `- ${team.club_name}` : ''}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(`/teams/${team.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Team
          </Button>
        </div>
      </div>

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="players">Players ({team.players?.length || 0})</TabsTrigger>
          <TabsTrigger value="stats">Team Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="players" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Squad</h2>
            
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Player to Team</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Player</Label>
                    <Select value={selectedPlayerToAdd} onValueChange={setSelectedPlayerToAdd}>
                      <SelectTrigger>
                        <SelectValue placeholder="Search approved players..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlayers.length === 0 ? (
                          <SelectItem value="none" disabled>No players available</SelectItem>
                        ) : (
                          availablePlayers.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.email})</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleAddPlayer}
                    disabled={!selectedPlayerToAdd || selectedPlayerToAdd === 'none' || isAddingPlayer}
                  >
                    {isAddingPlayer ? 'Adding...' : 'Add Player'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {team.players?.map((tp: any) => (
              <Card key={tp.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {tp.photo_url ? (
                        <img src={tp.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          {tp.player_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{tp.player_name}</CardTitle>
                        <CardDescription>{tp.player_id_code}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    {tp.is_captain && <Badge className="bg-orange-500 hover:bg-orange-600">Captain</Badge>}
                    {tp.is_wicket_keeper && <Badge className="bg-blue-500 hover:bg-blue-600">WK</Badge>}
                    {!tp.is_captain && !tp.is_wicket_keeper && <Badge variant="outline">Player</Badge>}
                  </div>
                  
                  <div className="flex justify-end gap-2 border-t pt-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={tp.is_captain ? 'text-orange-600' : 'text-muted-foreground'}
                      onClick={() => handleToggleRole(tp.player_id, 'captain', 'captain')}
                      title="Make Captain"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={tp.is_wicket_keeper ? 'text-blue-600' : 'text-muted-foreground'}
                      onClick={() => handleToggleRole(tp.player_id, 'wk', 'wk')}
                      title="Make Wicket Keeper"
                    >
                      <Shield className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemovePlayer(tp.player_id)}
                      title="Remove from Team"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(!team.players || team.players.length === 0) && (
              <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                No players added to this team yet.
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          {stats ? (
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total_matches}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Win/Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {stats.wins} <span className="text-muted-foreground text-lg font-normal">/</span> <span className="text-red-500">{stats.losses}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Highest Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.highest_total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">No Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{stats.no_results}</div>
                </CardContent>
              </Card>
              
              {stats.leading_scorer && (
                <Card className="md:col-span-2 bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Top Run Scorer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.leading_scorer.name}</div>
                    <div className="text-muted-foreground">{stats.leading_scorer.runs} runs</div>
                  </CardContent>
                </Card>
              )}
              
              {stats.leading_wicket_taker && (
                <Card className="md:col-span-2 bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Top Wicket Taker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.leading_wicket_taker.name}</div>
                    <div className="text-muted-foreground">{stats.leading_wicket_taker.wickets} wickets</div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              Stats not available yet. Team must complete matches.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
