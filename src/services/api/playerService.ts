import { apiClient } from "./client";
import type { User } from "@/types";

export interface PlayersResponse {
  players: User[];
  total: number;
}

export interface PlayerStatsResponse {
  "player-stats": any; // Backend returns this key
}

export interface RegisterGuestResponse {
  message: string;
  user: string;
}

export const playerService = {
  getPlayers: async (search?: string) => {
    const response = await apiClient.get<PlayersResponse>("/players", {
      params: { search },
    });
    return response.data;
  },

  registerGuest: async (data: { full_name: string; mobile_number: string }) => {
    const response = await apiClient.post<RegisterGuestResponse>("/register-guest", data);
    return response.data;
  },

  getPlayerStats: async () => {
    const response = await apiClient.get<PlayerStatsResponse>("/player/stats");
    return response.data;
  },

  updatePlayerProfile: async (data: { full_name: string; batting_style: string; bowling_style: string }) => {
    const response = await apiClient.put<{ message: string }>("/player/update", data);
    return response.data;
  },
};
