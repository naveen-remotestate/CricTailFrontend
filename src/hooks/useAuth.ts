import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/api/authService";
import { playerService } from "@/services/api/playerService";
import type { User } from "@/types";
import { formatPlayerName } from "@/lib/utils";

// Helper to decode JWT without external library
function decodeToken(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error decoding token", e);
    return null;
  }
}

export function useLogin() {
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: async ({
      mobile_number,
      password,
    }: {
      mobile_number: string;
      password: string;
    }) => {
      const data = await authService.login({ mobile_number, password });
      
      let full_name = "User";
      let created_at = new Date().toISOString();
      try {
        // Fetch player details using the new token to get the full name
        const { apiClient } = await import("@/services/api/client");
        const playersResponse = await apiClient.get(`/players?search=${mobile_number}`, {
          headers: { token: data.token }
        });
        
        const players = playersResponse.data.players || [];
        const me = players.find((p: any) => p.mobile_number === mobile_number);
        if (me) {
          full_name = me.full_name;
          if (me.created_at) {
            created_at = me.created_at;
          }
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }

      return { ...data, full_name, created_at };
    },
    onSuccess: (data, variables) => {
      const decoded = decodeToken(data.token);
      
      const user: User = {
        user_id: decoded?.user_id || "unknown",
        full_name: formatPlayerName(data.full_name),
        mobile_number: variables.mobile_number,
        is_active: true,
        created_at: data.created_at,
        updated_at: new Date().toISOString(),
      };

      login(user, data.token);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async ({
      full_name,
      mobile_number,
      password,
    }: {
      full_name: string;
      mobile_number: string;
      password: string;
    }) => {
      const data = await authService.register({ full_name, mobile_number, password });
      return data;
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async ({
      mobile_number,
      otp,
      password,
    }: {
      mobile_number: string;
      otp: string;
      password: string;
    }) => {
      const data = await authService.forgotPassword({ mobile_number, otp, password });
      return data;
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: () => {
      logout();
    },
  });
}

export function useProfile() {
  const { user, setUser, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ["profile", user?.user_id],
    queryFn: async () => {
      if (!user) return null;
      
      // We search for ourselves to get the latest full_name
      const data = await playerService.getPlayers(user.mobile_number);
      const players = data.players || [];
      const me = players.find((p: any) => p.user_id === user.user_id);
      
      if (me && me.full_name !== user.full_name) {
        setUser({ ...user, full_name: me.full_name });
      }
      return me;
    },
    enabled: isAuthenticated && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
