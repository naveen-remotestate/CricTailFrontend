import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

export interface SelectedPlayer {
  user: User;
  team: "A" | "B" | null;
  battingPosition: number;
  isCaptain: boolean;
  isWicketKeeper: boolean;
}

interface MatchCreationState {
  step: number;
  teamAName: string;
  teamBName: string;
  overs: number;
  selectedPlayers: SelectedPlayer[];
  tossWinner: "A" | "B" | null;
  tossDecision: "BAT" | "BOWL" | null;
  isTossAnimating: boolean;
  tossResult: "A" | "B" | null;
  matchId: string | null;

  // Match start selections
  strikerId: string | null;
  nonStrikerId: string | null;
  openingBowlerId: string | null;

  setStep: (step: number) => void;
  setBasicDetails: (teamA: string, teamB: string, overs: number) => void;
  addPlayer: (user: User, team: "A" | "B") => void;
  removePlayer: (userId: string, team: "A" | "B") => void;
  setCaptain: (userId: string, team: "A" | "B") => void;
  setWicketKeeper: (userId: string, team: "A" | "B") => void;
  reorderPlayers: (team: "A" | "B", oldIndex: number, newIndex: number) => void;
  setTossResult: (winner: "A" | "B") => void;
  setTossDecision: (decision: "BAT" | "BOWL") => void;
  setTossAnimating: (animating: boolean) => void;
  setMatchId: (id: string | null) => void;
  resetToss: () => void;

  // Match start
  setStriker: (id: string | null) => void;
  setNonStriker: (id: string | null) => void;
  setOpeningBowler: (id: string | null) => void;

  getTeamAPlayers: () => SelectedPlayer[];
  getTeamBPlayers: () => SelectedPlayer[];
  getBattingTeamPlayers: () => SelectedPlayer[];
  getBowlingTeamPlayers: () => SelectedPlayer[];
  getMaxWickets: () => number;
  reset: () => void;
}

