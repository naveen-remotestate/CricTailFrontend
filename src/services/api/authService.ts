import { apiClient } from "./client";

export interface RegisterResponse {
  message: string;
  user: string; // The user ID returned
}

export interface LoginResponse {
  message: string;
  token: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}

export const authService = {
  register: async (data: any) => {
    const response = await apiClient.post<RegisterResponse>("/register", data);
    return response.data;
  },

  login: async (data: any) => {
    const response = await apiClient.post<LoginResponse>("/login", data);
    return response.data;
  },

  forgotPassword: async (data: any) => {
    const response = await apiClient.post<ForgotPasswordResponse>("/forgot-password", data);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post<LogoutResponse>("/logout");
    return response.data;
  }
};
