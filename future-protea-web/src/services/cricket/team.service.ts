import api from '@/lib/api'

export interface Team {
  id: string
  team_code: string
  team_name: string
  team_type: string
  school_name?: string
  club_name?: string
  logo_url?: string
  created_by: string
  created_at: string
}

export interface CreateTeamData {
  team_name: string
  team_type?: string
  school_name?: string
  club_name?: string
}

export interface TeamStats {
  total_matches: number
  wins: number
  losses: number
  no_results: number
  highest_total: number
  leading_scorer: { name: string; runs: number } | null
  leading_wicket_taker: { name: string; wickets: number } | null
}

class TeamService {
  static async getTeams(): Promise<Team[]> {
    const response = await api.get('/teams')
    return response.data
  }

  static async getTeamById(id: string): Promise<Team> {
    const response = await api.get(`/teams/${id}`)
    return response.data
  }

  static async createTeam(data: CreateTeamData): Promise<Team> {
    const response = await api.post('/teams', data)
    return response.data
  }

  static async updateTeam(id: string, data: Partial<Team>): Promise<Team> {
    const response = await api.put(`/teams/${id}`, data)
    return response.data
  }

  static async deleteTeam(id: string): Promise<void> {
    await api.delete(`/teams/${id}`)
  }

  static async getTeamPlayers(id: string): Promise<any[]> {
    const response = await api.get(`/teams/${id}/players`)
    return response.data
  }

  static async uploadTeamLogo(id: string, file: File): Promise<Team> {
    const formData = new FormData()
    formData.append('logo', file)
    const response = await api.post(`/teams/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  static async deleteTeamLogo(id: string): Promise<Team> {
    const response = await api.delete(`/teams/${id}/logo`)
    return response.data
  }

  static async addPlayerToTeam(teamId: string, playerId: string): Promise<void> {
    await api.post(`/teams/${teamId}/players`, { player_id: playerId })
  }

  static async removePlayerFromTeam(teamId: string, playerId: string): Promise<void> {
    await api.delete(`/teams/${teamId}/players/${playerId}`)
  }

  static async updatePlayerRole(teamId: string, playerId: string, role: { is_captain?: boolean; is_wicket_keeper?: boolean }): Promise<void> {
    await api.put(`/teams/${teamId}/players/${playerId}/role`, role)
  }

  static async getTeamStats(id: string): Promise<TeamStats> {
    const response = await api.get(`/teams/${id}/stats`)
    return response.data
  }
}

export default TeamService
export { TeamService }
