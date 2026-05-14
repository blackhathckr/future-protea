/**
 * @fileoverview Edit Match Page
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import { MatchService, type Match } from '@/services/cricket/match.service'
import { toast } from 'sonner'

export function EditMatchPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    team1_name: '',
    team2_name: '',
    venue: '',
    match_date: '',
    total_overs: 20,
    status: 'upcoming',
    toss_winner: '',
    toss_decision: '',
    team1_score: 0,
    team1_wickets: 0,
    team1_overs: 0,
    team2_score: 0,
    team2_wickets: 0,
    team2_overs: 0,
    winner: '',
  })

  useEffect(() => {
    if (id) {
      loadMatch(id)
    }
  }, [id])

  const loadMatch = async (matchId: string) => {
    try {
      setLoading(true)
      const data = await MatchService.getMatchById(matchId)
      setFormData({
        team1_name: data.team1_name || '',
        team2_name: data.team2_name || '',
        venue: data.venue || '',
        match_date: data.match_date ? new Date(data.match_date).toISOString().slice(0, 16) : '',
        total_overs: data.total_overs || 20,
        status: data.status || 'upcoming',
        toss_winner: data.toss_winner || '',
        toss_decision: data.toss_decision || '',
        team1_score: data.team1_score || 0,
        team1_wickets: data.team1_wickets || 0,
        team1_overs: data.team1_overs || 0,
        team2_score: data.team2_score || 0,
        team2_wickets: data.team2_wickets || 0,
        team2_overs: data.team2_overs || 0,
        winner: data.winner || '',
      })
    } catch (error) {
      toast.error('Failed to load match')
      navigate('/matches')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.team1_name || !formData.team2_name) {
      toast.error('Please fill in team names')
      return
    }

    try {
      setSaving(true)
      await MatchService.updateMatch(id!, formData as any)
      toast.success('Match updated successfully')
      navigate('/matches')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update match')
    } finally {
      setSaving(false)
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/matches')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Match</h1>
          <p className="text-muted-foreground">Update match information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Match Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="team1">Team 1 Name *</Label>
                <Input
                  id="team1"
                  placeholder="Team 1"
                  value={formData.team1_name}
                  onChange={(e) => setFormData({ ...formData, team1_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team2">Team 2 Name *</Label>
                <Input
                  id="team2"
                  placeholder="Team 2"
                  value={formData.team2_name}
                  onChange={(e) => setFormData({ ...formData, team2_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  placeholder="Match venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Match Date & Time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.match_date}
                  onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="overs">Total Overs</Label>
                <Input
                  id="overs"
                  type="number"
                  value={formData.total_overs}
                  onChange={(e) => setFormData({ ...formData, total_overs: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(formData.status === 'live' || formData.status === 'completed') && (
              <>
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Match Score</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-medium">{formData.team1_name}</h4>
                      <div className="space-y-2">
                        <Label>Runs</Label>
                        <Input
                          type="number"
                          value={formData.team1_score}
                          onChange={(e) => setFormData({ ...formData, team1_score: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Wickets</Label>
                        <Input
                          type="number"
                          value={formData.team1_wickets}
                          onChange={(e) => setFormData({ ...formData, team1_wickets: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Overs</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.team1_overs}
                          onChange={(e) => setFormData({ ...formData, team1_overs: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">{formData.team2_name}</h4>
                      <div className="space-y-2">
                        <Label>Runs</Label>
                        <Input
                          type="number"
                          value={formData.team2_score}
                          onChange={(e) => setFormData({ ...formData, team2_score: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Wickets</Label>
                        <Input
                          type="number"
                          value={formData.team2_wickets}
                          onChange={(e) => setFormData({ ...formData, team2_wickets: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Overs</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.team2_overs}
                          onChange={(e) => setFormData({ ...formData, team2_overs: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {formData.status === 'completed' && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Match Result</h3>
                    <div className="space-y-2">
                      <Label>Winner</Label>
                      <Select
                        value={formData.winner}
                        onValueChange={(v) => setFormData({ ...formData, winner: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select winner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Winner</SelectItem>
                          <SelectItem value={formData.team1_name}>{formData.team1_name}</SelectItem>
                          <SelectItem value={formData.team2_name}>{formData.team2_name}</SelectItem>
                          <SelectItem value="Draw">Draw</SelectItem>
                          <SelectItem value="No Result">No Result</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Toss Information</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Toss Winner</Label>
                  <Input
                    placeholder="Team name"
                    value={formData.toss_winner}
                    onChange={(e) => setFormData({ ...formData, toss_winner: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Toss Decision</Label>
                  <Select
                    value={formData.toss_decision}
                    onValueChange={(v) => setFormData({ ...formData, toss_decision: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="bat">Bat</SelectItem>
                      <SelectItem value="bowl">Bowl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/matches')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
