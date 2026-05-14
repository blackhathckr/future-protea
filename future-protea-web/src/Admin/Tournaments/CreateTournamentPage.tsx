/**
 * @fileoverview Create Tournament Page
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import { TournamentService } from '@/services/cricket/tournament.service'
import { TournamentLogoUpload } from './components/TournamentLogoUpload'
import { toast } from 'sonner'

export function CreateTournamentPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    overs: '',
    start_date: '',
    end_date: '',
    venue: '',
    organizer: '',
    description: '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.type || !formData.start_date || !formData.end_date) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      const tournament = await TournamentService.createTournament({
        ...formData,
        overs: formData.overs ? parseInt(formData.overs) : undefined,
      })
      
      if (logoFile) {
        try {
          await TournamentService.uploadTournamentLogo(tournament.id, logoFile)
        } catch (error) {
          toast.error('Tournament created but logo upload failed')
        }
      }

      toast.success('Tournament created successfully')
      navigate('/tournaments')
    } catch (error) {
      toast.error('Failed to create tournament')
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/tournaments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Tournament</h1>
          <p className="text-muted-foreground">Set up a new cricket tournament</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournament Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="logo">Tournament Logo (Optional)</Label>
              <TournamentLogoUpload onLogoChange={(file) => setLogoFile(file)} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter tournament name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Format *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T20">T20</SelectItem>
                    <SelectItem value="ODI">ODI (50 Overs)</SelectItem>
                    <SelectItem value="Test">Test Match</SelectItem>
                    <SelectItem value="T10">T10</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="overs">Overs (per innings)</Label>
                <Input
                  id="overs"
                  type="number"
                  placeholder="e.g. 20"
                  value={formData.overs}
                  onChange={(e) => setFormData({ ...formData, overs: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  placeholder="e.g. Wanderers Stadium"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizer">Organizer</Label>
                <Input
                  id="organizer"
                  placeholder="e.g. Cricket South Africa"
                  value={formData.organizer}
                  onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter tournament description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Tournament'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/tournaments')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