export const useMatchCreationStore = create<MatchCreationState>()(
  persist(
    (set, get) => ({
      step: 1,
      teamAName: "",
      teamBName: "",
      overs: 10,
      selectedPlayers: [],
      tossWinner: null,
      tossDecision: null,
      isTossAnimating: false,
      tossResult: null,
      matchId: null,
      strikerId: null,
      nonStrikerId: null,
      openingBowlerId: null,

      setStep: (step) => set({ step }),
      setBasicDetails: (teamAName, teamBName, overs) => set({ teamAName, teamBName, overs }),

      addPlayer: (user, team) => {
        const state = get();
        const existing = state.selectedPlayers.find(
          (p) => p.user.user_id === user.user_id && p.team === team,
        );

        if (existing) {
          // Toggle Off: Remove player
          const filtered = state.selectedPlayers.filter(
            (p) => !(p.user.user_id === user.user_id && p.team === team),
          );
          // Recalculate batting positions
          const teamA = filtered
            .filter((p) => p.team === "A")
            .map((p, i) => ({ ...p, battingPosition: i + 1 }));
          const teamB = filtered
            .filter((p) => p.team === "B")
            .map((p, i) => ({ ...p, battingPosition: i + 1 }));
          set({ selectedPlayers: [...teamA, ...teamB] });
          return;
        }

        // Toggle On: Add player
        // Check if player is already in the other team
        const otherTeam = team === "A" ? "B" : "A";
        const isInOtherTeam = state.selectedPlayers.some(
          (p) => p.user.user_id === user.user_id && p.team === otherTeam,
        );

        if (isInOtherTeam) {
          // Attempting to make this player "shared"
          // Count existing shared players (distinct user_ids in both teams)
          const playerIdsA = new Set(
            state.selectedPlayers.filter((p) => p.team === "A").map((p) => p.user.user_id),
          );
          const playerIdsB = new Set(
            state.selectedPlayers.filter((p) => p.team === "B").map((p) => p.user.user_id),
          );
          const sharedIds = [...playerIdsA].filter((id) => playerIdsB.has(id));

          if (sharedIds.length >= 1) {
            // We already have one shared player (not this one, since this one is only in one team so far)
            throw new Error("Only one player can be shared between both teams.");
          }
        }

        const teamPlayersCount = state.selectedPlayers.filter(
          (p) => p.team === team,
        ).length;
        const newPlayer: SelectedPlayer = {
          user,
          team,
          battingPosition: teamPlayersCount + 1,
          isCaptain: false,
          isWicketKeeper: false,
        };
        set({ selectedPlayers: [...state.selectedPlayers, newPlayer] });
      },

      removePlayer: (userId, team) => {
        const state = get();
        const filtered = state.selectedPlayers.filter(p => !(p.user.user_id === userId && p.team === team));
        const teamA = filtered.filter(p => p.team === "A").map((p, i) => ({ ...p, battingPosition: i + 1 }));
        const teamB = filtered.filter(p => p.team === "B").map((p, i) => ({ ...p, battingPosition: i + 1 }));
        set({ selectedPlayers: [...teamA, ...teamB] });
      },

      setCaptain: (userId, team) => {
        const state = get();
        const otherTeam = team === "A" ? "B" : "A";
        
        // Find if this specific player-team instance is ALREADY captain
        const currentInstance = state.selectedPlayers.find(
          (p) => p.user.user_id === userId && p.team === team
        );
        const isCurrentlyCaptain = currentInstance?.isCaptain;

        // If trying to set AS captain (not toggling off)
        if (!isCurrentlyCaptain) {
          // Check if this player is already captain of the OTHER team
          const isCaptainOfOtherTeam = state.selectedPlayers.some(
            (p) => p.user.user_id === userId && p.team === otherTeam && p.isCaptain
          );

          if (isCaptainOfOtherTeam) {
            throw new Error("A player cannot be captain of both teams.");
          }
        }

        const updated = state.selectedPlayers.map(p => {
          if (p.team === team) {
            // If this is the player we clicked, toggle their state
            // Otherwise, they MUST be false (only one captain per team)
            return { 
              ...p, 
              isCaptain: p.user.user_id === userId ? !isCurrentlyCaptain : false 
            };
          }
          return p;
        });
        set({ selectedPlayers: updated });
      },

      setWicketKeeper: (userId, team) => {
        const state = get();
        
        // Find if this specific player-team instance is ALREADY wicket keeper
        const currentInstance = state.selectedPlayers.find(
          (p) => p.user.user_id === userId && p.team === team
        );
        const isCurrentlyWK = currentInstance?.isWicketKeeper;

        const updated = state.selectedPlayers.map(p => {
          if (p.team === team) {
            // If this is the player we clicked, toggle their state
            // Otherwise, they MUST be false (only one wicket keeper per team)
            return { 
              ...p, 
              isWicketKeeper: p.user.user_id === userId ? !isCurrentlyWK : false 
            };
          }
          return p;
        });
        set({ selectedPlayers: updated });
      },

      reorderPlayers: (team, oldIndex, newIndex) => {
        const state = get();
        const teamPlayers = state.selectedPlayers.filter(p => p.team === team);
        const others = state.selectedPlayers.filter(p => p.team !== team);
        const [moved] = teamPlayers.splice(oldIndex, 1);
        teamPlayers.splice(newIndex, 0, moved);
        const reordered = teamPlayers.map((p, i) => ({ ...p, battingPosition: i + 1 }));
        set({ selectedPlayers: [...others, ...reordered] });
      },

      setTossResult: (winner) => set({ tossResult: winner, tossWinner: winner, isTossAnimating: false }),
      setTossDecision: (decision) => set({ tossDecision: decision }),
      setTossAnimating: (animating) => set({ isTossAnimating: animating }),
      setMatchId: (id) => set({ matchId: id }),
      resetToss: () => set({ 
        tossWinner: null, 
        tossDecision: null, 
        tossResult: null,
        strikerId: null,
        nonStrikerId: null,
        openingBowlerId: null
      }),

      setStriker: (id) => set({ strikerId: id }),
      setNonStriker: (id) => set({ nonStrikerId: id }),
      setOpeningBowler: (id) => set({ openingBowlerId: id }),

      getTeamAPlayers: () => get().selectedPlayers.filter(p => p.team === "A").sort((a, b) => a.battingPosition - b.battingPosition),
      getTeamBPlayers: () => get().selectedPlayers.filter(p => p.team === "B").sort((a, b) => a.battingPosition - b.battingPosition),

      getBattingTeamPlayers: () => {
        const state = get();
        if (!state.tossWinner || !state.tossDecision) return [];
        const battingTeam = state.tossDecision === "BAT" ? state.tossWinner : (state.tossWinner === "A" ? "B" : "A");
        return battingTeam === "A" ? state.getTeamAPlayers() : state.getTeamBPlayers();
      },

      getBowlingTeamPlayers: () => {
        const state = get();
        if (!state.tossWinner || !state.tossDecision) return [];
        const bowlingTeam = state.tossDecision === "BOWL" ? state.tossWinner : (state.tossWinner === "A" ? "B" : "A");
        return bowlingTeam === "A" ? state.getTeamAPlayers() : state.getTeamBPlayers();
      },

      getMaxWickets: () => {
        const battingTeam = get().getBattingTeamPlayers();
        return Math.max(battingTeam.length - 1, 0); // All out = all players except one
      },

      reset: () => set({
        step: 1,
        teamAName: "",
        teamBName: "",
        overs: 10,
        selectedPlayers: [],
        tossWinner: null,
        tossDecision: null,
        isTossAnimating: false,
        tossResult: null,
        matchId: null,
        strikerId: null,
        nonStrikerId: null,
        openingBowlerId: null,
      }),
    }),
    {
      name: "cric-tail-match-creation",
    }
  )
);
