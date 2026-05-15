/**
 * @fileoverview Cricket domain types — ball-by-ball scoring, scorecard, innings.
 * @module types/cricket
 */

export interface Ball {
  id: string
  match_id: string
  innings: number
  over_number: number
  ball_number: number
  batsman_id?: string | null
  batsman_name?: string | null
  bowler_id?: string | null
  bowler_name?: string | null
  non_striker_id?: string | null
  non_striker_name?: string | null
  fielder_id?: string | null
  fielder_name?: string | null
  runs: number
  is_wide: boolean
  is_noball: boolean
  is_bye: boolean
  is_legbye: boolean
  is_wicket: boolean
  wicket_type?: string | null
  extras: number
  overthrows: number
  shot_direction?: string | null
  commentary?: string | null
  is_active: boolean
  created_at?: string
}

export interface RecordBallPayload {
  innings: number
  over_number: number
  ball_number: number
  batsman_id?: string | null
  bowler_id?: string | null
  non_striker_id?: string | null
  fielder_id?: string | null
  runs: number
  is_wide?: boolean
  is_noball?: boolean
  is_bye?: boolean
  is_legbye?: boolean
  is_wicket?: boolean
  wicket_type?: string
  dismissed_by_id?: string | null
  extras?: number
  overthrows?: number
  shot_direction?: string
  commentary?: string
  client_ball_id?: string
}

export interface InningsExtras {
  wides: number
  noballs: number
  byes: number
  legbyes: number
  penalties: number
  total: number
}

export interface FallOfWicket {
  wicket_number: number
  batsman_name: string | null
  dismissal_type: string | null
  bowler_name: string | null
  fielder_name: string | null
  runs_at_fall: number
  overs_at_fall: number
}

export interface InningsSummary {
  innings_number: number
  total_runs: number
  total_wickets: number
  total_overs: number
  target_runs?: number | null
  status: string
  extras: InningsExtras
  fall_of_wickets: FallOfWicket[]
}

export interface BattingScore {
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
  is_captain: boolean
  is_wicket_keeper: boolean
}

export interface BowlingScore {
  id: string
  match_id: string
  player_id: string
  team: string
  name: string
  overs_bowled: number
  runs_conceded: number
  wickets_taken: number
  maidens: number
  catches: number
  run_outs: number
  is_captain: boolean
  is_wicket_keeper: boolean
}

export interface Scorecard {
  match: Record<string, any>
  batting: BattingScore[]
  bowling: BowlingScore[]
  innings: InningsSummary[]
}

export interface MatchPlayer {
  id: string
  match_id: string
  player_id: string
  /** Display name (backend returns this even when the player has only a User account). */
  name: string
  /** Alias kept for callers that still read player_name. */
  player_name?: string
  team: string
  status: string // 'pending' | 'approved' | 'rejected'
  is_captain: boolean
  is_wicket_keeper: boolean
  is_approved?: boolean
  is_playing?: boolean
  batting_style?: string | null
  bowling_style?: string | null
  photo_url?: string | null
  player_id_code?: string | null
}

export interface LiveScoreUpdate {
  match_id: string
  team1_score: number
  team1_wickets: number
  team1_overs: number
  team2_score: number
  team2_wickets: number
  team2_overs: number
  current_innings: number
  striker?: { id: string; name: string; runs: number; balls: number; fours: number; sixes: number } | null
  non_striker?: { id: string; name: string; runs: number; balls: number; fours: number; sixes: number } | null
  bowler?: { id: string; name: string; overs: number; runs: number; wickets: number; maidens: number } | null
  last_over_balls?: BallSummary[]
  partnership_runs?: number
  partnership_balls?: number
  required_run_rate?: number
  current_run_rate?: number
}

export interface BallSummary {
  over_number: number
  ball_number: number
  runs: number
  is_wide: boolean
  is_noball: boolean
  is_wicket: boolean
  is_bye?: boolean
  is_legbye?: boolean
  extras?: number
  label: string
}
