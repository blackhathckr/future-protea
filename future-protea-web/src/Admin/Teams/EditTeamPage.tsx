import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import { TeamService, type Team } from '@/services/cricket/team.service'
import { TeamLogoUpload } from './components/TeamLogoUpload'
import { toast } from 'sonner'

export function EditTeamPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [formData, setFormData] = useState({
    team_name: '',
    team_type: '',
    school_name: '',
    club_name: '',
  })

  useEffect(() => {
    if (id) loadTeam(id)
  }, [id])

  const loadTeam = async (teamId: string) => {
    try {
      setFetching(true)
      const data = await TeamService.getTeamById(teamId)
      setTeam(data)
      setFormData({
        team_name: data.team_name || '',
        team_type: data.team_type || '',
        school_name: data.school_name || '',
        club_name: data.club_name || '',
      })
    } catch (error) {
      toast.error('Failed to load team')
      navigate('/teams')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!id) return
    if (!formData.team_name.trim() || !formData.team_type) {
      toast.error('Please enter team name and select team type')
      return
    }

    try {
      setLoading(true)
      await TeamService.updateTeam(id, {
        team_name: formData.team_name.trim(),
        team_type: formData.team_type,
        school_name: formData.team_type === 'school' ? formData.school_name : undefined,
        club_name: formData.team_type === 'club' ? formData.club_name : undefined,
      })
      
      toast.success('Team updated successfully')
      navigate('/teams')
    } catch (error) {
      toast.error('Failed to update team')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teams')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Team</h1>
          <p className="text-muted-foreground">Update team information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="logo">Team Logo</Label>
              <TeamLogoUpload 
                teamId={id} 
                currentLogoUrl={team?.logo_url} 
                onLogoUploaded={(url) => setTeam(prev => prev ? { ...prev, logo_url: url } : prev)}
                onLogoDeleted={() => setTeam(prev => prev ? { ...prev, logo_url: undefined } : prev)}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter team name"
                  value={formData.team_name}
                  onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team_type">Team Type *</Label>
                <Select
                  value={formData.team_type}
                  onValueChange={(v) => setFormData({ ...formData, team_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="club">Club</SelectItem>
                    <SelectItem value="academy">Academy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.team_type === 'school' && (
                <div className="space-y-2">
                  <Label htmlFor="school_name">School Name</Label>
                  <Input
                    id="school_name"
                    placeholder="Enter school name"
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                  />
                </div>
              )}

              {formData.team_type === 'club' && (
                <div className="space-y-2">
                  <Label htmlFor="club_name">Club Name</Label>
                  <Input
                    id="club_name"
                    placeholder="Enter club name"
                    value={formData.club_name}
                    onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/teams')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
