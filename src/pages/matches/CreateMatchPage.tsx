import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateMatch, useStartMatch } from "@/hooks/useMatches";
import { useSearchPlayers, useCreatePlayer } from "@/hooks/usePlayers";
import { useAuthStore } from "@/store/authStore";
import { useMatchCreationStore } from "@/store/matchCreationStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatPlayerName } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Trophy,
  Users,
  Circle,
  Eye,
  Search,
  Plus,
  X,
  Crown,
  Shield,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import type { User } from "@/types";

const steps = [
  { id: 1, title: "Match Details", icon: Trophy },
  { id: 2, title: "Select Players", icon: Users },
  { id: 3, title: "Toss", icon: Circle },
  { id: 4, title: "Start Match", icon: Eye },
];

export default function CreateMatchPage() {
  const navigate = useNavigate();
  const createMatch = useCreateMatch();
  const startMatch = useStartMatch();
  const store = useMatchCreationStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerMobile, setNewPlayerMobile] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isStarting, setIsStarting] = useState(false);

  const { data: searchResults } = useSearchPlayers(searchQuery);
  const createPlayer = useCreatePlayer();

  const teamAPlayers = store.getTeamAPlayers();
  const teamBPlayers = store.getTeamBPlayers();
  const battingTeamPlayers = store.getBattingTeamPlayers();
  const bowlingTeamPlayers = store.getBowlingTeamPlayers();

  const commonPlayerId = teamAPlayers.find(pa => 
    teamBPlayers.some(pb => pb.user.user_id === pa.user.user_id)
  )?.user.user_id;

  const battingTeamId = store.tossDecision === "BAT" ? store.tossWinner : (store.tossWinner === "A" ? "B" : "A");
  const battingTeamColor = battingTeamId === "A" ? "cricket-red" : "cricket-blue";
  const bowlingTeamColor = battingTeamId === "A" ? "cricket-blue" : "cricket-red";
  const tossWinnerColor = store.tossWinner === "A" ? "cricket-red" : "cricket-blue";

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (store.step === 1) {
      if (!store.teamAName.trim())
        newErrors.teamAName = "First team name is required";
      if (!store.teamBName.trim())
        newErrors.teamBName = "Second team name is required";
      if (
        store.teamAName.trim().toLowerCase() ===
        store.teamBName.trim().toLowerCase()
      ) {
        newErrors.teamBName = "Team names must be different";
      }
      if (!store.overs || store.overs < 1)
        newErrors.overs = "Overs must be at least 1";
      if (store.overs > 50) newErrors.overs = "Maximum 50 overs allowed";
    }
    if (store.step === 2) {
      if (teamAPlayers.length === 0)
        newErrors.playersA = `Add at least one player to ${store.teamAName || "A"}`;
      if (teamBPlayers.length === 0)
        newErrors.playersB = `Add at least one player to ${store.teamBName || "B"}`;
      
      // Enforce equal player counts
      if (teamAPlayers.length !== teamBPlayers.length) {
        newErrors.balance = `Both teams must have equal number of players (${teamAPlayers.length} vs ${teamBPlayers.length})`;
      }

      if (!teamAPlayers.some((p) => p.isCaptain))
        newErrors.captainA = `Select a captain for ${store.teamAName || "A"}`;
      if (!teamBPlayers.some((p) => p.isCaptain))
        newErrors.captainB = `Select a captain for ${store.teamBName || "B"}`;
    }
    if (store.step === 3) {
      if (!store.tossResult) newErrors.toss = "Complete the toss first";
      if (!store.tossDecision)
        newErrors.tossDecision = "Winner must choose bat or bowl";
    }
    if (store.step === 4) {
      if (!store.strikerId) newErrors.striker = "Select opening striker";
      if (!store.nonStrikerId)
        newErrors.nonStriker = "Select opening non-striker";
      if (!store.openingBowlerId) newErrors.bowler = "Select opening bowler";
      if (store.strikerId === store.nonStrikerId && store.strikerId) {
        newErrors.nonStriker =
          "Striker and non-striker must be different players";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (store.step < steps.length) {
      store.setStep(store.step + 1);
    }
  };

  const handleBack = () => {
    if (store.step > 1) {
      store.setStep(store.step - 1);
      setErrors({});
    }
  };

  const handleAddPlayer = (user: User, team: "A" | "B") => {
    try {
      store.addPlayer(user, team);
      const isSelected = store.selectedPlayers.some(p => p.user.user_id === user.user_id && p.team === team);
      const teamName = team === "A" ? store.teamAName : store.teamBName;
      const formattedName = formatPlayerName(user.full_name);
      if (!isSelected) {
        toast.success(`${formattedName} removed from ${teamName}`);
      } else {
        toast.success(`${formattedName} added to ${teamName}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update player");
    }
  };

  const handleCreateNewPlayer = async (team: "A" | "B") => {
    if (!newPlayerName.trim() || !newPlayerMobile.trim()) {
      toast.error("Name and mobile required");
      return;
    }
    if (!/^\d{10}$/.test(newPlayerMobile)) {
      toast.error("Enter valid 10-digit mobile number");
      return;
    }
    try {
      const response = await createPlayer.mutateAsync({
        full_name: newPlayerName,
        mobile_number: newPlayerMobile,
      });
      
      const newUser: User = {
        user_id: response.user,
        full_name: newPlayerName,
        mobile_number: newPlayerMobile,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Automatically add to team
      store.addPlayer(newUser, team);
      
      const teamName = team === "A" ? store.teamAName : store.teamBName;
      toast.success(`${formatPlayerName(newPlayerName)} created and added to ${teamName}`);
      setNewPlayerName("");
      setNewPlayerMobile("");
      setShowAddPlayer(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create player");
    }
  };

  const handleToss = () => {
    store.setTossAnimating(true);
    setTimeout(() => {
      const winner: "A" | "B" = Math.random() > 0.5 ? "A" : "B";
      store.setTossResult(winner);
      toast.success(
        `${winner === "A" ? store.teamAName : store.teamBName} won the toss!`,
      );
    }, 2500);
  };

  const handleCreateAndStart = async () => {
    if (!validateStep()) return;

    setIsStarting(true);
    try {
      const match = await createMatch.mutateAsync({
        team_a: {
          name: store.teamAName,
          players: teamAPlayers.map(p => ({
            user_id: p.user.user_id,
            is_captain: p.isCaptain
          }))
        },
        team_b: {
          name: store.teamBName,
          players: teamBPlayers.map(p => ({
            user_id: p.user.user_id,
            is_captain: p.isCaptain
          }))
        },
        overs: store.overs,
        hosted_by: useAuthStore.getState().user?.user_id || "",
        toss_winner_team: store.tossWinner || "A",
        toss_decision: store.tossDecision || "BAT",
        striker_id: store.strikerId || "",
        non_striker_id: store.nonStrikerId || "",
        current_bowler_id: store.openingBowlerId || ""
      });

      store.setMatchId(match.match_id);

      toast.success("Match started! Good luck!");

      // Pass selected players info via state
      setTimeout(() => {
        navigate(`/matches/${match.match_id}/score`, {
          state: {
            strikerId: store.strikerId,
            nonStrikerId: store.nonStrikerId,
            openingBowlerId: store.openingBowlerId,
          },
        });
        store.reset();
      }, 800);
    } catch (error) {
      toast.error("Failed to start match");
      setIsStarting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Stepper */}
      <div className="mb-10 relative">
        {/* Background Line */}
        <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 bg-muted -z-0" />
        
        {/* Progress Line */}
        <motion.div 
          className="absolute top-5 left-[12.5%] h-0.5 bg-cricket-red -z-0"
          initial={{ width: "0%" }}
          animate={{ width: `${((store.step - 1) / (steps.length - 1)) * 75}%` }}
          transition={{ duration: 0.3 }}
        />

        <div className="relative flex items-start justify-between w-full">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center flex-1 z-10">
              <button
                onClick={() => {
                  // Only allow jumping back, not forward past current step
                  if (step.id < store.step) {
                    store.setStep(step.id);
                  }
                }}
                disabled={step.id >= store.step}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-4 border-background transition-all duration-300 ${
                  step.id < store.step
                    ? "bg-cricket-red text-white cursor-pointer hover:scale-110 active:scale-95"
                    : step.id === store.step
                      ? "bg-background text-cricket-red ring-2 ring-cricket-red scale-110"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {step.id < store.step ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className={cn("h-4 w-4", step.id === store.step && "animate-pulse")} />
                )}
              </button>
              <span
                className={`mt-2 text-[10px] font-bold uppercase tracking-tight text-center px-1 ${
                  step.id === store.step ? "text-cricket-red" : "text-muted-foreground opacity-60"
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={store.step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="overflow-hidden border-cricket-silver/30">
            <CardContent className="p-6">
              {/* ===== STEP 1: MATCH DETAILS ===== */}
              {store.step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Match Basic Details
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Enter the basic information for your match
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamA">First Team Name</Label>
                    <Input
                      id="teamA"
                      placeholder="e.g., Tech Strikers"
                      value={store.teamAName}
                      onChange={(e) =>
                        store.setBasicDetails(
                          e.target.value,
                          store.teamBName,
                          store.overs,
                        )
                      }
                      error={errors.teamAName}
                      className="focus-visible:ring-cricket-red"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamB">Second Team Name</Label>
                    <Input
                      id="teamB"
                      placeholder="e.g., Code Warriors"
                      value={store.teamBName}
                      onChange={(e) =>
                        store.setBasicDetails(
                          store.teamAName,
                          e.target.value,
                          store.overs,
                        )
                      }
                      error={errors.teamBName}
                      className="focus-visible:ring-cricket-blue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="overs">Number of Overs</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="overs"
                        type="number"
                        min={1}
                        max={50}
                        value={store.overs}
                        onChange={(e) =>
                          store.setBasicDetails(
                            store.teamAName,
                            store.teamBName,
                            parseInt(e.target.value) || 1,
                          )
                        }
                        error={errors.overs}
                        className="w-32"
                      />
                      <div className="flex gap-2 flex-wrap">
                        {[5, 8, 10, 12, 15, 20].map((o) => (
                          <button
                            key={o}
                            onClick={() =>
                              store.setBasicDetails(
                                store.teamAName,
                                store.teamBName,
                                o,
                              )
                            }
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              store.overs === o
                                ? "bg-cricket-red text-white"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 2: SELECT PLAYERS ===== */}
              {store.step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold">Select Players</h2>
                    <p className="text-sm text-muted-foreground">
                      Search players and assign to teams. Only one player can be shared.
                    </p>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search player by name or mobile..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>

                  {/* Search Results / Empty State */}
                  <AnimatePresence>
                    {searchQuery.length >= 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-xl border bg-card p-3 space-y-2 shadow-sm"
                      >
                        {searchResults && searchResults.length > 0 ? (
                          <>
                            <div className="flex items-center justify-between px-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Matching Players
                              </p>
                              <span className="text-[10px] text-primary font-bold">
                                {searchResults.length} found
                              </span>
                            </div>
                            <div className="max-h-48 overflow-y-auto pr-1 space-y-1 scrollbar-hide">
                              {searchResults.map((player) => (
                                <div
                                  key={player.user_id}
                                  className="flex items-center justify-between p-2 rounded-xl bg-muted/30 hover:bg-muted transition-colors"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                                      {player.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold truncate">
                                        {formatPlayerName(player.full_name)}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {player.mobile_number}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant={teamAPlayers.some(p => p.user.user_id === player.user_id) ? "default" : "outline"}
                                      onClick={() => handleAddPlayer(player, "A")}
                                      className={cn(
                                        "h-7 text-[10px] px-2 rounded-lg font-bold transition-all",
                                        teamAPlayers.some(p => p.user.user_id === player.user_id) 
                                          ? "bg-cricket-red hover:bg-cricket-redDark border-cricket-red text-white" 
                                          : "border-cricket-red/30 text-cricket-red hover:bg-cricket-red/5"
                                      )}
                                    >
                                      {teamAPlayers.some(p => p.user.user_id === player.user_id) ? (
                                        <div className="flex items-center gap-1">
                                          <Check className="h-3 w-3 shrink-0" />
                                          <span className="truncate max-w-[60px]">{store.teamAName || "A"}</span>
                                        </div>
                                      ) : (
                                        <span className="truncate max-w-[80px]">+ {store.teamAName || "A"}</span>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={teamBPlayers.some(p => p.user.user_id === player.user_id) ? "default" : "outline"}
                                      onClick={() => handleAddPlayer(player, "B")}
                                      className={cn(
                                        "h-7 text-[10px] px-2 rounded-lg font-bold transition-all",
                                        teamBPlayers.some(p => p.user.user_id === player.user_id) 
                                          ? "bg-cricket-blue hover:bg-cricket-blueDark border-cricket-blue text-white" 
                                          : "border-cricket-blue/30 text-cricket-blue hover:bg-cricket-blue/5"
                                      )}
                                    >
                                      {teamBPlayers.some(p => p.user.user_id === player.user_id) ? (
                                        <div className="flex items-center gap-1">
                                          <Check className="h-3 w-3 shrink-0" />
                                          <span className="truncate max-w-[60px]">{store.teamBName || "B"}</span>
                                        </div>
                                      ) : (
                                        <span className="truncate max-w-[80px]">+ {store.teamBName || "B"}</span>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-xs text-muted-foreground mb-3 font-medium italic">
                              No existing player found for "{searchQuery}"
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="gap-2 rounded-full border-primary/30 text-primary hover:bg-primary/5"
                              onClick={() => {
                                setNewPlayerName(searchQuery);
                                setShowAddPlayer(true);
                                setSearchQuery("");
                              }}
                            >
                              <Plus className="h-3 w-3" />
                              Add "{searchQuery}" as Guest
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* New Player Form */}
                  <AnimatePresence>
                    {showAddPlayer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl border bg-muted p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold">Create Guest Player</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowAddPlayer(false)}
                            className="h-6 w-6 p-0 rounded-full"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Full Name"
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                          />
                          <Input
                            placeholder="Mobile Number"
                            value={newPlayerMobile}
                            onChange={(e) => setNewPlayerMobile(e.target.value.replace(/\D/g, ""))}
                            maxLength={10}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleCreateNewPlayer("A")}
                            isLoading={createPlayer.isPending}
                            className="flex-1 gap-2 bg-cricket-red hover:bg-cricket-redDark text-[10px] text-white"
                          >
                            <Plus className="h-4 w-4" />
                            {store.teamAName || "A"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleCreateNewPlayer("B")}
                            isLoading={createPlayer.isPending}
                            className="flex-1 gap-2 bg-cricket-blue hover:bg-cricket-blueDark text-[10px] text-white"
                          >
                            <Plus className="h-4 w-4" />
                            {store.teamBName || "B"}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Validation Messages */}
                  <div className="space-y-1">
                    {errors.balance && (
                      <div className="flex items-center gap-1 text-sm text-destructive font-bold mb-2">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {errors.balance}
                      </div>
                    )}
                    {errors.playersA && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" /> {errors.playersA}
                      </div>
                    )}
                    {errors.playersB && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" /> {errors.playersB}
                      </div>
                    )}
                    {errors.captainA && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" /> {errors.captainA}
                      </div>
                    )}
                    {errors.captainB && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" /> {errors.captainB}
                      </div>
                    )}
                  </div>

                  {/* Team Rosters Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Team A */}
                    <div className="rounded-xl border bg-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-cricket-red truncate mr-2">
                          {store.teamAName || "A"}
                        </h3>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {teamAPlayers.length} players
                        </span>
                      </div>

                      {teamAPlayers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No players added yet
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {teamAPlayers.map((player, idx) => {
                            const isCommon = player.user.user_id === commonPlayerId;
                            return (
                              <motion.div
                                key={`a-${player.user.user_id}`}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg hover:bg-muted group transition-all",
                                  isCommon && "bg-cricket-red/5 border border-cricket-red/20"
                                )}
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                <span className="text-xs text-muted-foreground w-4">
                                  {idx + 1}
                                </span>
                                <div className="h-7 w-7 rounded-full bg-cricket-red/20 flex items-center justify-center text-xs font-bold text-cricket-red">
                                  {player.user.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium truncate">
                                      {formatPlayerName(player.user.full_name)}
                                    </p>
                                    {isCommon && (
                                      <span className="text-[8px] font-black uppercase tracking-tighter bg-cricket-red text-white px-1 rounded-sm shrink-0 whitespace-nowrap">
                                        Common
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      try {
                                        store.setCaptain(player.user.user_id, "A");
                                      } catch (error) {
                                        toast.error(error instanceof Error ? error.message : "Action failed");
                                      }
                                    }}
                                    className={`p-1 rounded transition-colors ${player.isCaptain ? "text-yellow-500 bg-yellow-500/20" : "text-muted-foreground hover:text-yellow-500"}`}
                                    title="Captain"
                                  >
                                    <Crown className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => store.setWicketKeeper(player.user.user_id, "A")}
                                    className={`p-1 rounded transition-colors ${player.isWicketKeeper ? "text-blue-500 bg-blue-500/20" : "text-muted-foreground hover:text-blue-500"}`}
                                    title="Wicket Keeper"
                                  >
                                    <Shield className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => store.removePlayer(player.user.user_id, "A")}
                                    className="p-1 rounded text-muted-foreground hover:text-cricket-red transition-all opacity-60 hover:opacity-100"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="rounded-xl border bg-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-cricket-blue truncate mr-2">
                          {store.teamBName || "B"}
                        </h3>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {teamBPlayers.length} players
                        </span>
                      </div>

                      {teamBPlayers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No players added yet
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {teamBPlayers.map((player, idx) => {
                            const isCommon = player.user.user_id === commonPlayerId;
                            return (
                              <motion.div
                                key={`b-${player.user.user_id}`}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg hover:bg-muted group transition-all",
                                  isCommon && "bg-cricket-blue/5 border border-cricket-blue/20"
                                )}
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                <span className="text-xs text-muted-foreground w-4">
                                  {idx + 1}
                                </span>
                                <div className="h-7 w-7 rounded-full bg-cricket-blue/20 flex items-center justify-center text-xs font-bold text-cricket-blue">
                                  {player.user.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium truncate">
                                      {formatPlayerName(player.user.full_name)}
                                    </p>
                                    {isCommon && (
                                      <span className="text-[8px] font-black uppercase tracking-tighter bg-cricket-blue text-white px-1 rounded-sm shrink-0 whitespace-nowrap">
                                        Common
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      try {
                                        store.setCaptain(player.user.user_id, "B");
                                      } catch (error) {
                                        toast.error(error instanceof Error ? error.message : "Action failed");
                                      }
                                    }}
                                    className={`p-1 rounded transition-colors ${player.isCaptain ? "text-yellow-500 bg-yellow-500/20" : "text-muted-foreground hover:text-yellow-500"}`}
                                    title="Captain"
                                  >
                                    <Crown className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => store.setWicketKeeper(player.user.user_id, "B")}
                                    className={`p-1 rounded transition-colors ${player.isWicketKeeper ? "text-blue-500 bg-blue-500/20" : "text-muted-foreground hover:text-blue-500"}`}
                                    title="Wicket Keeper"
                                  >
                                    <Shield className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => store.removePlayer(player.user.user_id, "B")}
                                    className="p-1 rounded text-muted-foreground hover:text-cricket-red transition-all opacity-60 hover:opacity-100"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 3: TOSS ===== */}
              {store.step === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold">Digital Toss</h2>
                    <p className="text-sm text-muted-foreground">
                      Tap the coin to flip and decide the toss winner
                    </p>
                  </div>

                  {/* Coin Animation */}
                  <div className="flex flex-col items-center justify-center py-8">
                    <motion.div
                      animate={
                        store.isTossAnimating
                          ? {
                              rotateY: [0, 360, 720, 1080, 1440, 1800],
                              scale: [1, 1.2, 1, 1.2, 1, 1.3, 1],
                            }
                          : store.tossResult
                            ? {
                                rotateY: 0,
                                scale: 1,
                              }
                            : {
                                rotateY: [0, 10, -10, 0],
                                scale: 1,
                              }
                      }
                      transition={
                        store.isTossAnimating
                          ? {
                              duration: 2.5,
                              ease: "easeInOut",
                            }
                          : {
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }
                      }
                      onClick={() => {
                        if (!store.isTossAnimating && !store.tossResult) {
                          handleToss();
                        }
                      }}
                      className={`relative h-32 w-32 rounded-full cursor-pointer ${
                        store.isTossAnimating
                          ? "bg-gradient-to-br from-cricket-silver via-gray-300 to-cricket-silverDark shadow-2xl"
                          : store.tossResult === "A"
                            ? "bg-gradient-to-br from-cricket-red to-cricket-redDark shadow-xl shadow-cricket-red/30"
                            : store.tossResult === "B"
                              ? "bg-gradient-to-br from-cricket-blue to-cricket-blueDark shadow-xl shadow-cricket-blue/30"
                              : "bg-gradient-to-br from-cricket-silver to-cricket-silverDark shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                      }`}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl">
                          {store.tossResult ? "🏆" : "🪙"}
                        </span>
                      </div>
                      {store.isTossAnimating && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          animate={{
                            boxShadow: [
                              "0 0 20px rgba(220,38,38,0.3)",
                              "0 0 60px rgba(220,38,38,0.6)",
                              "0 0 20px rgba(220,38,38,0.3)",
                            ],
                          }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      )}
                    </motion.div>

                    <AnimatePresence>
                      {store.tossResult && !store.isTossAnimating && (
                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="mt-6 text-center"
                        >
                          <div className={cn(
                            "inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold border transition-all",
                            store.tossResult === "A" 
                              ? "bg-cricket-red/10 text-cricket-red border-cricket-red/20" 
                              : "bg-cricket-blue/10 text-cricket-blue border-cricket-blue/20"
                          )}>
                            <Trophy className="h-5 w-5" />
                            {store.tossResult === "A"
                              ? store.teamAName || "A"
                              : store.teamBName || "B"}{" "}
                            won the toss!
                          </div>
                          <div className="mt-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => store.resetToss()}
                              className="text-[10px] uppercase tracking-widest font-bold opacity-60 hover:opacity-100"
                            >
                              Toss Again
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!store.tossResult && !store.isTossAnimating && (
                      <p className="mt-4 text-sm text-muted-foreground">
                        Tap the coin to flip
                      </p>
                    )}
                    {store.isTossAnimating && (
                      <motion.p
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="mt-4 text-sm font-medium text-cricket-red"
                      >
                        Tossing...
                      </motion.p>
                    )}
                  </div>

                  {/* Toss Decision */}
                  <AnimatePresence>
                    {store.tossResult && !store.isTossAnimating && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <p className="text-center text-sm font-medium">
                          {store.tossResult === "A"
                            ? store.teamAName
                            : store.teamBName}
                          , choose:
                        </p>
                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => store.setTossDecision("BAT")}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              store.tossDecision === "BAT"
                                ? `border-${tossWinnerColor} bg-${tossWinnerColor}/10 text-${tossWinnerColor}`
                                : `border-border hover:border-${tossWinnerColor}/50`
                            }`}
                          >
                            <div className="text-3xl mb-2">🏏</div>
                            <p className="font-semibold">Bat First</p>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => store.setTossDecision("BOWL")}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              store.tossDecision === "BOWL"
                                ? `border-${tossWinnerColor} bg-${tossWinnerColor}/10 text-${tossWinnerColor}`
                                : `border-border hover:border-${tossWinnerColor}/50`
                            }`}
                          >
                            <div className="text-3xl mb-2">🎯</div>
                            <p className="font-semibold">Bowl First</p>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {errors.toss && (
                    <p className="text-sm text-destructive text-center">
                      {errors.toss}
                    </p>
                  )}
                  {errors.tossDecision && (
                    <p className="text-sm text-destructive text-center">
                      {errors.tossDecision}
                    </p>
                  )}
                </div>
              )}

              {/* ===== STEP 4: START MATCH - SELECT OPENING PLAYERS ===== */}
              {store.step === 4 && (
                <div className="space-y-5">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold">
                      Select Opening Players
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Choose the opening batsmen and bowler to start the match
                    </p>
                  </div>

                  {/* Match Summary */}
                  <div className="rounded-xl border bg-muted p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Batting First:
                      </span>
                      <span className="font-semibold">
                        {store.tossDecision === "BAT"
                          ? store.tossWinner === "A"
                            ? store.teamAName
                            : store.teamBName
                          : store.tossWinner === "A"
                            ? store.teamBName
                            : store.teamAName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">
                        Bowling First:
                      </span>
                      <span className="font-semibold">
                        {store.tossDecision === "BOWL"
                          ? store.tossWinner === "A"
                            ? store.teamAName
                            : store.teamBName
                          : store.tossWinner === "A"
                            ? store.teamBName
                            : store.teamAName}
                      </span>
                    </div>
                  </div>

                  {/* Select Striker */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className={`text-${battingTeamColor} font-semibold`}>1.</span>{" "}
                      Select Striker (Facing Bowler)
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {battingTeamPlayers.map((player) => (
                        <motion.button
                          key={`striker-${player.user.user_id}`}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => store.setStriker(player.user.user_id)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            store.strikerId === player.user.user_id
                              ? `border-${battingTeamColor} bg-${battingTeamColor}/10`
                              : `border-border hover:border-${battingTeamColor}/30`
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full bg-${battingTeamColor}/20 flex items-center justify-center text-sm font-bold text-${battingTeamColor}`}>
                              {player.user.full_name.charAt(0).toUpperCase()}
                            </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="text-sm font-medium truncate">
                                    {formatPlayerName(player.user.full_name)}
                                  </p>
                                  {player.user.user_id === commonPlayerId && (
                                    <span className="text-[7px] font-black uppercase tracking-tighter bg-primary text-white px-1 rounded-sm shrink-0 whitespace-nowrap">
                                      Common
                                    </span>
                                  )}
                                </div>
                                {player.isCaptain && (
                                  <span className="text-[10px] text-yellow-500">
                                    Captain
                                  </span>
                                )}
                              </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    {errors.striker && (
                      <p className="text-sm text-destructive">
                        {errors.striker}
                      </p>
                    )}
                  </div>

                  {/* Select Non-Striker */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className={`text-${battingTeamColor} font-semibold`}>
                        2.
                      </span>{" "}
                      Select Non-Striker
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {battingTeamPlayers.map((player) => (
                        <motion.button
                          key={`nonstriker-${player.user.user_id}`}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            store.setNonStriker(player.user.user_id)
                          }
                          disabled={store.strikerId === player.user.user_id}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            store.strikerId === player.user.user_id
                              ? "border-border opacity-40 cursor-not-allowed"
                              : store.nonStrikerId === player.user.user_id
                                ? `border-${battingTeamColor} bg-${battingTeamColor}/10`
                                : `border-border hover:border-${battingTeamColor}/30`
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full bg-${battingTeamColor}/20 flex items-center justify-center text-sm font-bold text-${battingTeamColor}`}>
                              {player.user.full_name.charAt(0).toUpperCase()}
                            </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="text-sm font-medium truncate">
                                    {formatPlayerName(player.user.full_name)}
                                  </p>
                                  {player.user.user_id === commonPlayerId && (
                                    <span className="text-[7px] font-black uppercase tracking-tighter bg-primary text-white px-1 rounded-sm shrink-0 whitespace-nowrap">
                                      Common
                                    </span>
                                  )}
                                </div>
                                {player.isCaptain && (
                                  <span className="text-[10px] text-yellow-500">
                                    Captain
                                  </span>
                                )}
                              </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    {errors.nonStriker && (
                      <p className="text-sm text-destructive">
                        {errors.nonStriker}
                      </p>
                    )}
                  </div>

                  {/* Select Opening Bowler */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className={`text-${bowlingTeamColor} font-semibold`}>3.</span>{" "}
                      Select Opening Bowler
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {bowlingTeamPlayers.map((player) => {
                        const isOccupied = store.strikerId === player.user.user_id || store.nonStrikerId === player.user.user_id;
                        return (
                          <motion.button
                            key={`bowler-${player.user.user_id}`}
                            whileTap={!isOccupied ? { scale: 0.95 } : undefined}
                            onClick={() => !isOccupied && store.setOpeningBowler(player.user.user_id)}
                            disabled={isOccupied}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              isOccupied
                                ? "border-border opacity-40 cursor-not-allowed"
                                : store.openingBowlerId === player.user.user_id
                                  ? `border-${bowlingTeamColor} bg-${bowlingTeamColor}/10`
                                  : `border-border hover:border-${bowlingTeamColor}/30`
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`h-8 w-8 rounded-full bg-${bowlingTeamColor}/20 flex items-center justify-center text-sm font-bold text-${bowlingTeamColor}`}>
                                {player.user.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="text-sm font-medium truncate">
                                    {formatPlayerName(player.user.full_name)}
                                  </p>
                                  {isOccupied ? (
                                    <span className="text-[8px] font-black uppercase tracking-tighter bg-muted text-muted-foreground px-1 rounded-sm shrink-0">
                                      Batting
                                    </span>
                                  ) : player.user.user_id === commonPlayerId && (
                                    <span className="text-[7px] font-black uppercase tracking-tighter bg-primary text-white px-1 rounded-sm shrink-0 whitespace-nowrap">
                                      Common
                                    </span>
                                  )}
                                </div>
                                {!isOccupied && player.isCaptain && (
                                  <span className="text-[10px] text-yellow-500">
                                    Captain
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                    {errors.bowler && (
                      <p className="text-sm text-destructive">
                        {errors.bowler}
                      </p>
                    )}
                  </div>

                  {/* Start Button */}
                  <div className="pt-4 border-t">
                    <Button
                      size="lg"
                      onClick={handleCreateAndStart}
                      isLoading={
                        isStarting ||
                        createMatch.isPending ||
                        startMatch.isPending
                      }
                      className="w-full gap-2 text-lg h-14 bg-cricket-red hover:bg-cricket-redDark"
                    >
                      <Trophy className="h-5 w-5" />
                      Start Match
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              {store.step < 4 && (
                <div className="mt-6 flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={store.step === 1 || store.isTossAnimating}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={store.isTossAnimating}
                    className="gap-2 bg-cricket-red hover:bg-cricket-redDark"
                  >
                    {store.step === 3 ? "Continue" : "Next"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
