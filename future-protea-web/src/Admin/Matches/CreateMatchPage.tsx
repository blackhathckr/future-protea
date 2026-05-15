/**
 * @fileoverview Create Match Page
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import { MatchService } from '@/services/cricket/match.service'
import { TournamentService, type Tournament } from '@/services/cricket/tournament.service'
import { toast } from 'sonner'

export function CreateMatchPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [formData, setFormData] = useState({
    team1_name: '',
    team2_name: '',
    venue: '',
    match_date: '',
    total_overs: 20,
    tournament_id: '',
  })

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    try {
      const data = await TournamentService.getTournaments()
      setTournaments(data)
    } catch (error) {
      console.error('Failed to load tournaments')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.team1_name || !formData.team2_name || !formData.venue || !formData.match_date) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      await MatchService.createMatch({
        ...formData,
        // Radix Select can't have an item with value="", so the "None" option
        // uses the "__none__" sentinel below. Translate it back to undefined
        // for the API.
        tournament_id:
          formData.tournament_id && formData.tournament_id !== '__none__'
            ? formData.tournament_id
            : undefined,
      })
      toast.success('Match created successfully')
      navigate('/matches')
    } catch (error: any) {
      // Surface the actual server error so 403 / 400 / 500 are distinguishable.
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create match'
      toast.error(message)
      console.error('Create match failed:', error?.response?.data || error)
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/matches')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Match</h1>
          <p className="text-muted-foreground">Schedule a new cricket match</p>
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
                <Label htmlFor="team1">Team 1 *</Label>
                <Input
                  id="team1"
                  placeholder="Enter team 1 name"
                  value={formData.team1_name}
                  onChange={(e) => setFormData({ ...formData, team1_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team2">Team 2 *</Label>
                <Input
                  id="team2"
                  placeholder="Enter team 2 name"
                  value={formData.team2_name}
                  onChange={(e) => setFormData({ ...formData, team2_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue *</Label>
                <Input
                  id="venue"
                  placeholder="Enter venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Match Date *</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.match_date}
                  onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="overs">Total Overs *</Label>
                <Select
                  value={formData.total_overs.toString()}
                  onValueChange={(v) => setFormData({ ...formData, total_overs: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Overs</SelectItem>
                    <SelectItem value="10">10 Overs</SelectItem>
                    <SelectItem value="20">20 Overs (T20)</SelectItem>
                    <SelectItem value="50">50 Overs (ODI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tournament">Tournament (Optional)</Label>
                <Select
                  value={formData.tournament_id || '__none__'}
                  onValueChange={(v) => setFormData({ ...formData, tournament_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tournament" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Radix Select forbids value=""; use a sentinel and
                        translate it back to undefined on submit. */}
                    <SelectItem value="__none__">None</SelectItem>
                    {tournaments.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Match'}
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
