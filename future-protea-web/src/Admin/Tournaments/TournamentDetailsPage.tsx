import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trophy, Plus, Calendar, Activity, Users, Trash2, Upload } from 'lucide-react'
import { TournamentService, type Fixture, type Standing, type TournamentStats } from '@/services/cricket/tournament.service'
import { TeamService, type Team } from '@/services/cricket/team.service'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Helper for NRR colors
const NrrDisplay = ({ nrr }: { nrr: number }) => (
  <span className={nrr > 0 ? 'text-green-600' : nrr < 0 ? 'text-red-500' : ''}>
    {nrr > 0 ? `+${nrr}` : nrr}
  </span>
)

export function TournamentDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [tournament, setTournament] = useState<any | null>(null)
  
  // Data State
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [standings, setStandings] = useState<Standing[]>([])
  const [stats, setStats] = useState<TournamentStats | null>(null)
  const [allTeams, setAllTeams] = useState<Team[]>([])

  // Dialog States
  const [addTeamDialogOpen, setAddTeamDialogOpen] = useState(false)
  const [selectedTeamToAdd, setSelectedTeamToAdd] = useState('')
  const [teamGroup, setTeamGroup] = useState('')
  
  const [createFixtureDialogOpen, setCreateFixtureDialogOpen] = useState(false)
  const [fixtureData, setFixtureData] = useState({
    team1_name: '', team2_name: '', match_date: '', venue: '', group_name: ''
  })
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [deletingTournament, setDeletingTournament] = useState(false)

  useEffect(() => {
    if (id) {
      loadTournamentData(id)
      loadAllTeams()
    }
  }, [id])

  const loadTournamentData = async (tourneyId: string) => {
    try {
      setLoading(true)
      const data = await TournamentService.getTournamentById(tourneyId)
      setTournament(data)
      
      // Load tabs data concurrently
      const [fix, std, sts] = await Promise.all([
        TournamentService.getTournamentFixtures(tourneyId),
        TournamentService.getTournamentStandings(tourneyId),
        TournamentService.getTournamentStats(tourneyId),
      ])
      
      setFixtures(fix)
      setStandings(std)
      setStats(sts)
      
    } catch (error) {
      toast.error('Failed to load tournament details')
      navigate('/tournaments')
    } finally {
      setLoading(false)
    }
  }

  const loadAllTeams = async () => {
    try {
      const data = await TeamService.getTeams()
      setAllTeams(data)
    } catch (e) {
      console.error('Failed to load teams')
    }
  }

  // --- Handlers ---
  
  const handleAddTeam = async () => {
    if (!id || !selectedTeamToAdd) return
    try {
      await TournamentService.addTeamToTournament(id, selectedTeamToAdd, teamGroup || undefined)
      toast.success('Team added to tournament')
      setAddTeamDialogOpen(false)
      setSelectedTeamToAdd('')
      setTeamGroup('')
      loadTournamentData(id)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add team')
    }
  }

  const handleCreateFixture = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !fixtureData.team1_name || !fixtureData.team2_name || !fixtureData.match_date) return
    try {
      await TournamentService.createFixture(id, fixtureData)
      toast.success('Fixture created')
      setCreateFixtureDialogOpen(false)
      setFixtureData({ team1_name: '', team2_name: '', match_date: '', venue: '', group_name: '' })
      loadTournamentData(id)
    } catch (error) {
      toast.error('Failed to create fixture')
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    
    try {
      setUploadingLogo(true)
      const updated = await TournamentService.uploadTournamentLogo(id, file)
      setTournament(updated)
      toast.success('Logo uploaded successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleDeleteLogo = async () => {
    if (!id) return
    try {
      setUploadingLogo(true)
      const updated = await TournamentService.deleteTournamentLogo(id)
      setTournament(updated)
      toast.success('Logo deleted successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleDeleteTournament = async () => {
    if (!id || !confirm('Are you sure you want to delete this tournament?')) return
    try {
      setDeletingTournament(true)
      await TournamentService.deleteTournament(id)
      toast.success('Tournament deleted successfully')
      navigate('/tournaments')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete tournament')
      setDeletingTournament(false)
    }
  }

  // --- UI ---
  
  if (loading || !tournament) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const availableTeams = allTeams.filter(t => !tournament.teams?.some((tt: any) => tt.team_id === t.id))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tournaments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {tournament.logo_url ? (
                <img src={tournament.logo_url} alt="Logo" className="w-16 h-16 rounded-full object-cover bg-white" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                  <Upload className="h-4 w-4 text-white hover:text-primary" />
                </label>
                {tournament.logo_url && (
                  <button
                    onClick={handleDeleteLogo}
                    disabled={uploadingLogo}
                    className="text-white hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                {tournament.name}
                <Badge variant={tournament.status === 'in_progress' ? 'default' : 'secondary'}>
                  {tournament.status.replace('_', ' ')}
                </Badge>
              </h1>
              <p className="text-muted-foreground">
                {tournament.type} ({tournament.overs} Overs) &bull; {new Date(tournament.start_date).toLocaleDateString()} to {new Date(tournament.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/tournaments/${tournament.id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDeleteTournament} disabled={deletingTournament}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="teams"><Users className="w-4 h-4 mr-2"/> Teams</TabsTrigger>
          <TabsTrigger value="fixtures"><Calendar className="w-4 h-4 mr-2"/> Fixtures</TabsTrigger>
          <TabsTrigger value="standings"><Trophy className="w-4 h-4 mr-2"/> Standings</TabsTrigger>
          <TabsTrigger value="stats"><Activity className="w-4 h-4 mr-2"/> Stats</TabsTrigger>
        </TabsList>
        
        {/* TEAMS TAB */}
        <TabsContent value="teams" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Participating Teams ({tournament.teams?.length || 0})</h2>
            
            <Dialog open={addTeamDialogOpen} onOpenChange={setAddTeamDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Add Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team to Tournament</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Team</Label>
                    <Select value={selectedTeamToAdd} onValueChange={setSelectedTeamToAdd}>
                      <SelectTrigger>
                        <SelectValue placeholder="Search teams..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTeams.length === 0 ? (
                          <SelectItem value="none" disabled>No teams available</SelectItem>
                        ) : (
                          availableTeams.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.team_name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Group (Optional)</Label>
                    <Input 
                      placeholder="e.g. Group A" 
                      value={teamGroup} 
                      onChange={e => setTeamGroup(e.target.value)} 
                    />
                  </div>
                  <Button className="w-full" onClick={handleAddTeam} disabled={!selectedTeamToAdd || selectedTeamToAdd === 'none'}>
                    Add Team
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tournament.teams?.map((tt: any) => (
              <Card key={tt.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{tt.team_name}</CardTitle>
                    {tt.group_name && <Badge variant="outline">{tt.group_name}</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Played: {tt.played} &bull; Won: {tt.won}</p>
                </CardContent>
              </Card>
            ))}
            {(!tournament.teams || tournament.teams.length === 0) && (
              <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                No teams added yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* FIXTURES TAB */}
        <TabsContent value="fixtures" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Match Schedule</h2>
            
            <Dialog open={createFixtureDialogOpen} onOpenChange={setCreateFixtureDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Create Fixture
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Fixture</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateFixture} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Team 1 Name *</Label>
                      <Input required value={fixtureData.team1_name} onChange={e => setFixtureData({...fixtureData, team1_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Team 2 Name *</Label>
                      <Input required value={fixtureData.team2_name} onChange={e => setFixtureData({...fixtureData, team2_name: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Date & Time *</Label>
                    <Input type="datetime-local" required value={fixtureData.match_date} onChange={e => setFixtureData({...fixtureData, match_date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <Input value={fixtureData.venue} onChange={e => setFixtureData({...fixtureData, venue: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Group / Stage</Label>
                    <Input placeholder="e.g. Semi-Final" value={fixtureData.group_name} onChange={e => setFixtureData({...fixtureData, group_name: e.target.value})} />
                  </div>
                  <Button type="submit" className="w-full">Create</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {fixtures.map((fix) => (
              <Card key={fix.id}>
                <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1 text-center md:text-right font-semibold text-lg">{fix.team1_name}</div>
                  <div className="shrink-0 flex flex-col items-center px-4">
                    <Badge variant="outline" className="mb-2 text-xs">{fix.group_name || 'Match'}</Badge>
                    <div className="text-sm font-medium">vs</div>
                    <div className="text-xs text-muted-foreground mt-1 text-center">
                      {new Date(fix.match_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      {fix.venue && <><br/>{fix.venue}</>}
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left font-semibold text-lg">{fix.team2_name}</div>
                  
                  {/* Results if match is over */}
                  {(fix.team1_score !== null || fix.team2_score !== null) && (
                    <div className="w-full md:w-auto md:ml-auto mt-4 md:mt-0 p-3 bg-muted/30 rounded-lg text-sm text-center md:text-right">
                      <div className="font-semibold text-primary">Result</div>
                      <div>{fix.team1_name}: {fix.team1_score}/{fix.team1_wickets} ({fix.team1_overs} ov)</div>
                      <div>{fix.team2_name}: {fix.team2_score}/{fix.team2_wickets} ({fix.team2_overs} ov)</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {fixtures.length === 0 && (
              <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                No fixtures scheduled.
              </div>
            )}
          </div>
        </TabsContent>

        {/* STANDINGS TAB */}
        <TabsContent value="standings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Points Table</CardTitle>
            </CardHeader>
            <CardContent>
              {standings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3">Team</th>
                        <th className="px-4 py-3">Group</th>
                        <th className="px-4 py-3 text-center">P</th>
                        <th className="px-4 py-3 text-center">W</th>
                        <th className="px-4 py-3 text-center">L</th>
                        <th className="px-4 py-3 text-center">NR</th>
                        <th className="px-4 py-3 text-center font-bold">Pts</th>
                        <th className="px-4 py-3 text-right">NRR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((s, idx) => (
                        <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-semibold flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">{idx + 1}</span>
                            {s.team_name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{s.group_name || '-'}</td>
                          <td className="px-4 py-3 text-center">{s.played}</td>
                          <td className="px-4 py-3 text-center text-green-600">{s.won}</td>
                          <td className="px-4 py-3 text-center text-red-500">{s.lost}</td>
                          <td className="px-4 py-3 text-center text-yellow-600">{s.no_result}</td>
                          <td className="px-4 py-3 text-center font-bold text-primary">{s.points}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs"><NrrDisplay nrr={s.nrr} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Standings will appear here once teams are added and matches are played.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* STATS TAB */}
        <TabsContent value="stats" className="mt-6">
          {stats && (stats.top_scorers?.length > 0 || stats.top_wicket_takers?.length > 0) ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Trophy className="w-4 h-4"/> Top Run Scorers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {stats.top_scorers.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-muted-foreground w-4">{i + 1}</span>
                          <span className="font-semibold">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg">{p.runs}</span>
                          <span className="text-xs text-muted-foreground ml-1">runs</span>
                          <div className="text-xs text-muted-foreground">SR: {p.strike_rate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Activity className="w-4 h-4"/> Top Wicket Takers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {stats.top_wicket_takers.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-muted-foreground w-4">{i + 1}</span>
                          <span className="font-semibold">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg text-primary">{p.wickets}</span>
                          <span className="text-xs text-muted-foreground ml-1">wkts</span>
                          <div className="text-xs text-muted-foreground">Econ: {p.economy}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Best Bowling Figures */}
              {stats.best_bowling && stats.best_bowling.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Best Bowling Figures</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4">
                      {stats.best_bowling.map((b, i) => (
                        <div key={i} className="flex-1 min-w-[200px] bg-muted/40 p-4 rounded-lg border flex justify-between items-center">
                          <span className="font-medium">{b.name}</span>
                          <span className="font-bold text-xl font-mono text-primary">{b.figures}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              Stats will be generated as matches are completed.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
