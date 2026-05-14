import api from '@/lib/api'

export interface Tournament {
  id: string
  name: string
  type: string
  overs: number
  start_date: string
  end_date: string
  venue?: string
  organizer?: string
  logo_url?: string
  status: 'upcoming' | 'in_progress' | 'completed'
  description?: string
  created_by: string
  created_at: string
}

export interface CreateTournamentData {
  name: string
  type?: string
  overs?: number
  start_date: string
  end_date: string
  venue?: string
  organizer?: string
  description?: string
}

export interface Fixture {
  id: string
  tournament_id: string
  team1_name: string
  team2_name: string
  match_date: string
  venue?: string
  group_name?: string
  match_id?: string
  team1_score?: number
  team1_wickets?: number
  team1_overs?: number
  team2_score?: number
  team2_wickets?: number
  team2_overs?: number
  player_of_match?: string
}

export interface Standing {
  id: string
  tournament_id: string
  team_id: string
  team_name: string
  group_name?: string
  played: number
  won: number
  lost: number
  no_result: number
  points: number
  nrr: number
}

export interface TournamentStats {
  top_scorers: any[]
  top_wicket_takers: any[]
  best_bowling: any[]
  most_fours: any[]
  most_sixes: any[]
}

class TournamentService {
  static async getTournaments(): Promise<Tournament[]> {
    const response = await api.get('/tournaments')
    return response.data
  }

  static async getTournamentById(id: string): Promise<Tournament> {
    const response = await api.get(`/tournaments/${id}`)
    return response.data
  }

  static async createTournament(data: CreateTournamentData): Promise<Tournament> {
    const response = await api.post('/tournaments', data)
    return response.data
  }

  static async updateTournament(id: string, data: Partial<Tournament>): Promise<Tournament> {
    const response = await api.put(`/tournaments/${id}`, data)
    return response.data
  }

  static async deleteTournament(id: string): Promise<void> {
    await api.delete(`/tournaments/${id}`)
  }

  static async getTournamentMatches(id: string): Promise<any[]> {
    const response = await api.get(`/tournaments/${id}/matches`)
    return response.data
  }

  static async uploadTournamentLogo(id: string, file: File): Promise<Tournament> {
    const formData = new FormData()
    formData.append('logo', file)
    const response = await api.post(`/tournaments/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  static async deleteTournamentLogo(id: string): Promise<Tournament> {
    const response = await api.delete(`/tournaments/${id}/logo`)
    return response.data
  }

  static async addTeamToTournament(tournamentId: string, teamId: string, group?: string): Promise<void> {
    await api.post(`/tournaments/${tournamentId}/teams`, { team_id: teamId, group })
  }

  static async createFixture(tournamentId: string, fixture: any): Promise<Fixture> {
    const response = await api.post(`/tournaments/${tournamentId}/fixtures`, fixture)
    return response.data
  }

  static async getTournamentFixtures(tournamentId: string): Promise<Fixture[]> {
    const response = await api.get(`/tournaments/${tournamentId}/fixtures`)
    return response.data
  }

  static async getTournamentStandings(tournamentId: string): Promise<Standing[]> {
    const response = await api.get(`/tournaments/${tournamentId}/standings`)
    return response.data
  }

  static async getTournamentStats(tournamentId: string): Promise<TournamentStats> {
    const response = await api.get(`/tournaments/${tournamentId}/stats`)
    return response.data
  }
}

export default TournamentService
export { TournamentService }
