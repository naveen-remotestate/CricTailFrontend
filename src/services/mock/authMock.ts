import { delay, generateUUID } from "@/lib/utils";
import type { User, ApiResponse } from "@/types";

const MOCK_USERS: User[] = [
  {
    user_id: "user-1",
    full_name: "Rahul Sharma",
    mobile_number: "9876543210",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    user_id: "user-2",
    full_name: "Vikram Patel",
    mobile_number: "9876543211",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    user_id: "user-3",
    full_name: "Arjun Kumar",
    mobile_number: "9876543212",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
];

export const authMockService = {
  async login(mobile_number: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    await delay(800);
    const user = MOCK_USERS.find((u) => u.mobile_number === mobile_number);
    if (!user || password !== "password123") {
      throw new Error("Invalid mobile number or password");
    }
    return {
      success: true,
      data: {
        user,
        token: `mock-jwt-token-${user.user_id}`,
      },
    };
  },

  async register(full_name: string, mobile_number: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    await delay(1000);
    const existing = MOCK_USERS.find((u) => u.mobile_number === mobile_number);
    if (existing) {
      throw new Error("User already exists with this mobile number");
    }
    const newUser: User = {
      user_id: generateUUID(),
      full_name,
      mobile_number,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_USERS.push(newUser);
    return {
      success: true,
      data: {
        user: newUser,
        token: `mock-jwt-token-${newUser.user_id}`,
      },
    };
  },

  async forgotPassword(mobile_number: string, otp: string, new_password: string): Promise<ApiResponse<void>> {
    await delay(1000);
    const user = MOCK_USERS.find((u) => u.mobile_number === mobile_number);
    if (!user) {
      throw new Error("User not found");
    }
    if (otp !== "123456") {
      throw new Error("Invalid OTP");
    }
    return {
      success: true,
      data: undefined,
    };
  },

  async sendOTP(mobile_number: string): Promise<ApiResponse<void>> {
    await delay(600);
    return {
      success: true,
      data: undefined,
    };
  },

  async getMe(): Promise<ApiResponse<User>> {
    await delay(400);
    return {
      success: true,
      data: MOCK_USERS[0],
    };
  },
};
