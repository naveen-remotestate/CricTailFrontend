import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useMatch,
  useScoreBall,
  useScorecard,
  useBallEvents,
} from "@/hooks/useMatches";
import { useQueryClient } from "@tanstack/react-query";
import { useScoringStore } from "@/store/scoringStore";
import { useMatchCreationStore } from "@/store/matchCreationStore";
import { ScoreHeader } from "@/components/cricket/ScoreHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Play,
  X,
  ChevronRight,
  History,
  Medal,
  ArrowLeft,
  Share2
} from "lucide-react";
import type { User, LiveMatchState } from "@/types";
import { formatOvers, formatPlayerName, cn, calculateRunRate } from "@/lib/utils";
import { ScoringButton } from "@/components/cricket/ScoringButton";

interface BallResult {
  runs: number;
  isWicket?: boolean;
  isWide?: boolean;
  isNoBall?: boolean;
  isBoundary?: boolean;
  isSix?: boolean;
  isDot?: boolean;
  extraType?: "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE";
  extraRuns?: number;
  wicketType?: string;
  dismissedPlayerId?: string;
  dismissedByFielderId?: string;
}

// Local interface for session tracking until API is ready
interface SessionBallEvent {
  runs: number;
  isWicket: boolean;
  extraType?: string | null;
  totalRuns: number;
  overNo: number;
  ballInOver: number;
  strikerName?: string;
  bowlerName?: string;
  wicketType?: string;
  fielderName?: string;
}

