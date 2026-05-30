import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useMatch,
  useScoreBall,
  useFinishInnings,
  useStartNextInnings,
} from "@/hooks/useMatches";
import { useScoringStore } from "@/store/scoringStore";
import { ScoreHeader } from "@/components/cricket/ScoreHeader";
import { BatsmanDisplay } from "@/components/cricket/BatsmanDisplay";
import { BowlerDisplay } from "@/components/cricket/BowlerDisplay";
import { OverProgress } from "@/components/cricket/OverProgress";
import { ScoringButton } from "@/components/cricket/ScoringButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Undo2,
  ArrowRightLeft,
  UserPlus,
  AlertTriangle,
  Play,
  X,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import type { BallEvent, User } from "@/types";
import { formatOvers } from "@/lib/utils";

interface BallResult {
  runs: number;
  isWicket?: boolean;
  isWide?: boolean;
  isNoBall?: boolean;
  isBoundary?: boolean;
  isSix?: boolean;
  isDot?: boolean;
  extraRuns?: number;
}

interface BatsmanState {
  user: User;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  isStriker: boolean;
}

interface BowlerState {
  user: User;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  wides: number;
  noBalls: number;
}

export default function LiveScoringPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: match, isLoading } = useMatch(id || "");
  const scoreBall = useScoreBall();
  const { ballHistory, addBallEvent, undoLastBall, canUndo, setCurrentMatch } =
    useScoringStore();

  // Get selected players from navigation state
  const navState = location.state as {
    strikerId?: string;
    nonStrikerId?: string;
    openingBowlerId?: string;
  } | null;

  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showWideModal, setShowWideModal] = useState(false);
  const [showNoBallModal, setShowNoBallModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showNewBatsmanModal, setShowNewBatsmanModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [lastBall, setLastBall] = useState<BallResult | null>(null);
  const [animateScore, setAnimateScore] = useState(false);
  const [pendingWicket, setPendingWicket] = useState<BallResult | null>(null);
  const [isMatchStarted, setIsMatchStarted] = useState(false);
  const [showInningsEndModal, setShowInningsEndModal] = useState(false);
  const [inningsEndReason, setInningsEndReason] = useState("");

  const finishInnings = useFinishInnings();
  const startNextInnings = useStartNextInnings();

  // Batsmen state
  const [batsmen, setBatsmen] = useState<BatsmanState[]>([]);
  const [bowler, setBowler] = useState<BowlerState | null>(null);
  const [availableBatsmen, setAvailableBatsmen] = useState<User[]>([]);
  const [availableBowlers, setAvailableBowlers] = useState<User[]>([]);

  // Score state
  const [totalRuns, setTotalRuns] = useState(0);
  const [totalWickets, setTotalWickets] = useState(0);
  const [totalBalls, setTotalBalls] = useState(0);
  const [currentOver, setCurrentOver] = useState<BallResult[]>([]);
  const [overNumber, setOverNumber] = useState(1);
  const [partnershipRuns, setPartnershipRuns] = useState(0);
  const [partnershipBalls, setPartnershipBalls] = useState(0);

  // Max wickets based on batting team size
  const [maxWickets, setMaxWickets] = useState(10);

  useEffect(() => {
    if (match) {
      setCurrentMatch(match);

      // Determine current batting and bowling teams
      const isSecondInnings = match.current_innings_no === 2;
      const battingFirstId = match.batting_first_team_id || match.team_a_id;
      
      const currentBattingTeamId = isSecondInnings 
        ? (battingFirstId === match.team_a_id ? match.team_b_id : match.team_a_id)
        : battingFirstId;
      
      const battingTeam = currentBattingTeamId === match.team_a_id ? match.team_a : match.team_b;
      const bowlingTeam = currentBattingTeamId === match.team_a_id ? match.team_b : match.team_a;

      const battingPlayers =
        (battingTeam?.players?.map((p) => p.user).filter(Boolean) as User[]) ||
        [];
      const bowlingPlayers =
        (bowlingTeam?.players?.map((p) => p.user).filter(Boolean) as User[]) ||
        [];

      setMaxWickets(Math.max(battingPlayers.length - 1, 0));
      setAvailableBatsmen(battingPlayers);
      setAvailableBowlers(bowlingPlayers);

      // If match already has live state, use it
      if (match.live_state && match.status === "LIVE") {
        setIsMatchStarted(true);
        setTotalRuns(match.live_state.total_runs);
        setTotalWickets(match.live_state.total_wickets);
        setTotalBalls(match.live_state.legal_balls);

        // Initialize batsmen from live state
        const striker = battingPlayers.find(
          (p) => p.user_id === match.live_state?.striker_id,
        );
        const nonStriker = battingPlayers.find(
          (p) => p.user_id === match.live_state?.non_striker_id,
        );
        const currentBowler = bowlingPlayers.find(
          (p) => p.user_id === match.live_state?.current_bowler_id,
        );

        if (striker && nonStriker) {
          setBatsmen([
            {
              user: striker,
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              isOut: false,
              isStriker: true,
            },
            {
              user: nonStriker,
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              isOut: false,
              isStriker: false,
            },
          ]);
        }

        if (currentBowler) {
          setBowler({
            user: currentBowler,
            balls: 0,
            runs: 0,
            wickets: 0,
            maidens: 0,
            wides: 0,
            noBalls: 0,
          });
        }
      }
    }
  }, [match, setCurrentMatch]);

  const rotateStrike = useCallback(() => {
    setBatsmen((prev) => {
      if (prev.length < 2) return prev;
      return prev.map((b) => ({ ...b, isStriker: !b.isStriker }));
    });
  }, []);

  const getStriker = useCallback(
    () => batsmen.find((b) => b.isStriker && !b.isOut),
    [batsmen],
  );
  const getNonStriker = useCallback(
    () => batsmen.find((b) => !b.isStriker && !b.isOut),
    [batsmen],
  );

  const handleScore = useCallback(
    async (result: BallResult) => {
      // Check max wickets
      if (result.isWicket && totalWickets >= maxWickets) {
        toast.error("All out! No more wickets available.");
        return;
      }

      // Check if striker exists
      const striker = getStriker();
      if (!striker && !result.isWide && !result.isNoBall) {
        toast.error("No striker available!");
        return;
      }

      setLastBall(result);
      setAnimateScore(true);
      setTimeout(() => setAnimateScore(false), 500);

      const isLegal = !result.isWide && !result.isNoBall;
      const totalRunsThisBall =
        result.runs + (result.isWide ? 1 : result.isNoBall ? 1 : 0);

      // Update total score
      setTotalRuns((prev) => prev + totalRunsThisBall);
      setPartnershipRuns((prev) => prev + totalRunsThisBall);

      // Update bowler
      setBowler((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          runs: prev.runs + totalRunsThisBall,
          balls: prev.balls + (isLegal ? 1 : 0),
          wides: prev.wides + (result.isWide ? 1 : 0),
          noBalls: prev.noBalls + (result.isNoBall ? 1 : 0),
          wickets: prev.wickets + (result.isWicket ? 1 : 0),
        };
      });

      // Update striker
      if (striker && isLegal) {
        setBatsmen((prev) =>
          prev.map((b) => {
            if (b.user.user_id === striker.user.user_id) {
              return {
                ...b,
                runs: b.runs + result.runs,
                balls: b.balls + 1,
                fours: b.fours + (result.runs === 4 ? 1 : 0),
                sixes: b.sixes + (result.runs === 6 ? 1 : 0),
                isOut: result.isWicket ? true : b.isOut,
              };
            }
            return b;
          }),
        );
      }

      // Handle wicket
      if (result.isWicket) {
        setTotalWickets((prev) => {
          const nextWickets = prev + 1;
          if (nextWickets >= maxWickets) {
            setTimeout(() => {
              setInningsEndReason("All Out!");
              setShowInningsEndModal(true);
            }, 800);
          } else {
            // Remove striker from active, will need new batsman
            setTimeout(() => {
              setShowNewBatsmanModal(true);
            }, 800);
          }
          return nextWickets;
        });
        setPartnershipRuns(0);
        setPartnershipBalls(0);
      } else {
        setPartnershipBalls((prev) => prev + (isLegal ? 1 : 0));
      }

      // Update total balls
      if (isLegal) {
        setTotalBalls((prev) => {
          const newTotal = prev + 1;
          
          // 1. Check for Match Victory (2nd Innings only)
          if (match?.current_innings_no === 2) {
            const firstInningsRuns = match.innings?.[0]?.total_runs || 0;
            const target = firstInningsRuns + 1;
            if (totalRuns + totalRunsThisBall >= target) {
              setTotalRuns((prevRuns) => prevRuns + totalRunsThisBall);
              setTimeout(() => {
                setInningsEndReason("Target Reached!");
                setShowInningsEndModal(true);
              }, 800);
              return newTotal;
            }
          }

          // 2. Check for Innings Completion (Max Overs)
          const maxBalls = (match?.overs || 0) * 6;
          if (newTotal >= maxBalls) {
             setTimeout(() => {
                setInningsEndReason("Overs Completed!");
                setShowInningsEndModal(true);
             }, 800);
          } else if (newTotal % 6 === 0) {
            // 3. Over completion (Not yet end of innings)
            setTimeout(() => {
              toast.info(`Over ${newTotal / 6} complete! Select new bowler.`);
              setShowBowlerModal(true);
              rotateStrike();
            }, 600);
          }
          return newTotal;
        });
      }

      // Strike rotation on odd runs (only legal deliveries, not wicket)
      if (isLegal && result.runs % 2 === 1 && !result.isWicket) {
        rotateStrike();
      }

      // Over progression
      setCurrentOver((prev) => {
        const newOver = [...prev, result];
        if (newOver.length > 6 || (isLegal && totalBalls % 6 === 5)) {
          return [];
        }
        return newOver;
      });

      // Create ball event
      const event: BallEvent = {
        id: crypto.randomUUID(),
        innings_id: match?.innings?.[0]?.id || "",
        ball_sequence: totalBalls + 1,
        over_no: Math.floor(totalBalls / 6) + 1,
        ball_in_over: (totalBalls % 6) + 1,
        striker_id: striker?.user.user_id || "",
        non_striker_id: getNonStriker()?.user.user_id || "",
        bowler_id: bowler?.user.user_id || "",
        runs_off_bat: result.isWide || result.isNoBall ? 0 : result.runs,
        extra_runs: result.isWide
          ? result.runs + 1
          : result.isNoBall
            ? result.runs + 1
            : 0,
        total_runs: totalRunsThisBall,
        extra_type: result.isWide
          ? "WIDE"
          : result.isNoBall
            ? "NO_BALL"
            : undefined,
        is_legal_delivery: isLegal,
        is_boundary_four: result.isBoundary && result.runs === 4,
        is_boundary_six: result.isSix,
        is_dot_ball: result.isDot,
        is_wicket: result.isWicket,
        bowled_at: new Date().toISOString(),
      };
      addBallEvent(event);

      // Feedback toasts
      if (result.isSix) toast.success("SIX! 🚀", { duration: 1500 });
      else if (result.isBoundary) toast.success("FOUR! 🔥", { duration: 1500 });
      else if (result.isWicket) toast.error("WICKET! ☝️", { duration: 1500 });

      // API call
      try {
        await scoreBall.mutateAsync({
          matchId: id || "",
          data: {
            runs_off_bat: result.isWide || result.isNoBall ? 0 : result.runs,
            extra_type: result.isWide
              ? "WIDE"
              : result.isNoBall
                ? "NO_BALL"
                : undefined,
            extra_runs: result.isWide
              ? result.runs + 1
              : result.isNoBall
                ? result.runs + 1
                : 0,
            is_wicket: result.isWicket,
          },
        });
      } catch (error) {
        // Mock won't fail
      }
    },
    [
      id,
      match,
      totalBalls,
      totalWickets,
      maxWickets,
      overNumber,
      bowler,
      getStriker,
      getNonStriker,
      rotateStrike,
      scoreBall,
      addBallEvent,
    ],
  );

  const handleDot = () => handleScore({ runs: 0, isDot: true });
  const handleRun = (runs: number) =>
    handleScore({ runs, isBoundary: runs === 4, isSix: runs === 6 });
  const handleWide = () => setShowWideModal(true);
  const handleNoBall = () => setShowNoBallModal(true);
  const handleWicket = () => {
    if (totalWickets >= maxWickets) {
      toast.error("All out! Cannot lose more wickets.");
      return;
    }
    setPendingWicket({ runs: 0, isWicket: true });
    setShowWicketModal(true);
  };

  const handleWideRuns = (runs: number) => {
    handleScore({ runs, isWide: true });
    setShowWideModal(false);
  };

  const handleNoBallOutcome = (outcome: "dot" | "runs" | "wicket") => {
    if (outcome === "dot") {
      handleScore({ runs: 0, isNoBall: true });
      setShowNoBallModal(false);
    } else if (outcome === "runs") {
      setShowNoBallModal(false);
      handleScore({ runs: 1, isNoBall: true });
    } else {
      if (totalWickets >= maxWickets) {
        toast.error("All out!");
        return;
      }
      setShowNoBallModal(false);
      setPendingWicket({ runs: 0, isNoBall: true, isWicket: true });
      setShowWicketModal(true);
    }
  };

  const handleWicketType = (type: string) => {
    if (pendingWicket) {
      handleScore(pendingWicket);
    } else {
      handleScore({ runs: 0, isWicket: true });
    }
    setShowWicketModal(false);
    setPendingWicket(null);
    toast.success(`${type} wicket recorded`);
  };

  const handleUndo = () => {
    if (canUndo && ballHistory.length > 0) {
      const lastEvent = ballHistory[ballHistory.length - 1];
      undoLastBall();

      // Reverse state
      setTotalRuns((prev) => prev - lastEvent.total_runs);
      setTotalBalls((prev) => prev - (lastEvent.is_legal_delivery ? 1 : 0));

      if (lastEvent.is_wicket) {
        setTotalWickets((prev) => prev - 1);
        setBowler((prev) =>
          prev ? { ...prev, wickets: prev.wickets - 1 } : null,
        );
      }

      setBowler((prev) =>
        prev
          ? {
              ...prev,
              runs: prev.runs - lastEvent.total_runs,
              balls: prev.balls - (lastEvent.is_legal_delivery ? 1 : 0),
            }
          : null,
      );

      setCurrentOver((prev) => prev.slice(0, -1));
      toast.info("Last ball undone");
    }
  };

  const handleSwapStrike = () => {
    rotateStrike();
    setShowSwapModal(false);
    toast.info("Strike swapped!");
  };

  const handleFinishInnings = async () => {
    try {
      await finishInnings.mutateAsync(id || "");
      if (match?.current_innings_no === 2) {
        toast.success("Match Completed!");
        navigate("/dashboard");
      } else {
        toast.success("Innings Completed!");
        // CLEAR local state for next innings setup
        setBatsmen([]); 
        setBowler(null);
        setTotalRuns(0);
        setTotalWickets(0);
        setTotalBalls(0);
        setCurrentOver([]);
        setPartnershipRuns(0);
        setPartnershipBalls(0);
        
        setShowInningsEndModal(false);
        // We will trigger openers selection for 2nd innings
        setIsMatchStarted(false); 
      }
    } catch (error) {
      toast.error("Failed to finish innings");
    }
  };

  const handleStartNextInnings = async (data: { striker_id: string; non_striker_id: string; bowler_id: string }) => {
    try {
      // 1. Update backend/mock state
      await startNextInnings.mutateAsync({
        matchId: id || "",
        data
      });

      // 2. Identify the new batting and bowling teams
      const nextBattingTeamId = match?.batting_first_team_id === match?.team_a_id ? match?.team_b_id : match?.team_a_id;
      const nextBattingTeam = nextBattingTeamId === match?.team_a_id ? match?.team_a : match?.team_b;
      const nextBowlingTeam = nextBattingTeamId === match?.team_a_id ? match?.team_b : match?.team_a;

      const battingPlayers = (nextBattingTeam?.players?.map(p => p.user).filter(Boolean) as User[]) || [];
      const bowlingPlayers = (nextBowlingTeam?.players?.map(p => p.user).filter(Boolean) as User[]) || [];

      // 3. Initialize local state for 2nd innings
      const striker = battingPlayers.find(p => p.user_id === data.striker_id);
      const nonStriker = battingPlayers.find(p => p.user_id === data.non_striker_id);
      const openingBowler = bowlingPlayers.find(p => p.user_id === data.bowler_id);

      if (striker && nonStriker) {
        setBatsmen([
          { user: striker, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isStriker: true },
          { user: nonStriker, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isStriker: false }
        ]);
      }

      if (openingBowler) {
        setBowler({
          user: openingBowler,
          balls: 0,
          runs: 0,
          wickets: 0,
          maidens: 0,
          wides: 0,
          noBalls: 0,
        });
      }

      setOverNumber(1);
      setIsMatchStarted(true);
      toast.success("Second innings started!");
    } catch (error) {
      toast.error("Failed to start next innings");
    }
  };

  const handleNewBatsman = (player: User) => {
    setBatsmen((prev) => {
      // Find the one who ISN'T out and ISN'T currently the striker (or just keep the existing non-striker)
      const existingNonStriker = prev.find(b => !b.isOut && !b.isStriker);
      
      const newBatsmanState: BatsmanState = {
        user: player,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        isStriker: true,
      };

      if (existingNonStriker) {
        return [
          { ...existingNonStriker, isStriker: false },
          newBatsmanState
        ];
      }
      
      // Fallback if somehow there's no non-striker (shouldn't happen in normal flow)
      return [newBatsmanState];
    });
    setShowNewBatsmanModal(false);
    toast.success(`${player.full_name} is the new batsman`);
  };

  const handleNewBowler = (player: User) => {
    setBowler({
      user: player,
      balls: 0,
      runs: 0,
      wickets: 0,
      maidens: 0,
      wides: 0,
      noBalls: 0,
    });
    setShowBowlerModal(false);
    setCurrentOver([]);
    setOverNumber((prev) => prev + 1);
    toast.success(`${player.full_name} is the new bowler`);
  };

  const handleStartMatch = () => {
    const isSecondInnings = match?.innings?.length === 1 && match?.innings[0]?.is_completed;
    
    // Determine current batting and bowling teams
    const battingFirstId = match?.batting_first_team_id || match?.team_a_id;
    const currentBattingTeamId = isSecondInnings 
      ? (battingFirstId === match?.team_a_id ? match?.team_b_id : match?.team_a_id)
      : battingFirstId;
    
    const battingTeam = currentBattingTeamId === match?.team_a_id ? match?.team_a : match?.team_b;
    const bowlingTeam = currentBattingTeamId === match?.team_a_id ? match?.team_b : match?.team_a;

    const battingPlayers =
      (battingTeam?.players?.map((p) => p.user).filter(Boolean) as User[]) ||
      [];
    const bowlingPlayers =
      (bowlingTeam?.players?.map((p) => p.user).filter(Boolean) as User[]) ||
      [];

    // Use nav state or fallback to first players
    const strikerId = navState?.strikerId || battingPlayers[0]?.user_id;
    const nonStrikerId = navState?.nonStrikerId || battingPlayers[1]?.user_id;
    const bowlerId = navState?.openingBowlerId || bowlingPlayers[0]?.user_id;

    const striker =
      battingPlayers.find((p) => p.user_id === strikerId) || battingPlayers[0];
    const nonStriker =
      battingPlayers.find((p) => p.user_id === nonStrikerId) ||
      battingPlayers[1];
    const openingBowler =
      bowlingPlayers.find((p) => p.user_id === bowlerId) || bowlingPlayers[0];

    if (striker && nonStriker) {
      setBatsmen([
        {
          user: striker,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          isStriker: true,
        },
        {
          user: nonStriker,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          isStriker: false,
        },
      ]);
    }

    if (openingBowler) {
      setBowler({
        user: openingBowler,
        balls: 0,
        runs: 0,
        wickets: 0,
        maidens: 0,
        wides: 0,
        noBalls: 0,
      });
    }

    // Call startNextInnings if it's 2nd innings transition
    if (isSecondInnings) {
       handleStartNextInnings({
         striker_id: strikerId || "",
         non_striker_id: nonStrikerId || "",
         bowler_id: bowlerId || ""
       });
    } else {
       setIsMatchStarted(true);
    }
    
    toast.success("Match started! Openers at the crease.");
  };

  // Get remaining batsmen (not out, not currently batting)
  const getRemainingBatsmen = () => {
    const battingIds = batsmen.map((b) => b.user.user_id);
    return availableBatsmen.filter((p) => !battingIds.includes(p.user_id));
  };

  // Get remaining bowlers (not current bowler)
  const getRemainingBowlers = () => {
    return availableBowlers.filter((p) => p.user_id !== bowler?.user.user_id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-32" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    );
  }

  const striker = getStriker();
  const nonStriker = getNonStriker();

  const currentLiveState: LiveMatchState = {
    match_id: id || "",
    innings_id: match.innings?.find(i => !i.is_completed)?.id || "",
    striker_id: striker?.user.user_id || "",
    non_striker_id: nonStriker?.user.user_id || "",
    current_bowler_id: bowler?.user.user_id || "",
    total_runs: totalRuns,
    total_wickets: totalWickets,
    legal_balls: totalBalls,
    updated_at: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Score Header */}
      <ScoreHeader match={match} liveState={currentLiveState} />

      {/* Start Match Overlay */}
      {!isMatchStarted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-2xl bg-background p-6 text-center shadow-2xl border border-cricket-silver/30"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cricket-red/20 mx-auto">
              <Play className="h-8 w-8 text-cricket-red" />
            </div>
            <h2 className="text-xl font-bold mb-2">Ready to Score?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {match.innings?.length === 1 && match.innings[0]?.is_completed 
                ? `${match.team_a?.id === match.batting_first_team_id ? match.team_b?.name : match.team_a?.name} (2nd Innings)`
                : `${match.team_a?.name} vs ${match.team_b?.name}`}
            </p>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              {striker && <p>Striker: {striker.user.full_name}</p>}
              {nonStriker && <p>Non-Striker: {nonStriker.user.full_name}</p>}
              {bowler && <p>Bowler: {bowler.user.full_name}</p>}
            </div>
            <Button
              size="lg"
              className="w-full gap-2 bg-cricket-red hover:bg-cricket-redDark"
              onClick={handleStartMatch}
            >
              <Play className="h-5 w-5" />
              Start Scoring
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-4 space-y-4">
          {/* Batsmen */}
          <div className="grid grid-cols-2 gap-3">
            {batsmen
              .filter((b) => !b.isOut)
              .map((batsman) => (
                <motion.div
                  key={batsman.user.user_id}
                  layout
                  className={`rounded-xl border-2 p-3 ${
                    batsman.isStriker
                      ? "border-cricket-red bg-cricket-red/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        batsman.isStriker
                          ? "bg-cricket-red/20 text-cricket-red"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {batsman.user.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {batsman.user.full_name}
                      </p>
                      <p className="text-xs text-cricket-red">
                        {batsman.isStriker ? "* Striker" : "Non-striker"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <motion.span
                      key={batsman.runs}
                      initial={{ scale: 1.3, color: "#DC2626" }}
                      animate={{ scale: 1, color: "inherit" }}
                      className="text-2xl font-bold"
                    >
                      {batsman.runs}
                    </motion.span>
                    <span className="text-xs text-muted-foreground">
                      ({batsman.balls})
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {batsman.fours > 0 && `${batsman.fours}x4 `}
                      {batsman.sixes > 0 && `${batsman.sixes}x6`}
                    </span>
                  </div>
                </motion.div>
              ))}
          </div>

          {/* Bowler */}
          {bowler && (
            <motion.div
              layout
              className="rounded-xl border border-border bg-card p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-cricket-silverDark/30 flex items-center justify-center text-xs font-bold text-cricket-silverDark">
                    {bowler.user.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {bowler.user.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Current Bowler
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {bowler.wickets}/{bowler.runs}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>O: {formatOvers(bowler.balls)}</span>
                <span>M: {bowler.maidens}</span>
                <span>
                  Econ:{" "}
                  {bowler.balls > 0
                    ? ((bowler.runs / bowler.balls) * 6).toFixed(2)
                    : "0.00"}
                </span>
                {(bowler.wides > 0 || bowler.noBalls > 0) && (
                  <span className="text-yellow-500">
                    {bowler.wides > 0 && `${bowler.wides}wd`}{" "}
                    {bowler.noBalls > 0 && `${bowler.noBalls}nb`}
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Over Progress */}
          <div className="rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Current Over ({overNumber})
              </span>
              <span className="text-xs text-muted-foreground">
                {formatOvers(totalBalls)} total
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => {
                const ball = currentOver[i];
                const isCurrent = i === totalBalls % 6;
                return (
                  <motion.div
                    key={i}
                    initial={isCurrent ? { scale: 0 } : false}
                    animate={{ scale: 1 }}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      ball?.isWicket
                        ? "bg-cricket-red/20 text-cricket-red"
                        : ball?.isSix
                          ? "bg-purple-500/20 text-purple-500"
                          : ball?.isBoundary
                            ? "bg-cricket-red/10 text-cricket-red"
                            : ball?.isWide || ball?.isNoBall
                              ? "bg-yellow-500/20 text-yellow-600"
                              : ball?.isDot
                                ? "bg-muted text-muted-foreground"
                                : ball
                                  ? "bg-cricket-silver/20 text-foreground"
                                  : "bg-muted/50 text-muted-foreground"
                    } ${isCurrent && !ball ? "ring-2 ring-cricket-red ring-offset-1" : ""}`}
                  >
                    {ball?.isWicket
                      ? "W"
                      : ball?.isWide
                        ? `${ball.runs + 1}wd`
                        : ball?.isNoBall
                          ? `${ball.runs + 1}nb`
                          : ball?.isDot
                            ? "0"
                            : ball?.runs}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Partnership */}
          <div className="rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Partnership</span>
              <span className="font-semibold">
                {partnershipRuns} runs ({partnershipBalls} balls)
              </span>
            </div>
          </div>

          {/* Last Ball Animation */}
          <AnimatePresence>
            {lastBall && animateScore && (
              <motion.div
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`text-center py-3 rounded-xl text-xl font-bold ${
                  lastBall.isSix
                    ? "bg-purple-500/20 text-purple-500 border-2 border-purple-500/30"
                    : lastBall.isBoundary
                      ? "bg-cricket-red/20 text-cricket-red border-2 border-cricket-red/30"
                      : lastBall.isWicket
                        ? "bg-cricket-red/20 text-cricket-red border-2 border-cricket-red/30"
                        : lastBall.isWide || lastBall.isNoBall
                          ? "bg-yellow-500/20 text-yellow-600 border-2 border-yellow-500/30"
                          : lastBall.isDot
                            ? "bg-muted text-muted-foreground border-2 border-border"
                            : "bg-cricket-silver/20 text-foreground border-2 border-cricket-silver/30"
                }`}
              >
                {lastBall.isWicket
                  ? "WICKET! ☝️"
                  : lastBall.isSix
                    ? "SIX RUNS! 🚀"
                    : lastBall.isBoundary
                      ? "FOUR RUNS! 🔥"
                      : lastBall.isWide
                        ? `Wide + ${lastBall.runs > 0 ? lastBall.runs : ""} = ${lastBall.runs + 1}`
                        : lastBall.isNoBall
                          ? `No Ball + ${lastBall.runs} = ${lastBall.runs + 1}`
                          : lastBall.isDot
                            ? "DOT BALL"
                            : `${lastBall.runs} RUN${lastBall.runs > 1 ? "S" : ""}`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ball History */}
          {ballHistory.length > 0 && (
            <div className="rounded-xl border bg-card p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Recent Deliveries
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ballHistory.slice(-12).map((ball) => (
                  <motion.span
                    key={ball.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`inline-flex items-center justify-center h-7 min-w-[1.75rem] px-1.5 rounded-md text-xs font-bold ${
                      ball.is_wicket
                        ? "bg-cricket-red/20 text-cricket-red"
                        : ball.is_boundary_six
                          ? "bg-purple-500/20 text-purple-500"
                          : ball.is_boundary_four
                            ? "bg-cricket-red/10 text-cricket-red"
                            : ball.extra_type
                              ? "bg-yellow-500/20 text-yellow-600"
                              : ball.is_dot_ball
                                ? "bg-muted text-muted-foreground"
                                : "bg-cricket-silver/20 text-foreground"
                    }`}
                  >
                    {ball.is_wicket
                      ? "W"
                      : ball.is_boundary_six
                        ? "6"
                        : ball.is_boundary_four
                          ? "4"
                          : ball.total_runs}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scoring Controls */}
      <div className="sticky bottom-[56px] md:bottom-0 z-40 border-t bg-background/95 backdrop-blur-lg safe-bottom">
        <div className="mx-auto max-w-3xl px-3 py-3">
          <div className="grid grid-cols-5 gap-2 mb-2">
            <ScoringButton
              label="0"
              sublabel="Dot"
              onClick={handleDot}
              variant="dot"
            />
            <ScoringButton
              label="1"
              onClick={() => handleRun(1)}
              variant="default"
            />
            <ScoringButton
              label="2"
              onClick={() => handleRun(2)}
              variant="default"
            />
            <ScoringButton
              label="3"
              onClick={() => handleRun(3)}
              variant="default"
            />
            <ScoringButton
              label="4"
              onClick={() => handleRun(4)}
              variant="boundary"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <ScoringButton
              label="6"
              onClick={() => handleRun(6)}
              variant="six"
            />
            <ScoringButton
              label="W"
              sublabel="Wicket"
              onClick={handleWicket}
              variant="wicket"
            />
            <ScoringButton
              label="WD"
              sublabel="Wide"
              onClick={handleWide}
              variant="extra"
            />
            <ScoringButton
              label="NB"
              sublabel="No Ball"
              onClick={handleNoBall}
              variant="extra"
            />
          </div>
          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={!canUndo}
                className="gap-1 h-8"
              >
                <Undo2 className="h-3.5 w-3.5" /> Undo
              </Button>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSwapModal(true)}
                className="gap-1 h-8"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" /> Swap
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewBatsmanModal(true)}
                className="gap-1 h-8"
              >
                <UserPlus className="h-3.5 w-3.5" /> New
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* Wicket Modal */}
      <AnimatePresence>
        {showWicketModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowWicketModal(false);
              setPendingWicket(null);
            }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-background p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-1">How Out?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select dismissal type
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Bowled",
                  "Caught",
                  "LBW",
                  "Run Out",
                  "Stumped",
                  "Hit Wicket",
                ].map((type) => (
                  <motion.button
                    key={type}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleWicketType(type)}
                    className="flex items-center gap-3 p-3 rounded-xl border hover:border-cricket-red/50 hover:bg-cricket-red/5 transition-colors text-left"
                  >
                    <span className="text-2xl">
                      {type === "Bowled"
                        ? "🎯"
                        : type === "Caught"
                          ? "🧤"
                          : type === "LBW"
                            ? "🦵"
                            : type === "Run Out"
                              ? "🏃"
                              : type === "Stumped"
                                ? "🥅"
                                : "💥"}
                    </span>
                    <div>
                      <p className="font-semibold text-sm">{type}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => {
                  setShowWicketModal(false);
                  setPendingWicket(null);
                }}
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wide Modal */}
      <AnimatePresence>
        {showWideModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4"
            onClick={() => setShowWideModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-background p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-1">Wide + Runs</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Did batsmen run extras?
              </p>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4].map((runs) => (
                  <motion.button
                    key={runs}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleWideRuns(runs)}
                    className="flex flex-col items-center justify-center h-16 rounded-xl border-2 border-border hover:border-cricket-red/50 hover:bg-cricket-red/5 transition-colors"
                  >
                    <span className="text-xl font-bold">
                      {runs === 0 ? "0" : `+${runs}`}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {runs === 0 ? "Just wide" : "runs"}
                    </span>
                  </motion.button>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground">
                  Total ={" "}
                  <span className="font-semibold text-foreground">1</span>{" "}
                  (wide) +{" "}
                  <span className="font-semibold text-foreground">
                    selected
                  </span>
                </p>
              </div>
              <Button
                variant="ghost"
                className="w-full mt-3"
                onClick={() => setShowWideModal(false)}
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Ball Modal */}
      <AnimatePresence>
        {showNoBallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4"
            onClick={() => setShowNoBallModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-background p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-1">No Ball Outcome</h3>
              <p className="text-sm text-muted-foreground mb-4">
                What happened off the no ball?
              </p>
              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNoBallOutcome("dot")}
                  className="p-4 rounded-xl border-2 border-border hover:border-cricket-silverDark/50 hover:bg-cricket-silver/5 transition-colors"
                >
                  <span className="text-2xl block mb-1">⭕</span>
                  <span className="text-sm font-semibold">Dot</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNoBallOutcome("runs")}
                  className="p-4 rounded-xl border-2 border-border hover:border-cricket-red/50 hover:bg-cricket-red/5 transition-colors"
                >
                  <span className="text-2xl block mb-1">🏃</span>
                  <span className="text-sm font-semibold">Runs</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNoBallOutcome("wicket")}
                  className="p-4 rounded-xl border-2 border-border hover:border-cricket-red/50 hover:bg-cricket-red/5 transition-colors"
                >
                  <span className="text-2xl block mb-1">☝️</span>
                  <span className="text-sm font-semibold">Wicket</span>
                </motion.button>
              </div>
              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => setShowNoBallModal(false)}
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Bowler Modal */}
      <AnimatePresence>
        {showBowlerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl border border-cricket-silver/30"
            >
              <h3 className="text-lg font-semibold mb-1">Over Complete!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select the next bowler
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getRemainingBowlers().map((player) => (
                  <button
                    key={player.user_id}
                    onClick={() => handleNewBowler(player)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-cricket-red/50 hover:bg-cricket-red/5 transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-cricket-silverDark/30 flex items-center justify-center text-sm font-bold text-cricket-silverDark">
                      {player.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{player.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.mobile_number}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Batsman Modal */}
      <AnimatePresence>
        {showNewBatsmanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl border border-cricket-red/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">New Batsman</h3>
                  <p className="text-sm text-muted-foreground">
                    Select who comes in next
                  </p>
                </div>
                {totalWickets >= maxWickets && (
                  <div className="flex items-center gap-1 text-cricket-red text-sm">
                    <AlertTriangle className="h-4 w-4" /> All Out!
                  </div>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getRemainingBatsmen().length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No more batsmen available
                  </p>
                ) : (
                  getRemainingBatsmen().map((player) => (
                    <button
                      key={player.user_id}
                      onClick={() => handleNewBatsman(player)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-cricket-red/50 hover:bg-cricket-red/5 transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-full bg-cricket-red/20 flex items-center justify-center text-sm font-bold text-cricket-red">
                        {player.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{player.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {player.mobile_number}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => setShowNewBatsmanModal(false)}
              >
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Innings End Modal */}
      <AnimatePresence>
        {showInningsEndModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-background p-8 text-center shadow-2xl border border-cricket-red/20"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cricket-red/10 mx-auto">
                <CheckCircle2 className="h-10 w-10 text-cricket-red" />
              </div>
              
              <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">{inningsEndReason}</h2>
              <p className="text-muted-foreground mb-8">
                The {match.current_innings_no === 1 ? "first" : "second"} innings has come to an end.
              </p>

              <div className="bg-muted/30 rounded-2xl p-4 mb-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Final Score</p>
                <div className="text-3xl font-black text-foreground">
                  {totalRuns}/{totalWickets}
                </div>
                <p className="text-xs font-medium text-muted-foreground">in {formatOvers(totalBalls)} overs</p>
              </div>

              <Button
                size="lg"
                className="w-full gap-2 bg-cricket-red hover:bg-cricket-redDark h-14 text-lg rounded-2xl shadow-lg shadow-cricket-red/20"
                onClick={handleFinishInnings}
                isLoading={finishInnings.isPending}
              >
                {match.current_innings_no === 1 ? (
                  <>
                    Next Innings
                    <ChevronRight className="h-5 w-5" />
                  </>
                ) : (
                  <>
                    Finish Match
                    <CheckCircle2 className="h-5 w-5" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swap Strike Modal */}
      <AnimatePresence>
        {showSwapModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl text-center"
            >
              <h3 className="text-lg font-semibold mb-2">Swap Strike?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {striker?.user.full_name} ↔ {nonStriker?.user.full_name}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSwapModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-cricket-red hover:bg-cricket-redDark"
                  onClick={handleSwapStrike}
                >
                  Swap
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
