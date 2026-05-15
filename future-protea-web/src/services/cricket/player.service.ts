import api from '@/lib/api'

export interface Player {
  id: string
  name: string
  email: string
  phone?: string | null
  date_of_birth?: string | null
  batting_style?: string | null
  bowling_style?: string | null
  playing_role?: string | null
  photo_url?: string | null
  approved: boolean
  created_at: string
  role?: string
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

export interface PlayerCareerStats {
  total_matches: number
  total_runs: number
  highest_score: number
  total_balls_faced: number
  total_fours: number
  total_sixes: number
  fifties: number
  hundreds: number
  total_wickets: number
  total_catches: number
  strike_rate: number
  batting_average: number
  total_overs_bowled: number
  total_runs_conceded: number
  bowling_economy: number
  bowling_average: number
  best_bowling: string
}

export interface PlayerMatchRow {
  id: string
  match_id: string
  player_id: string
  team: string
  runs_scored: number
  balls_faced: number
  fours: number
  sixes: number
  is_out: boolean
  out_type?: string | null
  overs_bowled: number
  runs_conceded: number
  wickets_taken: number
  catches: number
  team1_name: string
  team2_name: string
  match_date: string
  match_status: string
  team1_score: number
  team1_wickets: number
  team2_score: number
  team2_wickets: number
  venue?: string
  winner?: string | null
}

export interface PlayerJourney {
  player: {
    id: string
    name: string
    email?: string
    batting_style?: string | null
    bowling_style?: string | null
    phone?: string | null
    photo_url?: string | null
  }
  career_stats: PlayerCareerStats
  matches: PlayerMatchRow[]
}

export interface TopPlayersResponse {
  top_run_scorers: Array<{ player_id: string; player_name: string; matches_played: number; total_runs: number }>
  top_wicket_takers: Array<{ player_id: string; player_name: string; matches_played: number; total_wickets: number }>
}

class PlayerService {
  static async getPlayers(): Promise<Player[]> {
    const response = await api.get('/players')
    return Array.isArray(response.data) ? response.data : []
  }

  /** All players (admin + non-admin), de-duped by name. */
  static async getAllPlayers(): Promise<Player[]> {
    const response = await api.get('/players/all')
    return Array.isArray(response.data) ? response.data : []
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

  static async approvePlayer(id: string): Promise<{ message: string }> {
    const response = await api.post(`/players/${id}/approve`)
    return response.data
  }

  /** Photo upload uses the RegisteredPlayer endpoint. */
  static async uploadPlayerPhoto(registeredPlayerId: string, file: File): Promise<any> {
    const formData = new FormData()
    formData.append('photo', file)
    const response = await api.post(`/players/registered-players/${registeredPlayerId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  /** Career history + per-match rows by player id. */
  static async getPlayerJourney(id: string): Promise<PlayerJourney> {
    const response = await api.get(`/players/${id}/journey`)
    return response.data
  }

  /** Career history by display name (when only the name is known). */
  static async getPlayerJourneyByName(name: string): Promise<PlayerJourney> {
    const response = await api.get('/players/journey-by-name', { params: { name } })
    return response.data
  }

  /** Authenticated user's own player profile + upcoming matches. */
  static async getMyProfile(): Promise<any> {
    const response = await api.get('/players/me/profile')
    return response.data
  }

  static async getTopPlayers(): Promise<TopPlayersResponse> {
    const response = await api.get('/players/top')
    return response.data
  }
}

export default PlayerService
export { PlayerService }
