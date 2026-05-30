import { delay } from "@/lib/utils";
import type { User, ApiResponse, PaginatedResponse } from "@/types";

const MOCK_PLAYERS: User[] = [
  { user_id: "p1", full_name: "Virat Kohli", mobile_number: "9000000001", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p2", full_name: "Rohit Sharma", mobile_number: "9000000002", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p3", full_name: "MS Dhoni", mobile_number: "9000000003", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p4", full_name: "Jasprit Bumrah", mobile_number: "9000000004", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p5", full_name: "Ravindra Jadeja", mobile_number: "9000000005", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p6", full_name: "KL Rahul", mobile_number: "9000000006", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p7", full_name: "Hardik Pandya", mobile_number: "9000000007", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p8", full_name: "Shubman Gill", mobile_number: "9000000008", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p9", full_name: "Rishabh Pant", mobile_number: "9000000009", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p10", full_name: "Mohammed Shami", mobile_number: "9000000010", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p11", full_name: "Suryakumar Yadav", mobile_number: "9000000011", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p12", full_name: "Axar Patel", mobile_number: "9000000012", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p13", full_name: "Ishan Kishan", mobile_number: "9000000013", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p14", full_name: "Kuldeep Yadav", mobile_number: "9000000014", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p15", full_name: "Shardul Thakur", mobile_number: "9000000015", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p16", full_name: "Yuzvendra Chahal", mobile_number: "9000000016", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p17", full_name: "Sanju Samson", mobile_number: "9000000017", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p18", full_name: "Bhuvneshwar Kumar", mobile_number: "9000000018", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p19", full_name: "Ruturaj Gaikwad", mobile_number: "9000000019", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { user_id: "p20", full_name: "Deepak Chahar", mobile_number: "9000000020", is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
];

export const playersMockService = {
  async searchPlayers(query: string): Promise<ApiResponse<User[]>> {
    await delay(300);
    const results = MOCK_PLAYERS.filter(
      (p) =>
        p.full_name.toLowerCase().includes(query.toLowerCase()) ||
        p.mobile_number.includes(query)
    );
    return { success: true, data: results };
  },

  async getAllPlayers(): Promise<ApiResponse<PaginatedResponse<User>>> {
    await delay(400);
    return {
      success: true,
      data: {
        data: MOCK_PLAYERS,
        total: MOCK_PLAYERS.length,
        page: 1,
        limit: 50,
        total_pages: 1,
      },
    };
  },

  async createPlayer(full_name: string, mobile_number: string): Promise<ApiResponse<User>> {
    await delay(600);
    const newPlayer: User = {
      user_id: `new-${Date.now()}`,
      full_name,
      mobile_number,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_PLAYERS.push(newPlayer);
    return { success: true, data: newPlayer };
  },
};
