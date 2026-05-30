import { delay, generateUUID } from "@/lib/utils";
import type { Match, Innings, LiveMatchState, BallEvent, BattingScorecard, BowlingScorecard, Team, TeamPlayer, User, ApiResponse } from "@/types";
import type { SelectedPlayer } from "@/store/matchCreationStore";

const teamA: Team = {
  id: "team-a",
  name: "Tech Strikers",
  created_by: "user-1",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

const teamB: Team = {
  id: "team-b",
  name: "Code Warriors",
  created_by: "user-2",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

const createPlayer = (id: string, name: string, mobile: string): User => ({
  user_id: id,
  full_name: name,
  mobile_number: mobile,
  is_active: true,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
});

const teamAPlayers: TeamPlayer[] = [
  { id: "tp1", team_id: "team-a", user_id: "p1", batting_position: 1, is_captain: true, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p1", "Virat Kohli", "9000000001") },
  { id: "tp2", team_id: "team-a", user_id: "p2", batting_position: 2, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p2", "Rohit Sharma", "9000000002") },
  { id: "tp3", team_id: "team-a", user_id: "p6", batting_position: 3, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p6", "KL Rahul", "9000000006") },
  { id: "tp4", team_id: "team-a", user_id: "p7", batting_position: 4, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p7", "Hardik Pandya", "9000000007") },
  { id: "tp5", team_id: "team-a", user_id: "p9", batting_position: 5, is_captain: false, is_wicket_keeper: true, created_at: "2024-01-01", user: createPlayer("p9", "Rishabh Pant", "9000000009") },
  { id: "tp6", team_id: "team-a", user_id: "p11", batting_position: 6, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p11", "Suryakumar Yadav", "9000000011") },
  { id: "tp7", team_id: "team-a", user_id: "p5", batting_position: 7, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p5", "Ravindra Jadeja", "9000000005") },
  { id: "tp8", team_id: "team-a", user_id: "p4", batting_position: 8, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p4", "Jasprit Bumrah", "9000000004") },
  { id: "tp9", team_id: "team-a", user_id: "p14", batting_position: 9, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p14", "Kuldeep Yadav", "9000000014") },
  { id: "tp10", team_id: "team-a", user_id: "p15", batting_position: 10, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p15", "Shardul Thakur", "9000000015") },
  { id: "tp11", team_id: "team-a", user_id: "p20", batting_position: 11, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p20", "Deepak Chahar", "9000000020") },
];

const teamBPlayers: TeamPlayer[] = [
  { id: "tp12", team_id: "team-b", user_id: "p8", batting_position: 1, is_captain: true, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p8", "Shubman Gill", "9000000008") },
  { id: "tp13", team_id: "team-b", user_id: "p19", batting_position: 2, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p19", "Ruturaj Gaikwad", "9000000019") },
  { id: "tp14", team_id: "team-b", user_id: "p3", batting_position: 3, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p3", "MS Dhoni", "9000000003") },
  { id: "tp15", team_id: "team-b", user_id: "p13", batting_position: 4, is_captain: false, is_wicket_keeper: true, created_at: "2024-01-01", user: createPlayer("p13", "Ishan Kishan", "9000000013") },
  { id: "tp16", team_id: "team-b", user_id: "p17", batting_position: 5, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p17", "Sanju Samson", "9000000017") },
  { id: "tp17", team_id: "team-b", user_id: "p12", batting_position: 6, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p12", "Axar Patel", "9000000012") },
  { id: "tp18", team_id: "team-b", user_id: "p16", batting_position: 7, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p16", "Yuzvendra Chahal", "9000000016") },
  { id: "tp19", team_id: "team-b", user_id: "p10", batting_position: 8, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p10", "Mohammed Shami", "9000000010") },
  { id: "tp20", team_id: "team-b", user_id: "p18", batting_position: 9, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p18", "Bhuvneshwar Kumar", "9000000018") },
  { id: "tp21", team_id: "team-b", user_id: "p1", batting_position: 10, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p1", "Virat Kohli", "9000000001") },
  { id: "tp22", team_id: "team-b", user_id: "p2", batting_position: 11, is_captain: false, is_wicket_keeper: false, created_at: "2024-01-01", user: createPlayer("p2", "Rohit Sharma", "9000000002") },
];

teamA.players = teamAPlayers;
teamB.players = teamBPlayers;

const innings1: Innings = {
  id: "inn-1",
  match_id: "match-live",
  innings_no: 1,
  batting_team_id: "team-a",
  bowling_team_id: "team-b",
  total_runs: 156,
  total_wickets: 4,
  legal_balls: 72,
  extras: 12,
  wides: 6,
  no_balls: 4,
  byes: 2,
  leg_byes: 0,
  is_completed: true,
  start_time: "2024-05-20T14:00:00Z",
  end_time: "2024-05-20T15:30:00Z",
  created_at: "2024-05-20T14:00:00Z",
  updated_at: "2024-05-20T15:30:00Z",
  batting_scorecards: [
    { id: "bs1", innings_id: "inn-1", user_id: "p1", batting_position: 1, runs: 45, balls_faced: 32, fours: 5, sixes: 1, is_out: true, dismissal_type: "CAUGHT", dismissed_by_bowler_id: "p10", fielder_id: "p13", created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p1", "Virat Kohli", "9000000001") },
    { id: "bs2", innings_id: "inn-1", user_id: "p2", batting_position: 2, runs: 28, balls_faced: 22, fours: 3, sixes: 0, is_out: true, dismissal_type: "BOWLED", dismissed_by_bowler_id: "p18", created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p2", "Rohit Sharma", "9000000002") },
    { id: "bs3", innings_id: "inn-1", user_id: "p6", batting_position: 3, runs: 35, balls_faced: 25, fours: 2, sixes: 2, is_out: false, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p6", "KL Rahul", "9000000006") },
    { id: "bs4", innings_id: "inn-1", user_id: "p7", batting_position: 4, runs: 18, balls_faced: 12, fours: 1, sixes: 1, is_out: true, dismissal_type: "RUN_OUT", fielder_id: "p12", created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p7", "Hardik Pandya", "9000000007") },
    { id: "bs5", innings_id: "inn-1", user_id: "p9", batting_position: 5, runs: 12, balls_faced: 8, fours: 1, sixes: 0, is_out: true, dismissal_type: "LBW", dismissed_by_bowler_id: "p16", created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p9", "Rishabh Pant", "9000000009") },
    { id: "bs6", innings_id: "inn-1", user_id: "p11", batting_position: 6, runs: 8, balls_faced: 6, fours: 1, sixes: 0, is_out: false, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p11", "Suryakumar Yadav", "9000000011") },
    { id: "bs7", innings_id: "inn-1", user_id: "p5", batting_position: 7, runs: 0, balls_faced: 0, fours: 0, sixes: 0, is_out: false, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p5", "Ravindra Jadeja", "9000000005") },
    { id: "bs8", innings_id: "inn-1", user_id: "p4", batting_position: 8, runs: 0, balls_faced: 0, fours: 0, sixes: 0, is_out: false, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p4", "Jasprit Bumrah", "9000000004") },
  ],
  bowling_scorecards: [
    { id: "bw1", innings_id: "inn-1", user_id: "p10", legal_balls: 24, maidens: 0, runs_conceded: 28, wickets: 1, wides: 2, no_balls: 1, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p10", "Mohammed Shami", "9000000010") },
    { id: "bw2", innings_id: "inn-1", user_id: "p18", legal_balls: 24, maidens: 1, runs_conceded: 22, wickets: 1, wides: 1, no_balls: 0, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p18", "Bhuvneshwar Kumar", "9000000018") },
    { id: "bw3", innings_id: "inn-1", user_id: "p16", legal_balls: 18, maidens: 0, runs_conceded: 35, wickets: 1, wides: 2, no_balls: 2, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p16", "Yuzvendra Chahal", "9000000016") },
    { id: "bw4", innings_id: "inn-1", user_id: "p12", legal_balls: 6, maidens: 0, runs_conceded: 12, wickets: 0, wides: 1, no_balls: 1, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p12", "Axar Patel", "9000000012") },
  ],
  ball_events: [],
};

const innings2: Innings = {
  id: "inn-2",
  match_id: "match-live",
  innings_no: 2,
  batting_team_id: "team-b",
  bowling_team_id: "team-a",
  total_runs: 89,
  total_wickets: 2,
  legal_balls: 42,
  extras: 8,
  wides: 4,
  no_balls: 2,
  byes: 2,
  leg_byes: 0,
  is_completed: false,
  start_time: "2024-05-20T15:35:00Z",
  created_at: "2024-05-20T15:35:00Z",
  updated_at: "2024-05-20T16:00:00Z",
  batting_scorecards: [
    { id: "bs9", innings_id: "inn-2", user_id: "p8", batting_position: 1, runs: 42, balls_faced: 28, fours: 4, sixes: 2, is_out: false, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p8", "Shubman Gill", "9000000008") },
    { id: "bs10", innings_id: "inn-2", user_id: "p19", batting_position: 2, runs: 18, balls_faced: 15, fours: 2, sixes: 0, is_out: true, dismissal_type: "BOWLED", dismissed_by_bowler_id: "p4", created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p19", "Ruturaj Gaikwad", "9000000019") },
    { id: "bs11", innings_id: "inn-2", user_id: "p3", batting_position: 3, runs: 15, balls_faced: 12, fours: 1, sixes: 1, is_out: false, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p3", "MS Dhoni", "9000000003") },
    { id: "bs12", innings_id: "inn-2", user_id: "p13", batting_position: 4, runs: 0, balls_faced: 0, fours: 0, sixes: 0, is_out: false, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p13", "Ishan Kishan", "9000000013") },
  ],
  bowling_scorecards: [
    { id: "bw5", innings_id: "inn-2", user_id: "p4", legal_balls: 18, maidens: 0, runs_conceded: 22, wickets: 1, wides: 2, no_balls: 1, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p4", "Jasprit Bumrah", "9000000004") },
    { id: "bw6", innings_id: "inn-2", user_id: "p20", legal_balls: 12, maidens: 0, runs_conceded: 18, wickets: 0, wides: 1, no_balls: 0, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p20", "Deepak Chahar", "9000000020") },
    { id: "bw7", innings_id: "inn-2", user_id: "p14", legal_balls: 6, maidens: 0, runs_conceded: 10, wickets: 0, wides: 1, no_balls: 1, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p14", "Kuldeep Yadav", "9000000014") },
    { id: "bw8", innings_id: "inn-2", user_id: "p15", legal_balls: 6, maidens: 0, runs_conceded: 8, wickets: 0, wides: 0, no_balls: 0, created_at: "2024-05-20", updated_at: "2024-05-20", user: createPlayer("p15", "Shardul Thakur", "9000000015") },
  ],
  ball_events: [],
};

const liveState: LiveMatchState = {
  match_id: "match-live",
  innings_id: "inn-2",
  striker_id: "p8",
  non_striker_id: "p3",
  current_bowler_id: "p4",
  total_runs: 89,
  total_wickets: 2,
  legal_balls: 42,
  updated_at: "2024-05-20T16:00:00Z",
  striker: createPlayer("p8", "Shubman Gill", "9000000008"),
  non_striker: createPlayer("p3", "MS Dhoni", "9000000003"),
  current_bowler: createPlayer("p4", "Jasprit Bumrah", "9000000004"),
};

const liveMatch: Match = {
  id: "match-live",
  team_a_id: "team-a",
  team_b_id: "team-b",
  team_a: teamA,
  team_b: teamB,
  toss_winner_team_id: "team-a",
  toss_decision: "BAT",
  batting_first_team_id: "team-a",
  overs: 12,
  current_innings_no: 2,
  hosted_by: "user-1",
  stats_processed: false,
  start_time: "2024-05-20T14:00:00Z",
  created_at: "2024-05-20T14:00:00Z",
  updated_at: "2024-05-20T16:00:00Z",
  status: "LIVE",
  live_state: liveState,
  innings: [innings1, innings2],
};

const completedMatch: Match = {
  id: "match-completed",
  team_a_id: "team-a",
  team_b_id: "team-b",
  team_a: { ...teamA, name: "Design Dynamos" },
  team_b: { ...teamB, name: "Dev Dragons" },
  toss_winner_team_id: "team-b",
  toss_decision: "BOWL",
  batting_first_team_id: "team-a",
  winner_team_id: "team-b",
  overs: 10,
  current_innings_no: 2,
  hosted_by: "user-1",
  stats_processed: true,
  start_time: "2024-05-19T14:00:00Z",
  end_time: "2024-05-19T16:00:00Z",
  created_at: "2024-05-19T14:00:00Z",
  updated_at: "2024-05-19T16:00:00Z",
  status: "COMPLETED",
};

const upcomingMatch: Match = {
  id: "match-upcoming",
  team_a_id: "team-a",
  team_b_id: "team-b",
  team_a: { ...teamA, name: "QA Quicks" },
  team_b: { ...teamB, name: "Product Panthers" },
  overs: 8,
  current_innings_no: 1,
  hosted_by: "user-2",
  stats_processed: false,
  created_at: "2024-05-21T10:00:00Z",
  updated_at: "2024-05-21T10:00:00Z",
  status: "UPCOMING",
};

const STORAGE_KEY = "cric-tail-mock-matches";

const getStoredMatches = (): Match[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial = [liveMatch, completedMatch, upcomingMatch];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

const saveMatches = (matches: Match[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
};

export const matchesMockService = {
  async getMatches(status?: string): Promise<ApiResponse<Match[]>> {
    await delay(500);
    let matches = getStoredMatches();
    if (status) {
      matches = matches.filter((m) => m.status === status);
    }
    return { success: true, data: matches };
  },

  async getMatch(id: string): Promise<ApiResponse<Match>> {
    await delay(400);
    const matches = getStoredMatches();
    const match = matches.find((m) => m.id === id);
    if (!match) throw new Error("Match not found");
    return { success: true, data: match };
  },

  async createMatch(data: {
    team_a_name: string;
    team_b_name: string;
    overs: number;
    team_a_players?: SelectedPlayer[];
    team_b_players?: SelectedPlayer[];
    toss_winner_team_id?: string;
    toss_decision?: "BAT" | "BOWL";
  }): Promise<ApiResponse<Match>> {
    await delay(1200);
    const teamAId = generateUUID();
    const teamBId = generateUUID();
    const matchId = generateUUID();

    const newTeamA: Team = {
      id: teamAId,
      name: data.team_a_name,
      created_by: "user-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newTeamB: Team = {
      id: teamBId,
      name: data.team_b_name,
      created_by: "user-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Build players from selected data
    const aPlayers = data.team_a_players?.map((sp, idx) => ({
      id: generateUUID(),
      team_id: teamAId,
      user_id: sp.user.user_id,
      batting_position: idx + 1,
      is_captain: sp.isCaptain,
      is_wicket_keeper: sp.isWicketKeeper,
      created_at: new Date().toISOString(),
      user: sp.user,
    })) || [];

    const bPlayers = data.team_b_players?.map((sp, idx) => ({
      id: generateUUID(),
      team_id: teamBId,
      user_id: sp.user.user_id,
      batting_position: idx + 1,
      is_captain: sp.isCaptain,
      is_wicket_keeper: sp.isWicketKeeper,
      created_at: new Date().toISOString(),
      user: sp.user,
    })) || [];

    newTeamA.players = aPlayers;
    newTeamB.players = bPlayers;

    const newMatch: Match = {
      id: matchId,
      team_a_id: teamAId,
      team_b_id: teamBId,
      team_a: newTeamA,
      team_b: newTeamB,
      toss_winner_team_id: data.toss_winner_team_id,
      toss_decision: data.toss_decision,
      batting_first_team_id: data.toss_decision === "BAT" ? data.toss_winner_team_id : (data.toss_winner_team_id === teamAId ? teamBId : teamAId),
      overs: data.overs,
      current_innings_no: 1,
      hosted_by: "user-1",
      stats_processed: false,
      start_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "UPCOMING",
    };

    const matches = getStoredMatches();
    matches.push(newMatch);
    saveMatches(matches);
    return { success: true, data: newMatch };
  },

  async startMatch(id: string): Promise<ApiResponse<Match>> {
    await delay(800);
    const matches = getStoredMatches();
    const index = matches.findIndex((m) => m.id === id);
    if (index === -1) throw new Error("Match not found");

    const match = matches[index];
    const battingFirstId = match.batting_first_team_id || match.team_a_id;
    const bowlingFirstId = battingFirstId === match.team_a_id ? match.team_b_id : match.team_a_id;

    // Create first innings
    const innings: Innings = {
      id: generateUUID(),
      match_id: id,
      innings_no: 1,
      batting_team_id: battingFirstId,
      bowling_team_id: bowlingFirstId,
      total_runs: 0,
      total_wickets: 0,
      legal_balls: 0,
      extras: 0,
      wides: 0,
      no_balls: 0,
      byes: 0,
      leg_byes: 0,
      is_completed: false,
      start_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Create live state
    const battingTeam = battingFirstId === match.team_a_id ? match.team_a : match.team_b;
    const openers = battingTeam?.players?.slice(0, 2);

    const live: LiveMatchState = {
      match_id: id,
      innings_id: innings.id,
      striker_id: openers?.[0]?.user_id,
      non_striker_id: openers?.[1]?.user_id,
      current_bowler_id: undefined,
      total_runs: 0,
      total_wickets: 0,
      legal_balls: 0,
      updated_at: new Date().toISOString(),
      striker: openers?.[0]?.user,
      non_striker: openers?.[1]?.user,
    };

    matches[index] = {
      ...match,
      status: "LIVE",
      innings: [innings],
      live_state: live,
      updated_at: new Date().toISOString(),
    };

    saveMatches(matches);
    return { success: true, data: matches[index] };
  },

  async updateMatch(id: string, data: Partial<Match>): Promise<ApiResponse<Match>> {
    await delay(600);
    const matches = getStoredMatches();
    const index = matches.findIndex((m) => m.id === id);
    if (index === -1) throw new Error("Match not found");
    matches[index] = { ...matches[index], ...data, updated_at: new Date().toISOString() };
    saveMatches(matches);
    return { success: true, data: matches[index] };
  },

  async getLiveState(matchId: string): Promise<ApiResponse<LiveMatchState>> {
    await delay(300);
    const matches = getStoredMatches();
    const match = matches.find((m) => m.id === matchId);
    if (!match?.live_state) throw new Error("No live state available");
    return { success: true, data: match.live_state };
  },

  async scoreBall(matchId: string, data: unknown): Promise<ApiResponse<BallEvent>> {
    await delay(200);
    const matches = getStoredMatches();
    const matchIndex = matches.findIndex((m) => m.id === matchId);
    if (matchIndex === -1) throw new Error("Match not found");
    
    const match = matches[matchIndex];
    const innings = match?.innings?.find(i => !i.is_completed);

    const event: BallEvent = {
      id: generateUUID(),
      innings_id: innings?.id || "inn-1",
      ball_sequence: (match?.live_state?.legal_balls || 0) + 1,
      over_no: Math.floor((match?.live_state?.legal_balls || 0) / 6) + 1,
      ball_in_over: ((match?.live_state?.legal_balls || 0) % 6) + 1,
      striker_id: match?.live_state?.striker_id || "",
      non_striker_id: match?.live_state?.non_striker_id || "",
      bowler_id: match?.live_state?.current_bowler_id || "",
      runs_off_bat: 0,
      extra_runs: 0,
      total_runs: 0,
      is_legal_delivery: true,
      is_boundary_four: false,
      is_boundary_six: false,
      is_dot_ball: false,
      is_wicket: false,
      bowled_at: new Date().toISOString(),
    };

    // Update match state in storage (simplified for mock)
    if (match.live_state) {
      match.live_state.legal_balls += 1;
      match.updated_at = new Date().toISOString();
      saveMatches(matches);
    }

    return { success: true, data: event };
  },

  async getBallEvents(inningsId: string): Promise<ApiResponse<BallEvent[]>> {
    await delay(400);
    return { success: true, data: [] };
  },

  async finishInnings(matchId: string): Promise<ApiResponse<Match>> {
    await delay(800);
    const matches = getStoredMatches();
    const index = matches.findIndex((m) => m.id === matchId);
    if (index === -1) throw new Error("Match not found");

    const match = matches[index];
    const currentInnings = match.innings?.find(i => !i.is_completed);
    
    if (currentInnings) {
      currentInnings.is_completed = true;
      currentInnings.end_time = new Date().toISOString();
    }

    if (match.current_innings_no === 2) {
      match.status = "COMPLETED";
      // Simple winner logic for mock
      const i1 = match.innings?.[0];
      const i2 = match.innings?.[1];
      if (i1 && i2) {
        match.winner_team_id = i2.total_runs > i1.total_runs ? i2.batting_team_id : i1.batting_team_id;
      }
    }

    saveMatches(matches);
    return { success: true, data: matches[index] };
  },

  async startNextInnings(matchId: string, data: { striker_id: string; non_striker_id: string; bowler_id: string }): Promise<ApiResponse<Match>> {
    await delay(800);
    const matches = getStoredMatches();
    const index = matches.findIndex((m) => m.id === matchId);
    if (index === -1) throw new Error("Match not found");

    const match = matches[index];
    const newInningsNo = (match.current_innings_no || 1) + 1;
    
    const battingTeamId = match.batting_first_team_id === match.team_a_id ? match.team_b_id : match.team_a_id;
    const bowlingTeamId = battingTeamId === match.team_a_id ? match.team_b_id : match.team_a_id;

    const nextInnings: Innings = {
      id: generateUUID(),
      match_id: matchId,
      innings_no: newInningsNo,
      batting_team_id: battingTeamId,
      bowling_team_id: bowlingTeamId,
      total_runs: 0,
      total_wickets: 0,
      legal_balls: 0,
      extras: 0,
      wides: 0,
      no_balls: 0,
      byes: 0,
      leg_byes: 0,
      is_completed: false,
      start_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const battingTeam = battingTeamId === match.team_a_id ? match.team_a : match.team_b;
    const bowlingTeam = bowlingTeamId === match.team_a_id ? match.team_a : match.team_b;

    const live: LiveMatchState = {
      match_id: matchId,
      innings_id: nextInnings.id,
      striker_id: data.striker_id,
      non_striker_id: data.non_striker_id,
      current_bowler_id: data.bowler_id,
      total_runs: 0,
      total_wickets: 0,
      legal_balls: 0,
      updated_at: new Date().toISOString(),
      striker: battingTeam?.players?.find(p => p.user_id === data.striker_id)?.user,
      non_striker: battingTeam?.players?.find(p => p.user_id === data.non_striker_id)?.user,
      current_bowler: bowlingTeam?.players?.find(p => p.user_id === data.bowler_id)?.user,
    };

    match.current_innings_no = newInningsNo;
    match.innings = [...(match.innings || []), nextInnings];
    match.live_state = live;

    saveMatches(matches);
    return { success: true, data: match };
  },

  async getMyMatches(): Promise<ApiResponse<Match[]>> {
    await delay(500);
    const matches = getStoredMatches();
    return { success: true, data: matches.filter((m) => m.hosted_by === "user-1") };
  },
};

let MOCK_MATCHES: Match[] = []; // Not used anymore but kept for structure
