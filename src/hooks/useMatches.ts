import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { matchesMockService } from "@/services/mock";
import type { Match, CreateMatchRequest, UpdateMatchRequest, ScoreBallRequest } from "@/types";
import type { SelectedPlayer } from "@/store/matchCreationStore";

export function useMatches(status?: string) {
  return useQuery({
    queryKey: ["matches", status],
    queryFn: async () => {
      const response = await matchesMockService.getMatches(status);
      return response.data;
    },
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ["match", id],
    queryFn: async () => {
      const response = await matchesMockService.getMatch(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateMatch() {
  return useMutation({
    mutationFn: async (data: {
      team_a_name: string;
      team_b_name: string;
      overs: number;
      team_a_players?: SelectedPlayer[];
      team_b_players?: SelectedPlayer[];
      toss_winner_team_id?: string;
      toss_decision?: "BAT" | "BOWL";
    }) => {
      const response = await matchesMockService.createMatch(data);
      return response.data;
    },
  });
}

export function useStartMatch() {
  return useMutation({
    mutationFn: async (matchId: string) => {
      const response = await matchesMockService.startMatch(matchId);
      return response.data;
    },
  });
}

export function useUpdateMatch() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMatchRequest }) => {
      const response = await matchesMockService.updateMatch(id, data);
      return response.data;
    },
  });
}

export function useLiveState(matchId: string) {
  return useQuery({
    queryKey: ["live-state", matchId],
    queryFn: async () => {
      const response = await matchesMockService.getLiveState(matchId);
      return response.data;
    },
    enabled: !!matchId,
    refetchInterval: 5000,
  });
}

export function useScoreBall() {
  return useMutation({
    mutationFn: async ({ matchId, data }: { matchId: string; data: ScoreBallRequest }) => {
      const response = await matchesMockService.scoreBall(matchId, data);
      return response.data;
    },
  });
}

export function useFinishInnings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      const response = await matchesMockService.finishInnings(matchId);
      return response.data;
    },
    onSuccess: (_, matchId) => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useStartNextInnings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, data }: { matchId: string; data: { striker_id: string; non_striker_id: string; bowler_id: string } }) => {
      const response = await matchesMockService.startNextInnings(matchId, data);
      return response.data;
    },
    onSuccess: (_, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useMyMatches() {
  return useQuery({
    queryKey: ["my-matches"],
    queryFn: async () => {
      const response = await matchesMockService.getMyMatches();
      return response.data;
    },
  });
}
