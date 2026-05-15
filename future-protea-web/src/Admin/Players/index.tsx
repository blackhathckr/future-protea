/**
 * @fileoverview Player Management Page
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Users, Search, CheckCircle, XCircle, Eye } from 'lucide-react'
import { PlayerService, type Player } from '@/services/cricket/player.service'
import { toast } from 'sonner'
import { confirm } from '@/lib/confirm'

export function PlayersPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<Player[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    try {
      setLoading(true)
      const data = await PlayerService.getPlayers()
      setPlayers(data)
    } catch (error) {
      toast.error('Failed to load players')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete this player?', confirmLabel: 'Delete' })
    if (!ok) return

    try {
      await PlayerService.deletePlayer(id)
      toast.success('Player deleted successfully')
      loadPlayers()
    } catch (error) {
      toast.error('Failed to delete player')
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await PlayerService.approvePlayer(id)
      toast.success('Player approved successfully')
      loadPlayers()
    } catch (error) {
      toast.error('Failed to approve player')
    }
  }

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingPlayers = filteredPlayers.filter(p => !p.approved)
  const approvedPlayers = filteredPlayers.filter(p => p.approved)

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Players</h1>
          <p className="text-muted-foreground">Manage cricket players</p>
        </div>
        <Button onClick={() => navigate('/players/register')}>
          <Plus className="mr-2 h-4 w-4" />
          Register Player
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search players by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Pending Approvals */}
      {pendingPlayers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <XCircle className="h-5 w-5 text-orange-600" />
            Pending Approval ({pendingPlayers.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingPlayers.map((player) => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                onDelete={handleDelete}
                onApprove={handleApprove}
              />
            ))}
          </div>
        </div>
      )}

      {/* Approved Players */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Approved Players ({approvedPlayers.length})
        </h2>
        {approvedPlayers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {approvedPlayers.map((player) => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No approved players found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  )
}

function PlayerCard({ 
  player, 
  onDelete, 
  onApprove 
}: { 
  player: Player
  onDelete: (id: string) => void
  onApprove?: (id: string) => void
}) {
  const navigate = useNavigate()

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {player.photo_url ? (
              <img 
                src={player.photo_url} 
                alt={player.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {player.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-base">{player.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{player.email}</p>
            </div>
          </div>
          {!player.approved && (
            <Badge variant="secondary">Pending</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {player.playing_role && (
          <div className="text-sm">
            <span className="font-medium">Role:</span> {player.playing_role}
          </div>
        )}
        {player.batting_style && (
          <div className="text-sm">
            <span className="font-medium">Batting:</span> {player.batting_style}
          </div>
        )}
        {player.bowling_style && (
          <div className="text-sm">
            <span className="font-medium">Bowling:</span> {player.bowling_style}
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          {!player.approved && onApprove && (
            <Button
              size="sm"
              onClick={() => onApprove(player.id)}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          )}
          {player.approved && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/players/${player.id}/journey`)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" /> Journey
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/players/${player.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(player.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
