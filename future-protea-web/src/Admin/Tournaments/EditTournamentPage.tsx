import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import { TournamentService, type Tournament } from '@/services/cricket/tournament.service'
import { TournamentLogoUpload } from './components/TournamentLogoUpload'
import { toast } from 'sonner'

export function EditTournamentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    overs: '',
    start_date: '',
    end_date: '',
    venue: '',
    organizer: '',
    description: '',
    status: '',
  })

  useEffect(() => {
    if (id) loadTournament(id)
  }, [id])

  const loadTournament = async (tournamentId: string) => {
    try {
      setFetching(true)
      const data = await TournamentService.getTournamentById(tournamentId)
      setTournament(data)
      setFormData({
        name: data.name || '',
        type: data.type || '',
        overs: data.overs ? data.overs.toString() : '',
        start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
        end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '',
        venue: data.venue || '',
        organizer: data.organizer || '',
        description: data.description || '',
        status: data.status || '',
      })
    } catch (error) {
      toast.error('Failed to load tournament')
      navigate('/tournaments')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!id) return
    if (!formData.name || !formData.type || !formData.start_date || !formData.end_date) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      await TournamentService.updateTournament(id, {
        name: formData.name,
        type: formData.type,
        overs: formData.overs ? parseInt(formData.overs) : undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        venue: formData.venue,
        organizer: formData.organizer,
        description: formData.description,
        status: formData.status as any,
      })
      
      toast.success('Tournament updated successfully')
      navigate('/tournaments')
    } catch (error) {
      toast.error('Failed to update tournament')
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/tournaments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Tournament</h1>
          <p className="text-muted-foreground">Update tournament details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournament Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="logo">Tournament Logo</Label>
              <TournamentLogoUpload 
                tournamentId={id} 
                currentLogoUrl={tournament?.logo_url} 
                onLogoUploaded={(url) => setTournament(prev => prev ? { ...prev, logo_url: url } : prev)}
                onLogoDeleted={() => setTournament(prev => prev ? { ...prev, logo_url: undefined } : prev)}
              />
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
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="in_progress">In Progress (Active)</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
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
                {loading ? 'Saving...' : 'Save Changes'}
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
