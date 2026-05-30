import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/api/authService";
import type { User } from "@/types";

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
      return data;
    },
    onSuccess: (data, variables) => {
      const decoded = decodeToken(data.token);
      
      // Create a user object from decoded token info
      // Using placeholder for full_name as it's not in the token spec
      // Capturing mobile_number from login variables
      const user: User = {
        user_id: decoded?.user_id || "unknown",
        full_name: "User", // Placeholder
        mobile_number: variables.mobile_number,
        is_active: true,
        created_at: new Date().toISOString(),
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
