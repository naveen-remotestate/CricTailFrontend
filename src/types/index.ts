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
  id: string;
  team_a_id: string;
  team_b_id: string;
  team_a?: Team;
  team_b?: Team;
  toss_winner_team_id?: string;
  toss_decision?: "BAT" | "BOWL";
  batting_first_team_id?: string;
  winner_team_id?: string;
  overs: number;
  current_innings_no: number;
  hosted_by: string;
  scorer_1?: string;
  scorer_2?: string;
  stats_processed: boolean;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
  status?: MatchStatus;
  live_state?: LiveMatchState;
  innings?: Innings[];
}

export type MatchStatus = "UPCOMING" | "LIVE" | "COMPLETED" | "ABANDONED";

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
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
  batting_scorecards?: BattingScorecard[];
  bowling_scorecards?: BowlingScorecard[];
  ball_events?: BallEvent[];
}

export interface LiveMatchState {
  match_id: string;
  innings_id?: string;
  striker_id?: string;
  non_striker_id?: string;
  current_bowler_id?: string;
  total_runs: number;
  total_wickets: number;
  legal_balls: number;
  updated_at: string;
  striker?: User;
  non_striker?: User;
  current_bowler?: User;
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
  wicket_type?:
    | "BOWLED"
    | "CAUGHT"
    | "LBW"
    | "RUN_OUT"
    | "STUMPED"
    | "HIT_WICKET"
    | "RETIRED_HURT";
  dismissed_player_id?: string;
  dismissed_by_fielder_id?: string;
  bowled_at: string;
}

export interface BattingScorecard {
  id: string;
  innings_id: string;
  user_id: string;
  batting_position: number;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  dismissal_type?:
    | "BOWLED"
    | "CAUGHT"
    | "LBW"
    | "RUN_OUT"
    | "STUMPED"
    | "HIT_WICKET"
    | "RETIRED_HURT";
  dismissed_by_bowler_id?: string;
  fielder_id?: string;
  is_out: boolean;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface PlayerCareerStats {
  id: string;
  user_id: string;
  batting_style?: "LEFT" | "RIGHT";
  bowling_style?: "FAST" | "MEDIUM" | "SPIN" | "OFF SPIN" | "LEG SPIN";
  matches_played: number;
  innings_batted: number;
  innings_bowled: number;
  matches_won: number;
  total_points: number;
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
  total_balls_bowled: number;
  total_runs_conceded: number;
  total_wickets_taken: number;
  total_maidens: number;
  wides: number;
  no_balls: number;
  highest_wicket_taken: number;
  catches: number;
  run_outs: number;
  stumping: number;
  updated_at: string;
}

export interface CreateMatchRequest {
  team_a_name: string;
  team_b_name: string;
  overs: number;
}

export interface UpdateMatchRequest {
  toss_winner_team_id?: string;
  toss_decision?: "BAT" | "BOWL";
  batting_first_team_id?: string;
  winner_team_id?: string;
  current_innings_no?: number;
  scorer_1?: string;
  scorer_2?: string;
  start_time?: string;
  end_time?: string;
}

export interface ScoreBallRequest {
  runs_off_bat: number;
  extra_type?: "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE";
  extra_runs?: number;
  is_wicket?: boolean;
  wicket_type?: string;
  dismissed_player_id?: string;
  dismissed_by_fielder_id?: string;
  new_batsman_id?: string;
  new_bowler_id?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
