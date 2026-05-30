import { create } from "zustand";
import type { Match, Innings, LiveMatchState, BallEvent, User } from "@/types";

interface ScoringStore {
  currentMatch: Match | null;
  currentInnings: Innings | null;
  liveState: LiveMatchState | null;
  ballHistory: BallEvent[];
  isScoring: boolean;
  lastAction: BallEvent | null;
  canUndo: boolean;
  setCurrentMatch: (match: Match | null) => void;
  setCurrentInnings: (innings: Innings | null) => void;
  setLiveState: (state: LiveMatchState | null) => void;
  addBallEvent: (event: BallEvent) => void;
  undoLastBall: () => void;
  setIsScoring: (scoring: boolean) => void;
  reset: () => void;
}

export const useScoringStore = create<ScoringStore>((set, get) => ({
  currentMatch: null,
  currentInnings: null,
  liveState: null,
  ballHistory: [],
  isScoring: false,
  lastAction: null,
  canUndo: false,
  setCurrentMatch: (match) => set({ currentMatch: match }),
  setCurrentInnings: (innings) => set({ currentInnings: innings }),
  setLiveState: (state) => set({ liveState: state }),
  addBallEvent: (event) =>
    set((state) => ({
      ballHistory: [...state.ballHistory, event],
      lastAction: event,
      canUndo: true,
    })),
  undoLastBall: () =>
    set((state) => {
      const newHistory = state.ballHistory.slice(0, -1);
      return {
        ballHistory: newHistory,
        lastAction: newHistory.length > 0 ? newHistory[newHistory.length - 1] : null,
        canUndo: newHistory.length > 0,
      };
    }),
  setIsScoring: (scoring) => set({ isScoring: scoring }),
  reset: () =>
    set({
      currentMatch: null,
      currentInnings: null,
      liveState: null,
      ballHistory: [],
      isScoring: false,
      lastAction: null,
      canUndo: false,
    }),
}));
