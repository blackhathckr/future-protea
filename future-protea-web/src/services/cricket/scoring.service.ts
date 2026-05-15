import api from '@/lib/api'
import type { Ball, RecordBallPayload, Scorecard, MatchPlayer, LiveScoreUpdate } from '@/types/cricket.types'

class ScoringService {
  static async getBalls(matchId: string): Promise<Ball[]> {
    const response = await api.get(`/matches/${matchId}/balls`)
    return Array.isArray(response.data) ? response.data : response.data?.balls ?? []
  }

  static async recordBall(matchId: string, payload: RecordBallPayload): Promise<{ ball: Ball; match: any }> {
    const response = await api.post(`/matches/${matchId}/ball`, payload)
    return response.data
  }

  static async deleteLastBall(matchId: string): Promise<void> {
    await api.delete(`/matches/${matchId}/ball/last`)
  }

  static async getScorecard(matchId: string): Promise<Scorecard> {
    const response = await api.get(`/matches/${matchId}/scorecard`)
    return response.data
  }

  static async getMatchPlayers(matchId: string): Promise<MatchPlayer[]> {
    const response = await api.get(`/matches/${matchId}/players`)
    return Array.isArray(response.data) ? response.data : []
  }

  static async getApprovedPlayers(matchId: string): Promise<MatchPlayer[]> {
    const response = await api.get(`/matches/${matchId}/approved-players`)
    return Array.isArray(response.data) ? response.data : []
  }

  static async populateMatchPlayers(matchId: string): Promise<void> {
    await api.post(`/matches/${matchId}/populate-players`)
  }

  static async approveMatchPlayer(matchPlayerId: string, status: 'approved' | 'rejected' | 'pending' = 'approved', team?: string): Promise<MatchPlayer> {
    const body: Record<string, string> = { status }
    if (team) body.team = team
    const response = await api.put(`/matches/match-players/${matchPlayerId}/approve`, body)
    return response.data
  }

  static async markRetiredHurt(matchId: string, playerId: string): Promise<void> {
    await api.put(`/matches/${matchId}/players/${playerId}/retired-hurt`)
  }

  static async clearRetiredHurt(matchId: string, playerId: string): Promise<void> {
    await api.delete(`/matches/${matchId}/players/${playerId}/retired-hurt`)
  }

  static async getLatestScore(matchId: string): Promise<LiveScoreUpdate | null> {
    try {
      const response = await api.get(`/live/match/${matchId}/latest`)
      return response.data
    } catch {
      return null
    }
  }

  static subscribeToLiveUpdates(
    matchId: string,
    onUpdate: (data: LiveScoreUpdate) => void,
    onError?: (err: Event) => void,
  ): () => void {
    const base = (api.defaults.baseURL || '').replace(/\/$/, '')
    const url = `${base}/live/match/${matchId}/stream`
    const evt = new EventSource(url, { withCredentials: false })
    evt.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data)
        if (parsed?.type === 'update' && parsed?.data) onUpdate(parsed.data as LiveScoreUpdate)
      } catch {
        // ignore malformed messages
      }
    }
    if (onError) evt.onerror = onError
    return () => evt.close()
  }
}

export default ScoringService
export { ScoringService }
