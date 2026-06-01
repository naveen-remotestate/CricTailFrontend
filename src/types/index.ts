export interface User {
  user_id: string;
  full_name: string;
  mobile_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  players?: TeamPlayer[];
}

export interface TeamPlayer {
  id: string;
  team_id: string;
  user_id: string;
  batting_position: number;
  is_captain: boolean;
  is_wicket_keeper: boolean;
  created_at: string;
  user?: User;
}

export interface Match {
  match_id: string;
  toss_winner_team_id: string | null;
  winner_team_id: string | null;
  toss_decision: string;
  hosted_by: string;
  current_innings_no: number;
  overs: number;
  start_time: string | null;
  end_time: string | null;
  team_a_id: string;
  team_a_name: string;
  team_b_id: string;
  team_b_name: string;
  current_total_runs?: number;
  current_total_wickets?: number;
  legal_balls?: number;
  previous_innings_score?: number;
  previous_innings_wickets?: number;
  previous_innings_legal_balls?: number;
  current_inning_id?: string;
  is_completed: boolean;
  batting_team_id?: string;
  bowling_team_id?: string;
  striker_id: string | null;
  striker_name: string | null;
  striker_runs: number;
  striker_balls: number;
  non_striker_id: string | null;
  non_striker_name: string | null;
  non_striker_runs: number;
  non_striker_balls: number;
  bowler_id: string | null;
  bowler_name: string | null;
  bowler_runs_given: number;
  bowler_legal_balls: number;
  bowler_wickets: number;
  
  // High-level relations
  team_a?: Team;
  team_b?: Team;
  innings?: Innings[];
}

export interface Innings {
  id: string;
  match_id: string;
  innings_no: number;
  batting_team_id: string;
  bowling_team_id: string;
  total_runs: number;
  total_wickets: number;
  legal_balls: number;
  extras: number;
  wides: number;
  no_balls: number;
  byes: number;
  leg_byes: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  batting_scorecards?: BattingScorecard[];
  bowling_scorecards?: BowlingScorecard[];
}

export interface LiveMatchState {
  match_id: string;
  innings_id?: string;
  striker_id?: string;
  non_striker_id?: string;
  bowler_id?: string;
  total_runs: number;
  total_wickets: number;
  legal_balls: number;
  updated_at: string;
  striker_name?: string;
  non_striker_name?: string;
  bowler_name?: string;
}

export interface BallEvent {
  id: string;
  innings_id: string;
  ball_sequence: number;
  over_no: number;
  ball_in_over: number;
  striker_id: string;
  non_striker_id: string;
  bowler_id: string;
  runs_off_bat: number;
  extra_runs: number;
  total_runs: number;
  extra_type?: "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE";
  is_legal_delivery: boolean;
  is_boundary_four: boolean;
  is_boundary_six: boolean;
  is_dot_ball: boolean;
  is_wicket: boolean;
  wicket_type?: string;
  dismissed_player_id?: string;
  dismissed_by_fielder_id?: string;
  bowled_at: string;
}

export interface BattingScorecard {
  id: string;
  innings_id: string;
  user_id: string;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  is_out: boolean;
  dismissal_type?: string;
  dismissed_by_bowler_id?: string;
  fielder_id?: string;
  user?: User;
}

export interface BowlingScorecard {
  id: string;
  innings_id: string;
  user_id: string;
  legal_balls: number;
  maidens: number;
  runs_conceded: number;
  wickets: number;
  wides: number;
  no_balls: number;
  user?: User;
}

// New Scorecard API Types
export interface BowlingScorecardResponse {
  user_id: string;
  player_name: string;
  legal_balls: number;
  runs_conceded: number;
  wickets: number;
  wides: number;
  no_balls: number;
}

export interface BattingScorecardResponse {
  user_id: string;
  player_name: string;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  is_out: boolean;
  dismissal_type: string | null;
}

export interface InningsScorecard {
  innings_id: string;
  innings_no: number;
  batting_team_id: string;
  bowling_team_id: string;
  total_runs: number;
  total_wickets: number;
  legal_balls: number;
  extras: number;
  batting: BattingScorecardResponse[];
  bowling: BowlingScorecardResponse[];
}

export interface MatchScorecardResponse {
  match_id: string;
  first_innings?: InningsScorecard;
  second_innings?: InningsScorecard;
}

export interface PlayerCareerStats {
  id: string;
  user_id: string;
  batting_style?: "LEFT" | "RIGHT";
  bowling_style?: string;
  
  matches_played: number;
  innings_batted: number;
  innings_bowled: number;
  matches_won: number;
  
  total_points: number;

  // Batting
  total_runs: number;
  total_balls_faced: number;
  highest_run: number;
  total_outs: number;
  total_fours: number;
  total_sixes: number;
  ducks: number;
  golden_ducks: number;
  fifties: number;
  hundreds: number;

  // Bowling
  total_balls_bowled: number;
  total_runs_conceded: number;
  total_wickets_taken: number;
  total_maidens: number;
  wides: number;
  no_balls: number;
  highest_wicket_taken: number;

  // Fielding
  catches: number;
  run_outs: number;
  stumping: number;

  updated_at: string;
}

export interface UpdateMatchRequest {
  toss_winner_team_id?: string;
  toss_decision?: "BAT" | "BOWL";
  winner_team_id?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
