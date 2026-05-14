/**
 * @fileoverview Register Player Page
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
import { PlayerService } from '@/services/cricket/player.service'
import { toast } from 'sonner'

export function RegisterPlayerPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    date_of_birth: '',
    batting_style: '',
    bowling_style: '',
    playing_role: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      await PlayerService.createPlayer({
        ...formData,
        phone: formData.phone || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        batting_style: formData.batting_style || undefined,
        bowling_style: formData.bowling_style || undefined,
        playing_role: formData.playing_role || undefined,
      })
      toast.success('Player registered successfully')
      navigate('/players')
    } catch (error) {
      toast.error('Failed to register player')
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/players')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Register Player</h1>
          <p className="text-muted-foreground">Add a new cricket player</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Player Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter player name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="player@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+27 123 456 7890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Playing Role</Label>
                <Select
                  value={formData.playing_role || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, playing_role: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Batsman">Batsman</SelectItem>
                    <SelectItem value="Bowler">Bowler</SelectItem>
                    <SelectItem value="All-rounder">All-rounder</SelectItem>
                    <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batting">Batting Style</Label>
                <Select
                  value={formData.batting_style || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, batting_style: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select batting style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Right-hand bat">Right-hand bat</SelectItem>
                    <SelectItem value="Left-hand bat">Left-hand bat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bowling">Bowling Style</Label>
                <Select
                  value={formData.bowling_style || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, bowling_style: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bowling style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Right-arm fast">Right-arm fast</SelectItem>
                    <SelectItem value="Left-arm fast">Left-arm fast</SelectItem>
                    <SelectItem value="Right-arm medium">Right-arm medium</SelectItem>
                    <SelectItem value="Left-arm medium">Left-arm medium</SelectItem>
                    <SelectItem value="Right-arm spin">Right-arm spin</SelectItem>
                    <SelectItem value="Left-arm spin">Left-arm spin</SelectItem>
                    <SelectItem value="Leg-spin">Leg-spin</SelectItem>
                    <SelectItem value="Off-spin">Off-spin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register Player'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/players')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
