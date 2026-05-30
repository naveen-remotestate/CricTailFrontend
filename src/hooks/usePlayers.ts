import { useQuery, useMutation } from "@tanstack/react-query";
import { playersMockService } from "@/services/mock";

export function useSearchPlayers(query: string) {
  return useQuery({
    queryKey: ["players", "search", query],
    queryFn: async () => {
      const response = await playersMockService.searchPlayers(query);
      return response.data;
    },
    enabled: query.length >= 1,
  });
}

export function useAllPlayers() {
  return useQuery({
    queryKey: ["players", "all"],
    queryFn: async () => {
      const response = await playersMockService.getAllPlayers();
      return response.data;
    },
  });
}

export function useCreatePlayer() {
  return useMutation({
    mutationFn: async ({ full_name, mobile_number }: { full_name: string; mobile_number: string }) => {
      const response = await playersMockService.createPlayer(full_name, mobile_number);
      return response.data;
    },
  });
}
