import { useQuery, useMutation } from "@tanstack/react-query";
import { playerService } from "@/services/api/playerService";

export function useSearchPlayers(query: string) {
  return useQuery({
    queryKey: ["players", "search", query],
    queryFn: async () => {
      const data = await playerService.getPlayers(query);
      return data.players;
    },
    enabled: query.length >= 1,
  });
}

export function useAllPlayers() {
  return useQuery({
    queryKey: ["players", "all"],
    queryFn: async () => {
      const data = await playerService.getPlayers();
      return data.players;
    },
  });
}

export function useCreatePlayer() {
  return useMutation({
    mutationFn: async ({ full_name, mobile_number }: { full_name: string; mobile_number: string }) => {
      const data = await playerService.registerGuest({ full_name, mobile_number });
      return data;
    },
  });
}

export function usePlayerStats() {
  return useQuery({
    queryKey: ["player", "stats"],
    queryFn: async () => {
      const data = await playerService.getPlayerStats();
      return data["player-stats"];
    },
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (data: { full_name: string; batting_style: string; bowling_style: string }) => {
      const response = await playerService.updatePlayerProfile(data);
      return response;
    },
  });
}
