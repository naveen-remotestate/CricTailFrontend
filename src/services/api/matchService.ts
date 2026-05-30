import { apiClient } from "./client";
import type { Match, MatchScorecardResponse } from "@/types";

export interface CreateMatchRequest {
  team_a: {
    name: string;
    players: {
      user_id: string;
      is_captain: boolean;
    }[];
  };
  team_b: {
    name: string;
    players: {
      user_id: string;
      is_captain: boolean;
    }[];
  };
  overs: number;
  hosted_by: string;
  toss_winner_team: "A" | "B";
  toss_decision: "BAT" | "BOWL";
  striker_id: string;
  non_striker_id: string;
  current_bowler_id: string;
}

export interface AddBallEventRequest {
  match_id: string;
  runs_off_bat: number;
  extra_runs: number;
  extra_type: string | null;
  is_wicket: boolean;
  wicket_type: string | null;
  dismissed_player_id: string | null;
  dismissed_by_fielder_id: string | null;
  next_batsman_id: string;
  next_bowler_id: string;
}

export interface StartSecondInningsRequest {
  match_id: string;
  striker_id: string;
  non_striker_id: string;
  bowler_id: string;
}

export const matchService = {
  getMatches: async () => {
    const response = await apiClient.get<{ matches: Match[] }>("/matches");
    return response.data;
  },

  getMatchByID: async (matchID: string) => {
    const response = await apiClient.get<{ match: Match }>("/matches/" + matchID);
    return response.data;
  },

  createMatch: async (data: CreateMatchRequest) => {
    const response = await apiClient.post<{ message: string; match_id: string }>("/create-match", data);
    return response.data;
  },

  addBallEvent: async (data: AddBallEventRequest) => {
    const response = await apiClient.post<{ message: string }>("/ball-event", data);
    return response.data;
  },

  startSecondInnings: async (data: StartSecondInningsRequest) => {
    const response = await apiClient.post<{ message: string; second_innings_id: string }>("/start-second-innings", data);
    return response.data;
  },

  getScorecard: async (matchID: string) => {
    const response = await apiClient.get<{ scorecard: MatchScorecardResponse }>(`/matches/${matchID}/scorecard`);
    return response.data;
  },
};
