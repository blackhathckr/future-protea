import api from '@/lib/api'

export interface Player {
  id: string
  name: string
  email: string
  phone?: string
  date_of_birth?: string
  batting_style?: string
  bowling_style?: string
  playing_role?: string
  photo_url?: string
  approved: boolean
  created_at: string
}

export interface CreatePlayerData {
  name: string
  email: string
  password: string
  phone?: string
  date_of_birth?: string
  batting_style?: string
  bowling_style?: string
  playing_role?: string
}

class PlayerService {
  static async getPlayers(): Promise<Player[]> {
    const response = await api.get('/players')
    return response.data
  }

  static async getPlayerById(id: string): Promise<Player> {
    const response = await api.get(`/players/${id}`)
    return response.data
  }

  static async createPlayer(data: CreatePlayerData): Promise<Player> {
    const response = await api.post('/players', data)
    return response.data
  }

  static async updatePlayer(id: string, data: Partial<Player>): Promise<Player> {
    const response = await api.put(`/players/${id}`, data)
    return response.data
  }

  static async deletePlayer(id: string): Promise<void> {
    await api.delete(`/players/${id}`)
  }

  static async approvePlayer(id: string): Promise<Player> {
    const response = await api.post(`/players/${id}/approve`)
    return response.data
  }

  static async uploadPlayerPhoto(id: string, file: File): Promise<Player> {
    const formData = new FormData()
    formData.append('photo', file)
    const response = await api.post(`/players/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  static async getPlayerStats(id: string): Promise<any> {
    const response = await api.get(`/players/${id}/stats`)
    return response.data
  }

  static async getTopPlayers(): Promise<any> {
    const response = await api.get('/players/top')
    return response.data
  }
}

export default PlayerService
export { PlayerService }