export default function LiveScoringPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 1. Data Fetching
  const { data: match, isLoading: matchLoading, refetch: refetchMatch } = useMatch(id || "");
  const { data: scorecard, refetch: refetchScorecard } = useScorecard(id || "");
  const { data: apiBallEvents } = useBallEvents(match?.current_inning_id || "");
  const scoreBall = useScoreBall();
  const creationStore = useMatchCreationStore();

  const handleShareMatch = () => {
    const url = `${window.location.origin}/matches/${id}/live`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Live link copied! Share it with viewers.");
    }).catch(() => {
      toast.error("Failed to copy link.");
    });
  };

  // 2. Local State
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showNewBatsmanModal, setShowNewBatsmanModal] = useState(false);
  const [showNewBowlerModal, setShowNewBowlerModal] = useState(false);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showFielderModal, setShowFielderModal] = useState(false);
  const [showRunOutDismissedModal, setShowRunOutDismissedModal] = useState(false);
  const [showRetiredHurtModal, setShowRetiredHurtModal] = useState(false);
  const [pendingExtraType, setPendingExtraType] = useState<"WIDE" | "NO_BALL" | "BYE" | "LEG_BYE" | null>(null);
  const [isFreeHit, setIsFreeHit] = useState(false);
  
  const [pendingBall, setPendingBall] = useState<BallResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tempNextBatsmanId, setTempNextBatsmanId] = useState<string | null>(null);
  
  // Local session events to fix the "dots/numbers" issue for the current user
  const [sessionEvents, setSessionEvents] = useState<SessionBallEvent[]>([]);
  const queryClient = useQueryClient();

  // Sync sessionEvents with apiBallEvents
  useEffect(() => {
    if (apiBallEvents) {
      const mappedEvents: SessionBallEvent[] = apiBallEvents.map((b: any) => ({
        runs: b.runs_off_bat,
        isWicket: b.is_wicket,
        extraType: b.extra_type,
        totalRuns: b.total_runs,
        overNo: b.over_no,
        ballInOver: b.ball_in_over,
        strikerName: b.striker_name,
        bowlerName: b.bowler_name,
        wicketType: b.wicket_type,
        fielderName: b.dismissed_by_fielder_name
      }));
      setSessionEvents(mappedEvents);
    }
  }, [apiBallEvents]);

  const isMatchStarted = match ? (!match.is_completed && !!match.current_inning_id) : false;

  // --- REFETCH SYNC ---
  const syncData = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ["match", id] });
    queryClient.invalidateQueries({ queryKey: ["scorecard", id] });
    queryClient.invalidateQueries({ queryKey: ["ball-events", match?.current_inning_id] });
    await Promise.all([refetchMatch(), refetchScorecard()]);
  }, [id, match?.current_inning_id, queryClient, refetchMatch, refetchScorecard]);

  // --- SQUAD LOGIC ---
  const getSquad = (teamType: 'batting' | 'bowling') => {
    // 1. Try Creation Store (most accurate for host)
    if (creationStore.matchId === id) {
      return teamType === 'batting' 
        ? creationStore.getBattingTeamPlayers().map(p => p.user)
        : creationStore.getBowlingTeamPlayers().map(p => p.user);
    }
    
    // 2. Fallback to Scorecard
    const currentInning = match?.current_innings_no === 1 ? scorecard?.first_innings : scorecard?.second_innings;
    if (currentInning) {
      const list = teamType === 'batting' ? currentInning.batting : currentInning.bowling;
      return list?.map(p => ({ user_id: p.user_id, full_name: p.player_name } as User)) || [];
    }
    return [];
  };

  const allBattingUsers = getSquad('batting');
  const allBowlingUsers = getSquad('bowling');

  const currentScorecardInning = match?.current_innings_no === 1 ? scorecard?.first_innings : scorecard?.second_innings;
  const outPlayerIds = currentScorecardInning?.batting?.filter(s => s.is_out).map(s => s.user_id) || [];

  const handleScore = useCallback(
    async (result: BallResult, nextBatId?: string, nextBowlId?: string) => {
      if (!match) return;

      setIsProcessing(true);
      try {
        let runsOffBat = 0;
        let extraRuns = 0;
        let extraType: string | null = null;

        if (result.isNoBall) {
          runsOffBat = result.runs;
          extraRuns = 0;
          extraType = "NO_BALL";
        } else if (result.isWide) {
          runsOffBat = 0;
          extraRuns = result.runs;
          extraType = "WIDE";
        } else if (result.extraType === "BYE" || result.extraType === "LEG_BYE") {
          runsOffBat = 0;
          extraRuns = result.runs;
          extraType = result.extraType!;
        } else {
          runsOffBat = result.runs;
          extraRuns = 0;
          extraType = null;
        }

        const payload = {
          match_id: id || "",
          runs_off_bat: runsOffBat,
          extra_type: extraType,
          extra_runs: extraRuns,
          is_wicket: !!result.isWicket,
          wicket_type: result.wicketType || null,
          dismissed_player_id: result.dismissedPlayerId || null,
          dismissed_by_fielder_id: result.dismissedByFielderId || (result.wicketType === "BOWLED" || result.wicketType === "LBW" ? match.bowler_id : null),
          next_batsman_id: nextBatId || "",
          next_bowler_id: nextBowlId || "",
        };

        await scoreBall.mutateAsync({ matchId: id || "", data: payload });

        // Update Free Hit state
        if (extraType === "NO_BALL") {
          setIsFreeHit(true);
        } else if (extraType !== "WIDE") {
          setIsFreeHit(false);
        }

        toast.success("Ball recorded!");
        setPendingBall(null);
        setTempNextBatsmanId(null);
        await syncData();
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to record ball event");
      } finally {
        setIsProcessing(false);
      }
    },
    [id, match, scoreBall, syncData]
  );

  const onScoreClick = (result: BallResult) => {
    if (isProcessing) return;

    // 1. Handle Wicket (Needs Type -> Next Batsman -> [Next Bowler if 6th ball] -> API)
    if (result.isWicket) {
      setPendingBall({ ...result, dismissedPlayerId: match?.striker_id || "" });
      setShowWicketModal(true);
      return;
    }

    // 2. Handle Over Completion (Needs Next Bowler -> API)
    const currentLegalBalls = match?.legal_balls || 0;
    const isOverEnding = !result.isWide && !result.isNoBall && (currentLegalBalls + 1) % 6 === 0;

    if (isOverEnding) {
      setPendingBall(result);
      setShowNewBowlerModal(true);
      return;
    }

    // 3. Regular Ball
    handleScore(result);
  };

  const handleWicketType = (type: string) => {
    if (!pendingBall || !match) return;
    
    const updatedBall = { ...pendingBall, wicketType: type };
    setPendingBall(updatedBall);
    setShowWicketModal(false);

    if (type === "BOWLED" || type === "LBW") {
      // Auto-set fielder as bowler and move to next batsman
      setPendingBall({ ...updatedBall, dismissedPlayerId: match.striker_id || undefined });
      setShowNewBatsmanModal(true);
    } else if (type === "CAUGHT" || type === "STUMPED") {
      // Need to ask for fielder
      setPendingBall({ ...updatedBall, dismissedPlayerId: match.striker_id || undefined });
      setShowFielderModal(true);
    } else if (type === "RUN_OUT") {
      // Need to ask who was dismissed first
      setShowRunOutDismissedModal(true);
    } else {
      // HIT_WICKET etc.
      setPendingBall({ ...updatedBall, dismissedPlayerId: match.striker_id || undefined });
      setShowNewBatsmanModal(true);
    }
  };

  const handleRunOutDismissed = (playerId: string) => {
    if (!pendingBall) return;
    setPendingBall({ ...pendingBall, dismissedPlayerId: playerId });
    setShowRunOutDismissedModal(false);
    setShowFielderModal(true);
  };

  const handleFielderSelection = (fielderId: string) => {
    if (!pendingBall) return;
    setPendingBall({ ...pendingBall, dismissedByFielderId: fielderId });
    setShowFielderModal(false);
    setShowNewBatsmanModal(true);
  };

  const handleRetiredHurt = (playerId: string) => {
    setPendingBall({ runs: 0, isWicket: true, wicketType: "RETIRED_HURT", dismissedPlayerId: playerId });
    setShowRetiredHurtModal(false);
    setShowNewBatsmanModal(true);
  };

  const handleNextBatsmanSelection = (batsmanId: string) => {
    if (!pendingBall) return;
    
    const currentLegalBalls = match?.legal_balls || 0;
    const isOverEnding = !pendingBall.isWide && !pendingBall.isNoBall && (currentLegalBalls + 1) % 6 === 0;

    if (isOverEnding) {
      setTempNextBatsmanId(batsmanId);
      setShowNewBatsmanModal(false);
      setShowNewBowlerModal(true);
    } else {
      setShowNewBatsmanModal(false);
      handleScore(pendingBall, batsmanId);
    }
  };

  const handleNextBowlerSelection = (bowlerId: string) => {
    if (!pendingBall) return;
    setShowNewBowlerModal(false);
    handleScore(pendingBall, tempNextBatsmanId || undefined, bowlerId);
  };

  const handleExtraRuns = (runs: number, isWicketOnExtra: boolean = false) => {
    if (!pendingExtraType) return;
    const isWide = pendingExtraType === "WIDE";
    const isNoBall = pendingExtraType === "NO_BALL";
    const extraType = (pendingExtraType === "BYE" || pendingExtraType === "LEG_BYE") ? pendingExtraType : undefined;
    
    if (isWicketOnExtra && isWide) {
      // Transition to Run Out flow for Wide
      setPendingBall({ runs, isWide, isNoBall, extraType, isWicket: true, wicketType: "RUN_OUT" });
      setShowExtraModal(false);
      setShowRunOutDismissedModal(true);
      setPendingExtraType(null);
    } else {
      setShowExtraModal(false);
      onScoreClick({ runs, isWide, isNoBall, extraType });
      setPendingExtraType(null);
    }
  };

  if (matchLoading) return (
    <div className="min-h-screen bg-background">
      <Skeleton className="h-32 w-full" />
      <div className="p-4 space-y-4">
        <Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  if (!match) return (
    <div className="flex min-h-screen items-center justify-center p-4 text-center">
      <p className="text-muted-foreground font-bold uppercase tracking-widest">Match not found</p>
    </div>
  );

  const currentLiveState: LiveMatchState = { 
    match_id: id || "", 
    total_runs: match.current_total_runs, 
    total_wickets: match.current_total_wickets, 
    legal_balls: match.legal_balls, 
    updated_at: new Date().toISOString() 
  };

  const remainingBatsmen = allBattingUsers.filter(u => 
    u.user_id !== match.striker_id && 
    u.user_id !== match.non_striker_id && 
    !outPlayerIds.includes(u.user_id)
  );

  const otherBowlers = allBowlingUsers.filter(u => u.user_id !== match.bowler_id);

  // --- VISUALIZER LOGIC ---
  const activeOverNo = Math.floor((match?.legal_balls || 0) / 6);
  const currentOverDisplayNo = activeOverNo + 1;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-10">
      <div className="sticky top-0 z-[100] border-b bg-background/95 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-black uppercase tracking-tighter italic">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-primary/20 text-primary hover:bg-primary/10" onClick={handleShareMatch} title="Share Live Match">
                <Share2 className="h-3.5 w-3.5" />
              </Button>
              <div className="h-4 w-[1px] bg-border mx-1" />
              <div className="live-indicator relative h-2 w-2 rounded-full bg-red-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">Scoring</span>
            </div>
          </div>
        </div>
      </div>
      <ScoreHeader match={match} liveState={currentLiveState} />
      
      {!isMatchStarted ? (
        <div className="flex-1 flex items-center justify-center p-4">
           <Card className="w-full max-w-sm rounded-[2.5rem] border border-border shadow-xl bg-card p-8 text-center">
              <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                 <Play className="h-8 w-8 text-primary fill-current" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter italic">Ready to Score</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-8">Click Configure to set openers if needed.</p>
              <Button size="lg" className="w-full rounded-2xl h-14 font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20" asChild>
                 <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
           </Card>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
              {/* Batsmen Row */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: match.striker_id, name: match.striker_name, runs: match.striker_runs, balls: match.striker_balls, isStriker: true },
                  { id: match.non_striker_id, name: match.non_striker_name, runs: match.non_striker_runs, balls: match.non_striker_balls, isStriker: false }
                ].map((b) => (
                  <Card key={b.id || (b.isStriker ? 'striker' : 'non-striker')} className={cn(
                    "rounded-3xl border-2 transition-all overflow-hidden",
                    b.isStriker ? "border-primary bg-card shadow-lg" : "border-border bg-card/50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm", b.isStriker ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                          {b.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black truncate">{formatPlayerName(b.name) || "Waiting..."}</p>
                          <p className={cn("text-[8px] font-black uppercase tracking-widest", b.isStriker ? "text-primary" : "text-muted-foreground")}>
                            {b.isStriker ? "Striker *" : "Non-Striker"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-baseline gap-1">
                        <motion.span key={b.runs} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-3xl font-black">{b.runs || 0}</motion.span>
                        <span className="text-xs font-bold text-muted-foreground/60 uppercase">R ({b.balls || 0})</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Bowler Card */}
              <Card className="rounded-[2rem] border border-border bg-card shadow-sm overflow-hidden">
                <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center text-blue-600 font-black text-lg">
                        {match.bowler_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight">{formatPlayerName(match.bowler_name) || "Waiting..."}</p>
                        <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">Active Bowler</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-blue-600 leading-none">{match.bowler_wickets || 0}/{match.bowler_runs_given || 0}</p>
                      <p className="text-[10px] font-black text-muted-foreground mt-2 uppercase tracking-tighter">
                        {formatOvers(match.bowler_legal_balls || 0)} OVS | Econ {calculateRunRate(match.bowler_runs_given || 0, match.bowler_legal_balls || 0)}
                      </p>
                    </div>
                </CardContent>
              </Card>

              {/* Over Progress Visualizer */}
              <div className="bg-card rounded-[2rem] p-5 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-muted-foreground/40" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Balls</span>
                      {isFreeHit && (
                        <motion.span 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[8px] font-black uppercase tracking-[0.2em] animate-pulse"
                        >
                          Free Hit
                        </motion.span>
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase text-primary">Over {currentOverDisplayNo}</span>
                </div>
                <div className="flex flex-nowrap justify-center gap-1 sm:gap-1.5 items-center w-full overflow-hidden py-2 px-1">
                    {(() => {
                      const ballsInThisOver = sessionEvents.filter(b => b.overNo === (activeOverNo + 1));
                      const legalBallsInThisOver = ballsInThisOver.filter(b => !b.extraType || (b.extraType !== 'WIDE' && b.extraType !== 'NO_BALL')).length;
                      const placeholders = Math.max(0, 6 - legalBallsInThisOver);
                      
                      const totalItems = [
                        ...ballsInThisOver.map(b => ({ type: 'ball' as const, data: b })),
                        ...Array(placeholders).fill(null).map((_, i) => ({ type: 'placeholder' as const, index: i }))
                      ];

                      const ballCount = totalItems.length;
                      const sizeClass = ballCount > 10 ? "h-8 w-8 text-[7px] border" : 
                                       ballCount > 8 ? "h-9 w-9 text-[8px] border-2" : 
                                       ballCount > 6 ? "h-10 w-10 text-[9px] border-2" : 
                                       "h-12 w-12 text-[10px] border-2";

                      return totalItems.map((item, idx) => {
                        if (item.type === 'ball') {
                          const ball = item.data!;
                          let displayText = "";
                          let ballColorClass = "border-muted bg-muted/20 text-muted-foreground";
                          
                          if (ball.isWicket) {
                            displayText = "W";
                            if (ball.extraType === "WIDE") {
                              displayText = ball.runs > 0 ? `W+${ball.runs}wd` : "W+wd";
                            } else if (ball.extraType === "NO_BALL") {
                              displayText = ball.runs > 0 ? `W+${ball.runs}nb` : "W+nb";
                            }
                            ballColorClass = "border-red-500 bg-red-500/10 text-red-600";
                          } else if (ball.extraType === "WIDE") {
                            displayText = ball.runs > 0 ? `${ball.runs}wd` : "wd";
                            ballColorClass = "border-yellow-600 bg-yellow-500/10 text-yellow-700";
                          } else if (ball.extraType === "NO_BALL") {
                            displayText = ball.runs > 0 ? `${ball.runs}nb` : "nb";
                            ballColorClass = "border-yellow-600 bg-yellow-500/10 text-yellow-700";
                          } else if (ball.extraType === "BYE") {
                            displayText = ball.totalRuns > 0 ? `${ball.totalRuns}b` : "b";
                            ballColorClass = "border-blue-400 bg-blue-400/10 text-blue-600";
                          } else if (ball.extraType === "LEG_BYE") {
                            displayText = ball.totalRuns > 0 ? `${ball.totalRuns}lb` : "lb";
                            ballColorClass = "border-blue-400 bg-blue-400/10 text-blue-600";
                          } else {
                            displayText = ball.runs.toString();
                            if (ball.runs === 4) ballColorClass = "border-primary bg-primary/10 text-primary";
                            else if (ball.runs === 6) ballColorClass = "border-purple-600 bg-purple-500/10 text-purple-600";
                          }

                          return (
                            <motion.div 
                              key={`ball-${idx}`} 
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className={cn(
                                "rounded-full flex items-center justify-center font-black transition-all shadow-sm shrink-0",
                                sizeClass,
                                ballColorClass
                              )}
                            >
                              {displayText}
                            </motion.div>
                          );
                        } else {
                          const isNext = idx === ballsInThisOver.length && legalBallsInThisOver < 6;
                          return (
                            <div 
                              key={`placeholder-${idx}`} 
                              className={cn(
                                "rounded-full border-dashed flex items-center justify-center font-black transition-all shrink-0",
                                sizeClass,
                                isNext ? "border-primary bg-primary/5 text-primary scale-110 shadow-md animate-pulse" : "border-muted text-muted-foreground/20"
                              )}
                            >
                              {ballCount > 10 ? "" : "•"}
                            </div>
                          );
                        }
                      });
                    })()}
                </div>
              </div>

              {/* Commentary Section */}
              <div className="bg-card rounded-[2rem] p-5 border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <History className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Match Feed</span>
                </div>
                <div className="space-y-0 max-h-60 overflow-y-auto scrollbar-hide px-1">
                  {sessionEvents.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic text-center py-4 uppercase font-bold tracking-widest">No deliveries yet...</p>
                  ) : (
                    (() => {
                      const reversedEvents = sessionEvents.slice().reverse();
                      return reversedEvents.map((ball, i) => {
                        const isOverEnd = i < reversedEvents.length - 1 && ball.overNo !== reversedEvents[i+1].overNo;
                        return (
                          <div key={i}>
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 py-3 border-b border-border/30 last:border-0 transition-colors">
                              {/* Subtle Ball Count Circle */}
                              <div className="h-10 w-10 rounded-full border border-border bg-muted/10 flex items-center justify-center shrink-0">
                                 <span className="text-[10px] font-black text-muted-foreground italic leading-none">{ball.overNo}.{ball.ballInOver}</span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <p className="text-[11px] font-black uppercase tracking-tight leading-none text-foreground truncate">
                                      {formatPlayerName(ball.bowlerName)} to {formatPlayerName(ball.strikerName)}
                                    </p>
                                    {/* Result Indicator Badge */}
                                    <div className={cn(
                                      "px-2 py-0.5 rounded-full border font-black text-[9px] uppercase tracking-widest shadow-sm",
                                      ball.isWicket ? "border-red-500 bg-red-500/10 text-red-600" :
                                      ball.extraType === "WIDE" || ball.extraType === "NO_BALL" ? "border-yellow-600 bg-yellow-500/10 text-yellow-700" :
                                      ball.runs === 4 ? "border-primary bg-primary/10 text-primary" :
                                      ball.runs === 6 ? "border-purple-600 bg-purple-500/10 text-purple-600" :
                                      ball.extraType === "BYE" || ball.extraType === "LEG_BYE" ? "border-blue-400 bg-blue-400/10 text-blue-600" :
                                      "border-muted bg-muted/20 text-muted-foreground"
                                    )}>
                                      {(() => {
                                        if (ball.isWicket) return "W";
                                        if (ball.extraType === "WIDE") return "wd";
                                        if (ball.extraType === "NO_BALL") return "nb";
                                        if (ball.extraType === "BYE") return "b";
                                        if (ball.extraType === "LEG_BYE") return "lb";
                                        return ball.runs;
                                      })()}
                                    </div>
                                  </div>
                                  <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-2">
                                    {ball.isWicket ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-red-500 font-black uppercase italic tracking-widest text-[9px]">
                                          OUT! {ball.wicketType?.replace("_", " ")} {ball.fielderName ? `(${formatPlayerName(ball.fielderName)})` : ""}
                                        </span>
                                        {ball.extraType && (
                                          <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 font-black text-[8px] border border-yellow-500/20 uppercase">
                                            {(() => {
                                              if (ball.extraType === "WIDE") return ball.totalRuns > 1 ? `${ball.runs} ` : "";
                                              if (ball.extraType === "NO_BALL") return ball.runs > 0 ? `${ball.runs} ` : "";
                                              if (ball.extraType === "BYE" || ball.extraType === "LEG_BYE") return ball.totalRuns > 0 ? `${ball.totalRuns} ` : "";
                                              return "";
                                            })()}
                                            {ball.extraType}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-foreground/80 uppercase">
                                          {ball.runs === 4 ? "FOUR RUNS" : ball.runs === 6 ? "SIXER!" : ball.runs === 0 && !ball.extraType ? "No run" : `${ball.runs} run${ball.runs !== 1 ? 's' : ''}`}
                                        </span>
                                        {ball.extraType && (
                                          <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 font-black text-[8px] border border-yellow-500/20 uppercase">
                                            {(() => {
                                              if (ball.extraType === "WIDE") return ball.totalRuns > 1 ? `${ball.runs} ` : "";
                                              if (ball.extraType === "NO_BALL") return ball.runs > 0 ? `${ball.runs} ` : "";
                                              if (ball.extraType === "BYE" || ball.extraType === "LEG_BYE") return ball.totalRuns > 0 ? `${ball.totalRuns} ` : "";
                                              return "";
                                            })()}
                                            {ball.extraType}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                            {isOverEnd && (
                              <div className="py-3 flex items-center gap-2">
                                <div className="h-[1px] flex-1 bg-border/40" />
                                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">End of Over {reversedEvents[i+1].overNo}</span>
                                <div className="h-[1px] flex-1 bg-border/40" />
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur-lg pb-8 shadow-2xl">
            <div className="mx-auto max-w-3xl px-4 py-4">
              <div className="grid grid-cols-4 gap-2">
                <ScoringButton label="0" sublabel="Dot" onClick={() => onScoreClick({ runs: 0, isDot: true })} variant="dot" disabled={isProcessing} />
                <ScoringButton label="1" onClick={() => onScoreClick({ runs: 1 })} variant="default" disabled={isProcessing} />
                <ScoringButton label="2" onClick={() => onScoreClick({ runs: 2 })} variant="default" disabled={isProcessing} />
                <ScoringButton label="3" onClick={() => onScoreClick({ runs: 3 })} variant="default" disabled={isProcessing} />
                
                <ScoringButton label="4" sublabel="Four" onClick={() => onScoreClick({ runs: 4, isBoundary: true })} variant="boundary" disabled={isProcessing} />
                <ScoringButton label="6" sublabel="Sixer" onClick={() => onScoreClick({ runs: 6, isSix: true })} variant="six" disabled={isProcessing} />
                <ScoringButton label="W" sublabel="Wicket" onClick={() => onScoreClick({ runs: 0, isWicket: true })} variant="wicket" disabled={isProcessing} />
                <ScoringButton label="WD" sublabel="Wide" onClick={() => { setPendingExtraType("WIDE"); setShowExtraModal(true); }} variant="extra" disabled={isProcessing} />
                
                <ScoringButton label="NB" sublabel="No Ball" onClick={() => { setPendingExtraType("NO_BALL"); setShowExtraModal(true); }} variant="extra" disabled={isProcessing} />
                <ScoringButton label="BYE" sublabel="Bye" onClick={() => { setPendingExtraType("BYE"); setShowExtraModal(true); }} variant="extra" disabled={isProcessing} />
                <ScoringButton label="LB" sublabel="LegBye" onClick={() => { setPendingExtraType("LEG_BYE"); setShowExtraModal(true); }} variant="extra" disabled={isProcessing} />
                
                <ScoringButton label="RETIRED" sublabel="Hurt" onClick={() => setShowRetiredHurtModal(true)} variant="undo" disabled={isProcessing} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODALS */}
      <AnimatePresence>
        {showWicketModal && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="w-full max-w-sm bg-card rounded-[3rem] border shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Out!</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowWicketModal(false)}><X className="h-6 w-6" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(isFreeHit ? ["RUN_OUT"] : ["BOWLED", "CAUGHT", "LBW", "RUN_OUT", "STUMPED", "HIT_WICKET"]).map((type) => (
                  <Button key={type} variant="outline" className="h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all" onClick={() => handleWicketType(type)}>
                    {type.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {showRunOutDismissedModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-card rounded-[3rem] border shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Who was out?</h3>
                <Button variant="ghost" size="icon" onClick={() => { setShowRunOutDismissedModal(false); setPendingBall(null); }}><X className="h-6 w-6" /></Button>
              </div>
              <div className="grid gap-4">
                {[
                  { id: match.striker_id, name: match.striker_name, label: "Striker" },
                  { id: match.non_striker_id, name: match.non_striker_name, label: "Non-Striker" }
                ].map((p) => (
                  <Button key={p.id} className="h-16 rounded-2xl font-black uppercase tracking-widest text-sm flex flex-col items-center justify-center gap-1" onClick={() => handleRunOutDismissed(p.id!)}>
                    <span>{formatPlayerName(p.name)}</span>
                    <span className="text-[10px] opacity-60 font-bold">{p.label}</span>
                  </Button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {showRetiredHurtModal && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-card rounded-[3rem] border shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Retired Hurt</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowRetiredHurtModal(false)}><X className="h-6 w-6" /></Button>
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase mb-6 tracking-widest text-center">Select batsman leaving the field</p>
              <div className="grid gap-4">
                {[
                  { id: match.striker_id, name: match.striker_name, label: "Striker" },
                  { id: match.non_striker_id, name: match.non_striker_name, label: "Non-Striker" }
                ].map((p) => (
                  <Button key={p.id} className="h-16 rounded-2xl font-black uppercase tracking-widest text-sm flex flex-col items-center justify-center gap-1" onClick={() => handleRetiredHurt(p.id!)}>
                    <span>{formatPlayerName(p.name)}</span>
                    <span className="text-[10px] opacity-60 font-bold">{p.label}</span>
                  </Button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {showFielderModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-card rounded-[3rem] border shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
              <div className="p-8 border-b bg-muted/20">
                 <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Fielder Involved</h3>
                    <Button variant="ghost" size="icon" onClick={() => { setShowFielderModal(false); setPendingBall(null); }}><X className="h-6 w-6" /></Button>
                 </div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase mt-2 tracking-[0.2em]">Select fielder for {pendingBall?.wicketType?.replace("_", " ")}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {allBowlingUsers.map(player => (
                   <button key={player.user_id} onClick={() => handleFielderSelection(player.user_id)} className="w-full p-5 rounded-[2rem] bg-muted/10 border-2 border-transparent hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-2xl bg-card border shadow-sm flex items-center justify-center font-black text-sm group-hover:bg-primary group-hover:text-white transition-colors">{player.full_name.charAt(0).toUpperCase()}</div>
                         <span className="font-black text-sm uppercase tracking-tight">{formatPlayerName(player.full_name)}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                   </button>
                 ))}
              </div>
            </motion.div>
          </div>
        )}

        {showNewBatsmanModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-card rounded-[3rem] border shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
              <div className="p-8 border-b bg-muted/20">
                 <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Next Batsman</h3>
                    <Button variant="ghost" size="icon" onClick={() => { setShowNewBatsmanModal(false); setPendingBall(null); }}><X className="h-6 w-6" /></Button>
                 </div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase mt-2 tracking-[0.2em]">Select incoming player</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {remainingBatsmen.length === 0 ? (
                   <div className="text-center py-10 opacity-40">
                      <Medal className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-black uppercase tracking-widest italic text-lg">Innings Over!</p>
                   </div>
                 ) : (
                   remainingBatsmen.map(player => (
                     <button key={player.user_id} onClick={() => handleNextBatsmanSelection(player.user_id)} className="w-full p-5 rounded-[2rem] bg-muted/10 border-2 border-transparent hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-2xl bg-card border shadow-sm flex items-center justify-center font-black text-sm group-hover:bg-primary group-hover:text-white transition-colors">{player.full_name.charAt(0).toUpperCase()}</div>
                           <span className="font-black text-sm uppercase tracking-tight">{formatPlayerName(player.full_name)}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                     </button>
                   ))
                 )}
              </div>
            </motion.div>
          </div>
        )}

        {showNewBowlerModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-card rounded-[3rem] border shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
              <div className="p-8 border-b bg-blue-600/5">
                 <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic text-blue-600">New Over</h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowNewBowlerModal(false)}><X className="h-5 w-5" /></Button>
                 </div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase mt-2 tracking-[0.2em]">Select next bowler</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {otherBowlers.length === 0 ? (
                   <p className="text-center py-10 text-muted-foreground font-bold italic">No other bowlers available</p>
                 ) : (
                   otherBowlers.map(player => (
                     <button key={player.user_id} onClick={() => handleNextBowlerSelection(player.user_id)} className="w-full p-5 rounded-[2rem] bg-muted/10 border-2 border-transparent hover:border-blue-600/40 hover:bg-blue-600/5 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-2xl bg-card border shadow-sm flex items-center justify-center font-black text-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">{player.full_name.charAt(0).toUpperCase()}</div>
                           <span className="font-black text-sm uppercase tracking-tight">{formatPlayerName(player.full_name)}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-blue-600" />
                     </button>
                   ))
                 )}
              </div>
            </motion.div>
          </div>
        )}

        {showExtraModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-card rounded-[3rem] border shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">
                  {pendingExtraType} RUNS
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowExtraModal(false)}><X className="h-6 w-6" /></Button>
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase mb-6 tracking-widest text-center">How many runs were taken by batsmen?</p>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2, 3, 4, 6].map((r) => (
                  <div key={r} className="space-y-2">
                    <Button variant="outline" className="w-full h-16 rounded-2xl font-black text-lg hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all" onClick={() => handleExtraRuns(r)}>
                      {r}
                    </Button>
                    {pendingExtraType === "WIDE" && (
                      <Button variant="ghost" className="w-full h-8 rounded-xl text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-500/5 hover:bg-red-500/10" onClick={() => handleExtraRuns(r, true)}>
                        + Wicket
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
