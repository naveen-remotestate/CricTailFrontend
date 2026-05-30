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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Undo2,
  ArrowRightLeft,
  UserPlus,
  Play,
} from "lucide-react";
import type { User, LiveMatchState } from "@/types";
import { formatOvers, formatPlayerName } from "@/lib/utils";
import { ScoringButton } from "@/components/cricket/ScoringButton";

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
  const { canUndo, setCurrentMatch } = useScoringStore();

  const navState = location.state as {
    strikerId?: string;
    nonStrikerId?: string;
    openingBowlerId?: string;
  } | null;

  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [pendingWicket, setPendingWicket] = useState<BallResult | null>(null);
  const [isMatchStarted, setIsMatchStarted] = useState(false);
  const [showInningsEndModal, setShowInningsEndModal] = useState(false);
  const [inningsEndReason, setInningsEndReason] = useState("");

  const finishInnings = useFinishInnings();
  const startNextInnings = useStartNextInnings();

  const [batsmen, setBatsmen] = useState<BatsmanState[]>([]);
  const [bowler, setBowler] = useState<BowlerState | null>(null);

  const [totalRuns, setTotalRuns] = useState(0);
  const [totalWickets, setTotalWickets] = useState(0);
  const [totalBalls, setTotalBalls] = useState(0);
  const [currentOver, setCurrentOver] = useState<BallResult[]>([]);
  const [overNumber, setOverNumber] = useState(1);

  const [maxWickets, setMaxWickets] = useState(10);

  useEffect(() => {
    if (match) {
      setCurrentMatch(match);
      const battingTeamId = match.batting_team_id;
      const battingTeamPlayers = (match.team_a_id === battingTeamId ? match.team_a?.players : match.team_b?.players) || [];
      const bowlingTeamPlayers = (match.team_a_id === battingTeamId ? match.team_b?.players : match.team_a?.players) || [];
      const battingPlayers = (battingTeamPlayers.map((p: any) => p.user).filter(Boolean) as User[]) || [];
      const bowlingPlayers = (bowlingTeamPlayers.map((p: any) => p.user).filter(Boolean) as User[]) || [];

      setMaxWickets(Math.max(battingPlayers.length - 1, 0));

      if (!match.is_completed && match.start_time !== null) {
        setIsMatchStarted(true);
        setTotalRuns(match.current_total_runs);
        setTotalWickets(match.current_total_wickets);
        setTotalBalls(match.legal_balls);

        const striker = battingPlayers.find((p) => p.user_id === match.striker_id);
        const nonStriker = battingPlayers.find((p) => p.user_id === match.non_striker_id);
        const currentBowler = bowlingPlayers.find((p) => p.user_id === match.bowler_id);

        if (striker && nonStriker) {
          setBatsmen([
            { user: striker, runs: match.striker_runs, balls: match.striker_balls, fours: 0, sixes: 0, isOut: false, isStriker: true },
            { user: nonStriker, runs: match.non_striker_runs, balls: match.non_striker_balls, fours: 0, sixes: 0, isOut: false, isStriker: false }
          ]);
        }
        if (currentBowler) {
          setBowler({ user: currentBowler, balls: match.bowler_legal_balls, runs: match.bowler_runs_given, wickets: match.bowler_wickets, maidens: 0, wides: 0, noBalls: 0 });
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

  const getStriker = useCallback(() => batsmen.find((b) => b.isStriker && !b.isOut), [batsmen]);
  const getNonStriker = useCallback(() => batsmen.find((b) => !b.isStriker && !b.isOut), [batsmen]);

  const handleScore = useCallback(
    async (result: BallResult) => {
      if (result.isWicket && totalWickets >= maxWickets) {
        toast.error("All out! No more wickets available.");
        return;
      }
      const striker = getStriker();
      if (!striker && !result.isWide && !result.isNoBall) {
        toast.error("No striker available!");
        return;
      }

      const isLegal = !result.isWide && !result.isNoBall;
      const totalRunsThisBall = result.runs + (result.isWide ? 1 : result.isNoBall ? 1 : 0);

      setTotalRuns((prev) => prev + totalRunsThisBall);

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
                isOut: !!result.isWicket,
              };
            }
            return b;
          }),
        );
      }

      if (result.isWicket) {
        setTotalWickets((prev) => {
          const nextWickets = prev + 1;
          if (nextWickets >= maxWickets) {
            setTimeout(() => { setInningsEndReason("All Out!"); setShowInningsEndModal(true); }, 800);
          } else {
             // For now just toast, real app would show new batsman modal
             toast.info("Wicket! Select new batsman (Not implemented in this view)");
          }
          return nextWickets;
        });
      }

      if (isLegal) {
        setTotalBalls((prev) => {
          const newTotal = prev + 1;
          if (match?.current_innings_no === 2) {
            const target = (match.previous_innings_score || 0) + 1;
            if (totalRuns + totalRunsThisBall >= target) {
              setTimeout(() => { setInningsEndReason("Target Reached!"); setShowInningsEndModal(true); }, 800);
              return newTotal;
            }
          }
          const maxBalls = (match?.overs || 0) * 6;
          if (newTotal >= maxBalls) {
             setTimeout(() => { setInningsEndReason("Overs Completed!"); setShowInningsEndModal(true); }, 800);
          } else if (newTotal % 6 === 0) {
            setTimeout(() => { toast.info(`Over ${newTotal / 6} complete!`); setOverNumber(prev => prev + 1); rotateStrike(); }, 600);
          }
          return newTotal;
        });
      }

      if (isLegal && result.runs % 2 === 1 && !result.isWicket) {
        rotateStrike();
      }

      setCurrentOver((prev) => {
        const newOver = [...prev, result];
        if (newOver.length > 6 || (isLegal && totalBalls % 6 === 5)) return [];
        return newOver;
      });

      try {
        await scoreBall.mutateAsync({
          matchId: id || "",
          data: {
            runs_off_bat: result.isWide || result.isNoBall ? 0 : result.runs,
            extra_type: result.isWide ? "WIDE" : result.isNoBall ? "NO_BALL" : undefined,
            extra_runs: result.isWide || result.isNoBall ? result.runs + 1 : 0,
            is_wicket: !!result.isWicket,
          },
        });
      } catch (error) {
        toast.error("Failed to record ball event");
      }
    },
    [id, match, totalBalls, totalWickets, maxWickets, bowler, getStriker, rotateStrike, scoreBall, totalRuns],
  );

  const handleDot = () => handleScore({ runs: 0, isDot: true });
  const handleRun = (runs: number) => handleScore({ runs, isBoundary: runs === 4, isSix: runs === 6 });
  const handleWide = () => handleScore({ runs: 0, isWide: true });
  const handleNoBall = () => handleScore({ runs: 0, isNoBall: true });
  const handleWicket = () => setShowWicketModal(true);

  const handleWicketType = (type: string) => {
    handleScore(pendingWicket || { runs: 0, isWicket: true });
    setShowWicketModal(false);
    setPendingWicket(null);
    toast.success(`${type} wicket recorded`);
  };

  const handleUndo = () => toast.error("Undo not supported in this version");
  const handleSwapStrike = () => { rotateStrike(); setShowSwapModal(false); toast.info("Strike swapped!"); };

  const handleFinishInnings = async () => {
    try {
      await finishInnings.mutateAsync(id || "");
      if (match?.current_innings_no === 2) {
        toast.success("Match Completed!");
        navigate("/dashboard");
      } else {
        toast.success("Innings Completed!");
        setIsMatchStarted(false); 
        setShowInningsEndModal(false);
      }
    } catch (error) {
      toast.error("Failed to finish innings");
    }
  };

  const handleStartMatch = () => {
    if (!match) return;
    const isSecondInnings = match.current_innings_no === 2 || (match.innings?.length === 1 && match.innings[0]?.is_completed);
    const battingTeamId = isSecondInnings ? (match.team_a_id === match.batting_team_id ? match.team_b_id : match.team_a_id) : match.batting_team_id;
    const battingTeamPlayers = (match.team_a_id === battingTeamId ? match.team_a?.players : match.team_b?.players) || [];
    const bowlingTeamPlayers = (match.team_a_id === battingTeamId ? match.team_b?.players : match.team_a?.players) || [];
    const battingPlayers = (battingTeamPlayers.map((p: any) => p.user).filter(Boolean) as User[]) || [];
    const bowlingPlayers = (bowlingTeamPlayers.map((p: any) => p.user).filter(Boolean) as User[]) || [];

    const strikerId = navState?.strikerId || battingPlayers[0]?.user_id;
    const nonStrikerId = navState?.nonStrikerId || battingPlayers[1]?.user_id;
    const bowlerId = navState?.openingBowlerId || bowlingPlayers[0]?.user_id;

    if (isSecondInnings) {
       startNextInnings.mutateAsync({ matchId: id || "", data: { striker_id: strikerId || "", non_striker_id: nonStrikerId || "", bowler_id: bowlerId || "" } })
        .then(() => { setIsMatchStarted(true); toast.success("Second innings started!"); });
    } else {
       setIsMatchStarted(true);
       toast.success("Match started!");
    }
  };

  if (isLoading) return <div className="min-h-screen bg-background"><Skeleton className="h-32" /><div className="p-4 space-y-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-64" /></div></div>;
  if (!match) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Match not found</p></div>;

  const striker = getStriker();
  const nonStriker = getNonStriker();
  const currentLiveState: LiveMatchState = { match_id: id || "", total_runs: totalRuns, total_wickets: totalWickets, legal_balls: totalBalls, updated_at: new Date().toISOString() };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ScoreHeader match={match} liveState={currentLiveState} />
      {!isMatchStarted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-2xl bg-background p-6 text-center shadow-2xl border border-cricket-silver/30">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cricket-red/20 mx-auto"><Play className="h-8 w-8 text-cricket-red" /></div>
            <h2 className="text-xl font-bold mb-2">Ready to Score?</h2>
            <p className="text-sm text-muted-foreground mb-8">{match.team_a_name} vs {match.team_b_name}</p>
            <Button size="lg" className="w-full gap-2 bg-cricket-red hover:bg-cricket-redDark" onClick={handleStartMatch}><Play className="h-5 w-5" />Start Scoring</Button>
          </motion.div>
        </motion.div>
      )}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {batsmen.filter((b) => !b.isOut).map((batsman) => (
                <motion.div key={batsman.user.user_id} layout className={`rounded-xl border-2 p-3 ${batsman.isStriker ? "border-cricket-red bg-cricket-red/5" : "border-border bg-card"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${batsman.isStriker ? "bg-cricket-red/20 text-cricket-red" : "bg-muted text-muted-foreground"}`}>{batsman.user.full_name.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{formatPlayerName(batsman.user.full_name)}</p><p className="text-xs text-cricket-red">{batsman.isStriker ? "* Striker" : "Non-striker"}</p></div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1"><motion.span key={batsman.runs} initial={{ scale: 1.3, color: "#DC2626" }} animate={{ scale: 1, color: "inherit" }} className="text-2xl font-bold">{batsman.runs}</motion.span><span className="text-xs text-muted-foreground">({batsman.balls})</span></div>
                </motion.div>
            ))}
          </div>
          {bowler && (
            <motion.div layout className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-cricket-silverDark/30 flex items-center justify-center text-xs font-bold text-cricket-silverDark">{bowler.user.full_name.charAt(0).toUpperCase()}</div>
                  <div><p className="text-sm font-semibold">{formatPlayerName(bowler.user.full_name)}</p><p className="text-xs text-muted-foreground">Current Bowler</p></div>
                </div>
                <div className="text-right"><p className="text-lg font-bold">{bowler.wickets}/{bowler.runs}</p></div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>O: {formatOvers(bowler.balls)}</span><span>Econ: {bowler.balls > 0 ? ((bowler.runs / bowler.balls) * 6).toFixed(2) : "0.00"}</span></div>
            </motion.div>
          )}
          <div className="rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-muted-foreground">Current Over ({overNumber})</span><span className="text-xs text-muted-foreground">{formatOvers(totalBalls)} total</span></div>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => {
                const ball = currentOver[i];
                const isCurrent = i === totalBalls % 6;
                return (
                  <motion.div key={i} initial={isCurrent ? { scale: 0 } : false} animate={{ scale: 1 }} className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${ball?.isWicket ? "bg-cricket-red/20 text-cricket-red" : ball?.isSix ? "bg-purple-500/20 text-purple-500" : ball?.isBoundary ? "bg-cricket-red/10 text-cricket-red" : ball?.isWide || ball?.isNoBall ? "bg-yellow-500/20 text-yellow-600" : ball?.isDot ? "bg-muted text-muted-foreground" : ball ? "bg-cricket-silver/20 text-foreground" : "bg-muted/50 text-muted-foreground"} ${isCurrent && !ball ? "ring-2 ring-cricket-red ring-offset-1" : ""}`}>
                    {ball?.isWicket ? "W" : ball?.isWide ? `${ball.runs + 1}wd` : ball?.isNoBall ? `${ball.runs + 1}nb` : ball?.isDot ? "0" : ball?.runs}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="sticky bottom-[56px] md:bottom-0 z-40 border-t bg-background/95 backdrop-blur-lg safe-bottom">
        <div className="mx-auto max-w-3xl px-3 py-3">
          <div className="grid grid-cols-5 gap-2 mb-2">
            <ScoringButton label="0" sublabel="Dot" onClick={handleDot} variant="dot" />
            <ScoringButton label="1" onClick={() => handleRun(1)} variant="default" />
            <ScoringButton label="2" onClick={() => handleRun(2)} variant="default" />
            <ScoringButton label="3" onClick={() => handleRun(3)} variant="default" />
            <ScoringButton label="4" onClick={() => handleRun(4)} variant="boundary" />
          </div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <ScoringButton label="6" onClick={() => handleRun(6)} variant="six" />
            <ScoringButton label="W" sublabel="Wicket" onClick={handleWicket} variant="wicket" />
            <ScoringButton label="WD" sublabel="Wide" onClick={handleWide} variant="extra" />
            <ScoringButton label="NB" sublabel="No Ball" onClick={handleNoBall} variant="extra" />
          </div>
          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={handleUndo} disabled={!canUndo} className="gap-1 h-8"><Undo2 className="h-3.5 w-3.5" /> Undo</Button>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setShowSwapModal(true)} className="gap-1 h-8"><ArrowRightLeft className="h-3.5 w-3.5" /> Swap</Button>
              <Button variant="ghost" size="sm" onClick={() => { toast.info("New player selection not implemented"); }} className="gap-1 h-8"><UserPlus className="h-3.5 w-3.5" /> New</Button>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showWicketModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setShowWicketModal(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">How Out?</h3>
              <div className="grid grid-cols-2 gap-2">{["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket"].map((type) => (<Button key={type} variant="outline" onClick={() => handleWicketType(type)}>{type}</Button>))}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSwapModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowSwapModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl text-center">
              <h3 className="text-lg font-semibold mb-2">Swap Strike?</h3>
              <p className="text-sm text-muted-foreground mb-4">{formatPlayerName(striker?.user.full_name)} ↔ {formatPlayerName(nonStriker?.user.full_name)}</p>
              <div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setShowSwapModal(false)}>Cancel</Button><Button className="flex-1 bg-cricket-red hover:bg-cricket-redDark" onClick={handleSwapStrike}>Swap</Button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showInningsEndModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-background p-8 text-center shadow-2xl">
              <h2 className="text-2xl font-black mb-4 uppercase">{inningsEndReason}</h2>
              <p className="mb-6">The innings has ended.</p>
              <Button size="lg" className="w-full bg-cricket-red" onClick={handleFinishInnings} isLoading={finishInnings.isPending}>{match.current_innings_no === 1 ? "Start Next Innings" : "Finish Match"}</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
