import api from '@/lib/api'

export interface MatchPlayerEmbedded {
  id: string
  match_id: string
  player_id: string
  team: string
  status: string
  name: string
  batting_style?: string
  bowling_style?: string
  is_captain: boolean
  is_wicket_keeper: boolean
  is_playing?: boolean
}

export interface MatchScoreEmbedded {
  id: string
  match_id: string
  player_id: string
  team: string
  name: string
  runs_scored: number
  balls_faced: number
  fours: number
  sixes: number
  is_out: boolean
  out_type?: string | null
  dismissed_by?: string | null
  fielder?: string | null
  overs_bowled: number
  runs_conceded: number
  wickets_taken: number
  maidens: number
  catches: number
  run_outs: number
}

export interface MatchInningsEmbedded {
  id: string
  innings_number: number
  total_runs: number
  total_wickets: number
  total_overs: number
  target_runs?: number | null
  status: string
  striker_id?: string | null
  non_striker_id?: string | null
  current_bowler_id?: string | null
}

export interface Match {
  id: string
  team1_name: string
  team2_name: string
  team1_id?: string | null
  team2_id?: string | null
  team1_logo_url?: string | null
  team2_logo_url?: string | null
  team1_player_count?: number
  team2_player_count?: number
  venue: string
  match_date: string
  status: 'upcoming' | 'live' | 'completed'
  total_overs: number
  balls_per_over?: number
  match_type?: string | null
  current_innings: number
  team1_score: number
  team1_wickets: number
  team1_overs: number
  team2_score: number
  team2_wickets: number
  team2_overs: number
  toss_winner?: string | null
  toss_decision?: string | null
  winner?: string | null
  winner_team_id?: string | null
  result_type?: string | null
  result_margin?: number | null
  umpire?: string | null
  player_of_match?: string | null
  player_of_match_id?: string | null
  tournament_id?: string | null
  created_by?: string
  created_by_name?: string | null
  // Embedded on getMatchById
  players?: MatchPlayerEmbedded[]
  scores?: MatchScoreEmbedded[]
  match_innings?: MatchInningsEmbedded[]
}

export interface CreateMatchData {
  team1_name: string
  team2_name: string
  team1_id?: string
  team2_id?: string
  venue: string
  match_date: string
  total_overs: number
  balls_per_over?: number
  match_type?: string
  umpire?: string
  tournament_id?: string
}

class MatchService {
  static async getMatches(status?: string, limit?: number): Promise<Match[]> {
    const params: Record<string, string | number> = {}
    if (status) params.status = status
    if (limit) params.limit = limit
    const response = await api.get('/matches', { params })
    return Array.isArray(response.data) ? response.data : []
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

  static async getBallByBall(matchId: string, innings?: number): Promise<any> {
    const params = innings ? { innings } : {}
    const response = await api.get(`/matches/${matchId}/balls`, { params })
    return response.data
  }
}

export default MatchService
export { MatchService }
