import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOvers(balls: number): string {
  const overs = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return `${overs}.${remainingBalls}`;
}

export function calculateRunRate(runs: number, balls: number): string {
  if (balls === 0) return "0.00";
  return ((runs / balls) * 6).toFixed(2);
}

export function calculateRequiredRate(
  target: number,
  currentRuns: number,
  ballsRemaining: number
): string {
  const runsNeeded = target - currentRuns;
  if (ballsRemaining <= 0) return "0.00";
  return ((runsNeeded / ballsRemaining) * 6).toFixed(2);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function formatPlayerName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatTeamName(name: string | null | undefined): string {
  if (!name) return "";
  if (name.length <= 9) return name;
  
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
