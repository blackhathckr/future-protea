/**
 * @fileoverview Create Team Page
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import { TeamService } from '@/services/cricket/team.service'
import { TeamLogoUpload } from './components/TeamLogoUpload'
import { toast } from 'sonner'

export function CreateTeamPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    team_name: '',
    team_type: '',
    school_name: '',
    club_name: '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.team_name.trim() || !formData.team_type) {
      toast.error('Please enter team name and select team type')
      return
    }

    try {
      setLoading(true)
      const team = await TeamService.createTeam({
        team_name: formData.team_name.trim(),
        team_type: formData.team_type,
        school_name: formData.team_type === 'school' ? formData.school_name : undefined,
        club_name: formData.team_type === 'club' ? formData.club_name : undefined,
      })
      
      // Upload logo if provided
      if (logoFile) {
        try {
          await TeamService.uploadTeamLogo(team.id, logoFile)
        } catch (error) {
          toast.error('Team created but logo upload failed')
        }
      }
      
      toast.success('Team created successfully')
      navigate('/teams')
    } catch (error) {
      toast.error('Failed to create team')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold">Create Team</h1>
          <p className="text-muted-foreground">Add a new cricket team</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="logo">Team Logo (Optional)</Label>
              <TeamLogoUpload onLogoChange={(file) => setLogoFile(file)} />
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
                {loading ? 'Creating...' : 'Create Team'}
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
