import api from '@/lib/api'

export interface Match {
  id: string
  team1_name: string
  team2_name: string
  venue: string
  match_date: string
  status: 'upcoming' | 'live' | 'completed'
  total_overs: number
  current_innings: number
  team1_score: number
  team1_wickets: number
  team1_overs: number
  team2_score: number
  team2_wickets: number
  team2_overs: number
  toss_winner?: string
  toss_decision?: string
  winner?: string
  tournament_id?: string
  created_by: string
}

export interface CreateMatchData {
  team1_name: string
  team2_name: string
  venue: string
  match_date: string
  total_overs: number
  tournament_id?: string
}

class MatchService {
  static async getMatches(status?: string): Promise<Match[]> {
    const params = status ? { status } : {}
    const response = await api.get('/matches', { params })
    return response.data
  }

  static async getMatchById(id: string): Promise<Match> {
    const response = await api.get(`/matches/${id}`)
    return response.data
  }

  static async createMatch(data: CreateMatchData): Promise<Match> {
    const response = await api.post('/matches', data)
    return response.data
  }

  static async updateMatch(id: string, data: Partial<Match>): Promise<Match> {
    const response = await api.put(`/matches/${id}`, data)
    return response.data
  }

  static async deleteMatch(id: string): Promise<void> {
    await api.delete(`/matches/${id}`)
  }

  static async getScorecard(matchId: string): Promise<any> {
    const response = await api.get(`/matches/${matchId}/scorecard`)
    return response.data
  }

  static async getBallByBall(matchId: string): Promise<any> {
    const response = await api.get(`/matches/${matchId}/balls`)
    return response.data
  }
}

export default MatchService
export { MatchService }
