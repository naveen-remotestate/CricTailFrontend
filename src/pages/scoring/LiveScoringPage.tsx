import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useMatch,
  useScoreBall,
  useScorecard,
  useBallEvents,
  useStartNextInnings,
} from "@/hooks/useMatches";
import { useQueryClient } from "@tanstack/react-query";
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
  ChevronLeft,
  History,
  Medal,
  ArrowLeft,
  Share2,
  Activity
} from "lucide-react";
import type { User, LiveMatchState } from "@/types";
import { formatOvers, formatPlayerName, cn, calculateRunRate } from "@/lib/utils";
import { ScoringButton } from "@/components/cricket/ScoringButton";

// Interfaces
interface BallResult {
  runs: number;
  isWicket?: boolean;
  isWide?: boolean;
  isNoBall?: boolean;
  extraType?: "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE";
  wicketType?: string;
  dismissedPlayerId?: string;
  dismissedByFielderId?: string;
}

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
  const queryClient = useQueryClient();
  const creationStore = useMatchCreationStore();
  
  // Data
  const { data: match, isLoading: matchLoading, refetch: refetchMatch } = useMatch(id || "");
  const { data: scorecard, refetch: refetchScorecard } = useScorecard(id || "");
  const { data: apiBallEvents } = useBallEvents(match?.current_inning_id || "");
  const scoreBall = useScoreBall();
  const startNextInnings = useStartNextInnings();

  // State
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
  const [secondInningsStriker, setSecondInningsStriker] = useState<string | null>(null);
  const [secondInningsNonStriker, setSecondInningsNonStriker] = useState<string | null>(null);
  const [secondInningsBowler, setSecondInningsBowler] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState<'striker' | 'nonstriker' | 'bowler' | 'ready'>('striker');
  const [sessionEvents, setSessionEvents] = useState<SessionBallEvent[]>([]);

  // Effects
  useEffect(() => {
    if (apiBallEvents) {
      setSessionEvents(apiBallEvents.map((b: any) => ({
        runs: b.extra_type === "WIDE" || b.extra_type === "BYE" || b.extra_type === "LEG_BYE" ? b.extra_runs : b.runs_off_bat,
        isWicket: b.is_wicket, extraType: b.extra_type, totalRuns: b.total_runs, overNo: b.over_no, ballInOver: b.ball_in_over,
        strikerName: b.striker_name, bowlerName: b.bowler_name, wicketType: b.wicket_type, fielderName: b.dismissed_by_fielder_name
      })));
    } else setSessionEvents([]);
  }, [apiBallEvents]);

  useEffect(() => { setSessionEvents([]); }, [match?.current_inning_id]);

  // Logic placeholders
  const syncData = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ["match", id] });
    queryClient.invalidateQueries({ queryKey: ["scorecard", id] });
    queryClient.invalidateQueries({ queryKey: ["ball-events", match?.current_inning_id] });
    await Promise.all([refetchMatch(), refetchScorecard()]);
  }, [id, match?.current_inning_id, queryClient, refetchMatch, refetchScorecard]);

  const handleShareMatch = () => {
    const url = `${window.location.origin}/matches/${id}/live`;
    navigator.clipboard.writeText(url).then(() => toast.success("Live link copied!")).catch(() => toast.error("Failed to copy link."));
  };

  const isMatchStarted = match ? (!match.is_completed && !!match.current_inning_id) : false;
  const isInningsBreak = match?.current_innings_no === 1 && match?.is_completed;
  const isMatchFinished = !!match?.winner_team_id;

  const getSquad = (teamType: 'batting' | 'bowling') => {
    const is2nd = isInningsBreak;
    if (creationStore.matchId === id) {
      const list = is2nd ? (teamType === 'batting' ? creationStore.getBowlingTeamPlayers() : creationStore.getBattingTeamPlayers()) : (teamType === 'batting' ? creationStore.getBattingTeamPlayers() : creationStore.getBowlingTeamPlayers());
      return list.map(p => p.user);
    }
    const curr = match?.current_innings_no === 1 ? scorecard?.first_innings : scorecard?.second_innings;
    if (curr) {
      let list = teamType === 'batting' ? curr.batting : curr.bowling;
      if (is2nd) list = (teamType === 'batting' ? scorecard?.first_innings?.bowling : scorecard?.first_innings?.batting) || [];
      return list?.map(p => ({ user_id: p.user_id, full_name: p.player_name } as User)) || [];
    }
    return [];
  };

  const allBattingUsers = getSquad('batting');
  const allBowlingUsers = getSquad('bowling');
  const outPlayerIds = scorecard?.first_innings?.batting?.filter(s => s.is_out).map(s => s.user_id) || [];

  const handleScore = useCallback(async (result: BallResult, nextBatId?: string, nextBowlId?: string) => {
    if (!match) return;
    setIsProcessing(true);
    try {
      const isWide = result.extraType === "WIDE";
      const isBye = result.extraType === "BYE";
      const isLegBye = result.extraType === "LEG_BYE";
      const isNoBall = result.extraType === "NO_BALL";

      const payload = {
        match_id: id || "",
        runs_off_bat: (isWide || isBye || isLegBye) ? 0 : result.runs,
        extra_runs: (isWide || isBye || isLegBye) ? result.runs : 0,
        extra_type: result.extraType || null,
        is_wicket: result.isWicket || false,
        wicket_type: result.wicketType || null,
        dismissed_player_id: result.dismissedPlayerId || null,
        dismissed_by_fielder_id: result.dismissedByFielderId || null,
        striker_id: match.striker_id,
        non_striker_id: match.non_striker_id,
        bowler_id: match.bowler_id,
        next_batsman_id: nextBatId || "",
        next_bowler_id: nextBowlId || ""
      };
      await scoreBall.mutateAsync({ matchId: id || "", data: payload });
      if (isNoBall) setIsFreeHit(true); else if (!isWide) setIsFreeHit(false);
      setShowWicketModal(false); setShowNewBatsmanModal(false); setShowNewBowlerModal(false); setShowExtraModal(false); setShowFielderModal(false); setShowRunOutDismissedModal(false); setPendingBall(null); setTempNextBatsmanId(null);
      await syncData();
      toast.success("Ball recorded!");
    } catch (error: any) { toast.error("Failed to record ball"); } finally { setIsProcessing(false); }
  }, [id, match, scoreBall, syncData]);

  const onScoreClick = (result: BallResult) => {
    if (!match) return;
    setPendingBall(result);
    if (result.isWicket) { setShowWicketModal(true); return; }
    const curL = match?.legal_balls || 0;
    const isOE = !result.isWide && !result.isNoBall && (curL + 1) % 6 === 0;
    const isOC = isOE && (Math.floor(curL / 6) + 1) >= (match?.overs || 0);
    const is2nd = match?.current_innings_no === 2;
    const curR = match?.current_total_runs || 0;
    const rTB = (result.isWide || result.extraType === "BYE" || result.extraType === "LEG_BYE") ? result.runs : (result.isNoBall ? (result.runs + 1) : result.runs);
    const isTC = is2nd && (curR + rTB) > (scorecard?.first_innings?.total_runs || 0);
    const willE = isOC || isTC;
    if (isOE && !willE) { setShowNewBowlerModal(true); return; }
    handleScore(result);
  };

  const handleWicketType = (type: string) => {
    if (!pendingBall || !match) return;
    setShowWicketModal(false);
    const updatedBall = { ...pendingBall, isWicket: true, wicketType: type };
    setPendingBall(updatedBall);

    const curL = match.legal_balls || 0;
    const isOE = !updatedBall.isWide && !updatedBall.isNoBall && (curL + 1) % 6 === 0;
    const isAll = outPlayerIds.length + 1 >= (allBattingUsers.length - 1);
    const isOC = isOE && (Math.floor(curL / 6) + 1) >= (match.overs || 0);
    const isTC = (match.current_innings_no === 2) && ((match.current_total_runs || 0) + (updatedBall.runs + (updatedBall.isNoBall || updatedBall.isWide ? 1 : 0))) > (scorecard?.first_innings?.total_runs || 0);
    const willE = isAll || isOC || isTC;

    if (type === "BOWLED" || type === "LBW" || type === "HIT_WICKET") {
      const bwD = { ...updatedBall, dismissedPlayerId: match.striker_id || undefined };
      if (willE) handleScore(bwD, ""); else { setPendingBall(bwD); setShowNewBatsmanModal(true); }
    } else if (type === "CAUGHT" || type === "STUMPED") {
      setPendingBall({ ...updatedBall, dismissedPlayerId: match.striker_id || undefined }); setShowFielderModal(true);
    } else if (type === "RUN_OUT") {
      setShowRunOutDismissedModal(true);
    }
  };

  const handleRunOutDismissed = (pId: string) => {
    if (!pendingBall) return;
    setPendingBall({ ...pendingBall, dismissedPlayerId: pId }); setShowRunOutDismissedModal(false); setShowFielderModal(true);
  };

  const handleFielderSelection = (fId: string) => {
    if (!pendingBall || !match) return;
    const uB = { ...pendingBall, dismissedByFielderId: fId };
    setShowFielderModal(false);
    const isAll = outPlayerIds.length + 1 >= (allBattingUsers.length - 1);
    const isOE = !uB.isWide && !uB.isNoBall && (match.legal_balls + 1) % 6 === 0;
    const isOC = isOE && (Math.floor(match.legal_balls / 6) + 1) >= (match.overs || 0);
    const isTC = (match.current_innings_no === 2) && ((match.current_total_runs || 0) + uB.runs) > (scorecard?.first_innings?.total_runs || 0);
    if (isAll || isOC || isTC) handleScore(uB, ""); else { setPendingBall(uB); setShowNewBatsmanModal(true); }
  };

  const handleRetiredHurt = (pId: string) => {
    if (!match) return;
    const rB: BallResult = { runs: 0, isWicket: true, wicketType: "RETIRED_HURT", dismissedPlayerId: pId };
    setShowRetiredHurtModal(false);
    const isOE = (match.legal_balls + 1) % 6 === 0;
    const isOC = isOE && (Math.floor(match.legal_balls / 6) + 1) >= (match.overs || 0);
    const isTC = (match.current_innings_no === 2) && (match.current_total_runs || 0) > (scorecard?.first_innings?.total_runs || 0);
    const isAll = allBattingUsers.filter(u => u.user_id !== match.striker_id && u.user_id !== match.non_striker_id && !outPlayerIds.includes(u.user_id)).length === 0;
    if (isOC || isTC || isAll) handleScore(rB, "");
    else { setPendingBall(rB); setShowNewBatsmanModal(true); }
  };

  const handleNextBatsmanSelection = (bId: string) => {
    if (!pendingBall || !match) return;
    const isOE = !pendingBall.isWide && !pendingBall.isNoBall && (match.legal_balls + 1) % 6 === 0;
    const isAll = outPlayerIds.length + (pendingBall.isWicket ? 1 : 0) >= (allBattingUsers.length - 1);
    const isOC = isOE && (Math.floor(match.legal_balls / 6) + 1) >= (match.overs || 0);
    const isTC = (match.current_innings_no === 2) && ((match.current_total_runs || 0) + pendingBall.runs) > (scorecard?.first_innings?.total_runs || 0);
    if (isOE && !(isOC || isTC || isAll)) { setTempNextBatsmanId(bId); setShowNewBatsmanModal(false); setShowNewBowlerModal(true); }
    else { setShowNewBatsmanModal(false); handleScore(pendingBall, bId); }
  };

  const handleNextBowlerSelection = (bId: string) => { if (pendingBall) { setShowNewBowlerModal(false); handleScore(pendingBall, tempNextBatsmanId || undefined, bId); } };

  const handleExtraRuns = (runs: number, isWO = false) => {
    if (!pendingExtraType) return;
    onScoreClick({ runs, isWide: pendingExtraType === "WIDE", isNoBall: pendingExtraType === "NO_BALL", extraType: (pendingExtraType === "BYE" || pendingExtraType === "LEG_BYE") ? pendingExtraType : pendingExtraType, isWicket: isWO });
    setShowExtraModal(false); setPendingExtraType(null);
  };

  const handleStartSecondInnings = async () => {
    if (!id || !secondInningsStriker || !secondInningsNonStriker || !secondInningsBowler) { toast.error("Select players"); return; }
    setIsProcessing(true);
    try {
      await startNextInnings.mutateAsync({ matchId: id, data: { match_id: id, striker_id: secondInningsStriker, non_striker_id: secondInningsNonStriker, bowler_id: secondInningsBowler }});
      toast.success("Started!"); setIsFreeHit(false); setPendingBall(null); setTempNextBatsmanId(null); setSessionEvents([]); await syncData();
    } catch (error: any) { toast.error("Failed"); } finally { setIsProcessing(false); }
  };

  const handleSetupBack = () => { if (setupStep === 'ready') setSetupStep('bowler'); else if (setupStep === 'bowler') setSetupStep('nonstriker'); else if (setupStep === 'nonstriker') setSetupStep('striker'); else navigate(-1); };

  if (matchLoading) return <div>Loading...</div>;
  if (!match) return <div>Not Found</div>;

  const currentLiveState: LiveMatchState = { match_id: match.match_id, total_runs: match.current_total_runs || 0, total_wickets: match.current_total_wickets || 0, legal_balls: match.legal_balls || 0, updated_at: new Date().toISOString() };
  const activeOverNo = Math.floor((match?.legal_balls || 0) / 6);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <div className="flex-none z-40 border-b shadow-md">
        <div className="bg-background/95 backdrop-blur-lg"><div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between"><button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground font-black uppercase italic"><ArrowLeft className="h-4 w-4" /> Back</button><div className="flex items-center gap-2"><Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-primary/20 text-primary" onClick={handleShareMatch}><Share2 className="h-3.5 w-3.5" /></Button><div className="h-4 w-[1px] bg-border mx-1" /><div className="live-indicator relative h-2 w-2 rounded-full bg-red-500" /><span className="text-[10px] font-black uppercase text-red-500 italic">Scoring</span></div></div></div>
        <ScoreHeader match={match} liveState={currentLiveState} firstInningsSummary={scorecard?.first_innings ? { runs: scorecard.first_innings.total_runs, wickets: scorecard.first_innings.total_wickets, legal_balls: scorecard.first_innings.legal_balls } : undefined} />
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-4">
        {isMatchFinished ? (
          <div className="min-h-full flex items-center justify-center p-4"><Card className="w-full max-w-sm rounded-[2.5rem] border shadow-xl bg-card p-8 text-center"><div className="h-16 w-16 rounded-3xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4"><Medal className="h-8 w-8 text-yellow-600" /></div><h2 className="text-xl font-black uppercase tracking-tighter italic">Match Finished</h2><p className="text-sm font-black text-primary mt-2 mb-8 uppercase">{match.winner_team_id === match.team_a_id ? match.team_a_name : match.team_b_name} WON!</p><div className="space-y-3"><Button size="lg" className="w-full rounded-2xl h-14 font-black uppercase shadow-lg shadow-primary/20" asChild><Link to={`/matches/${id}/scorecard`}>View Scorecard</Link></Button><Button variant="outline" size="lg" className="w-full rounded-2xl h-14 font-black uppercase" asChild><Link to="/dashboard">Back to Dashboard</Link></Button></div></Card></div>
        ) : isInningsBreak ? (
          <div className="min-h-full flex flex-col items-center justify-center p-4"><Card className="w-full max-w-sm rounded-[2.5rem] border shadow-xl bg-card overflow-hidden"><div className="bg-primary/10 p-8 text-center border-b border-primary/10 relative"><Button variant="ghost" size="icon" className="absolute top-4 left-4 rounded-full text-primary" onClick={handleSetupBack}><ChevronLeft className="h-5 w-5" /></Button><div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3 mt-4"><History className="h-6 w-6 text-primary" /></div><h2 className="text-xl font-black uppercase tracking-tighter italic">Innings Break</h2><p className="text-[10px] font-black text-primary mt-1 uppercase">Target: {(scorecard?.first_innings?.total_runs || 0) + 1}</p></div><div className="p-8 space-y-6">
            {setupStep === 'striker' && <div className="space-y-4"><p className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Select Striker</p><div className="grid gap-2 max-h-48 overflow-y-auto pr-1">{allBattingUsers.map(u => <Button key={u.user_id} variant="outline" className="h-12 rounded-xl font-bold justify-start px-4" onClick={() => { setSecondInningsStriker(u.user_id); setSetupStep('nonstriker'); }}>{u.full_name}</Button>)}</div></div>}
            {setupStep === 'nonstriker' && <div className="space-y-4"><p className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Select Non-Striker</p><div className="grid gap-2 max-h-48 overflow-y-auto pr-1">{allBattingUsers.filter(u => u.user_id !== secondInningsStriker).map(u => <Button key={u.user_id} variant="outline" className="h-12 rounded-xl font-bold justify-start px-4" onClick={() => { setSecondInningsNonStriker(u.user_id); setSetupStep('bowler'); }}>{u.full_name}</Button>)}</div></div>}
            {setupStep === 'bowler' && <div className="space-y-4"><p className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Select Bowler</p><div className="grid gap-2 max-h-48 overflow-y-auto pr-1">{allBowlingUsers.map(u => <Button key={u.user_id} variant="outline" className="h-12 rounded-xl font-bold justify-start px-4" onClick={() => { setSecondInningsBowler(u.user_id); setSetupStep('ready'); }}>{u.full_name}</Button>)}</div></div>}
            {setupStep === 'ready' && <div className="space-y-6"><div className="space-y-2"><div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground px-1"><span>Openers</span><Button variant="ghost" size="sm" onClick={() => setSetupStep('striker')} className="h-4 p-0 text-[8px] font-black uppercase text-primary">Edit</Button></div><div className="bg-muted/30 rounded-2xl p-4 space-y-2 border border-border"><div className="flex justify-between items-center"><span className="text-xs font-black italic">Striker</span><span className="text-xs font-bold">{allBattingUsers.find(u => u.user_id === secondInningsStriker)?.full_name}</span></div><div className="flex justify-between items-center"><span className="text-xs font-black italic">Non-Striker</span><span className="text-xs font-bold">{allBattingUsers.find(u => u.user_id === secondInningsNonStriker)?.full_name}</span></div><div className="pt-2 mt-2 border-t border-border flex justify-between items-center"><span className="text-xs font-black italic">Bowler</span><span className="text-xs font-bold">{allBowlingUsers.find(u => u.user_id === secondInningsBowler)?.full_name}</span></div></div></div><Button size="lg" className="w-full rounded-2xl h-14 font-black uppercase shadow-lg shadow-primary/20" onClick={handleStartSecondInnings} disabled={isProcessing}>{isProcessing ? "Starting..." : "Start Second Innings"}<ChevronRight className="h-4 w-4" /></Button></div>}
          </div></Card></div>
        ) : !isMatchStarted ? (
          <div className="min-h-full flex items-center justify-center p-4"><Card className="w-full max-w-sm rounded-[2.5rem] border shadow-xl bg-card p-8 text-center"><div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><Play className="h-8 w-8 text-primary fill-current" /></div><h2 className="text-xl font-black uppercase tracking-tighter italic">Ready to Score</h2><p className="text-sm text-muted-foreground mt-2 mb-8">Click Configure to set openers if needed.</p><Button size="lg" className="w-full rounded-2xl h-14 font-black uppercase shadow-lg shadow-primary/20" asChild><Link to="/dashboard">Back to Dashboard</Link></Button></Card></div>
        ) : (
          <div className="mx-auto w-full max-w-3xl px-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[ { id: match.striker_id, name: match.striker_name, runs: match.striker_runs, balls: match.striker_balls, isStriker: true }, { id: match.non_striker_id, name: match.non_striker_name, runs: match.non_striker_runs, balls: match.non_striker_balls, isStriker: false } ].map((b) => (
                <Card key={b.id || (b.isStriker ? 'striker' : 'non-striker')} className={cn("rounded-3xl border-2 transition-all", b.isStriker ? "border-primary bg-card shadow-lg" : "border-border bg-card/50")}>
                  <CardContent className="p-4"><div className="flex items-center gap-3"><div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm", b.isStriker ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{b.name?.charAt(0).toUpperCase() || "?"}</div><div className="min-w-0 flex-1"><p className="text-sm font-black truncate">{formatPlayerName(b.name) || "Waiting..."}</p><p className={cn("text-[8px] font-black uppercase tracking-widest", b.isStriker ? "text-primary" : "text-muted-foreground")}>{b.isStriker ? "Striker *" : "Non-Striker"}</p></div></div><div className="mt-4 flex items-baseline gap-1"><motion.span key={b.runs} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-3xl font-black">{b.runs || 0}</motion.span><span className="text-xs font-bold text-muted-foreground/60 uppercase">R ({b.balls || 0})</span></div></CardContent>
                </Card>
              ))}
            </div>
            <Card className="rounded-[2rem] border border-border bg-card shadow-sm overflow-hidden"><CardContent className="p-5 flex items-center justify-between"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-2xl bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center text-blue-600 font-black text-lg">{match.bowler_name?.charAt(0).toUpperCase() || "?"}</div><div><p className="text-sm font-black uppercase tracking-tight">{formatPlayerName(match.bowler_name) || "Waiting..."}</p><p className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">Active Bowler</p></div></div><div className="text-right"><p className="text-2xl font-black text-blue-600 leading-none">{match.bowler_wickets || 0}/{match.bowler_runs_given || 0}</p><p className="text-[10px] font-black text-muted-foreground mt-2 uppercase tracking-tighter">{formatOvers(match.bowler_legal_balls || 0)} OVS | Econ {calculateRunRate(match.bowler_runs_given || 0, match.bowler_legal_balls || 0)}</p></div></CardContent></Card>
            <div className="bg-card rounded-[2rem] p-5 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4 px-1"><div className="flex items-center gap-2"><History className="h-4 w-4 text-muted-foreground/40" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Balls</span>{isFreeHit && <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[8px] font-black uppercase tracking-[0.2em] animate-pulse">Free Hit</motion.span>}</div><span className="text-[10px] font-black uppercase text-primary">Over {activeOverNo + 1}</span></div>
              <div className="flex flex-nowrap justify-center gap-1 sm:gap-1.5 items-center w-full overflow-hidden py-2 px-1">
                {(() => {
                  const ballsInThisOver = sessionEvents.filter(b => b.overNo === (activeOverNo + 1));
                  const legalBallsInThisOver = ballsInThisOver.filter(b => !b.extraType || (b.extraType !== 'WIDE' && b.extraType !== 'NO_BALL')).length;
                  const placeholders = Math.max(0, 6 - legalBallsInThisOver);
                  const totalItems = [...ballsInThisOver.map(b => ({ type: 'ball' as const, data: b })), ...Array(placeholders).fill(null).map((_, i) => ({ type: 'placeholder' as const, index: i }))];
                  const ballCount = totalItems.length;
                  const sizeClass = ballCount > 10 ? "h-8 w-8 text-[7px]" : ballCount > 8 ? "h-9 w-9 text-[8px]" : "h-11 w-11 text-[10px]";
                  return totalItems.map((item, idx) => {
                    if (item.type === 'ball') {
                      const ball = item.data!; let d = ""; let c = "border-muted bg-muted/20 text-muted-foreground";
                      if (ball.isWicket) { 
                        d = "W"; 
                        if (ball.extraType === "WIDE") d = ball.runs > 0 ? `W+${ball.runs}wd` : "W+wd"; 
                        else if (ball.extraType === "NO_BALL") d = ball.runs > 0 ? `W+${ball.runs}nb` : "W+nb";
                        c = "border-red-500 bg-red-500/10 text-red-600"; 
                      } else if (ball.extraType === "WIDE") { 
                        d = ball.runs > 0 ? `wd+${ball.runs}` : "wd"; 
                        c = "border-yellow-600 bg-yellow-500/10 text-yellow-700"; 
                      } else if (ball.extraType === "NO_BALL") { 
                        d = ball.runs > 0 ? `nb+${ball.runs}` : "nb"; 
                        c = "border-yellow-600 bg-yellow-500/10 text-yellow-700"; 
                      } else if (ball.extraType === "BYE" || ball.extraType === "LEG_BYE") { 
                        d = `${ball.runs}${ball.extraType === "BYE" ? 'b' : 'lb'}`; 
                        c = "border-blue-400 bg-blue-400/10 text-blue-600"; 
                      } else { 
                        d = ball.runs.toString(); 
                        if (ball.runs === 4) c = "border-primary bg-primary/10 text-primary"; 
                        else if (ball.runs === 6) c = "border-purple-600 bg-purple-500/10 text-purple-600"; 
                      }
                      return <div key={`over-ball-${idx}-${ball.ballInOver}`} className={cn("rounded-full flex items-center justify-center font-black transition-all shadow-sm shrink-0 border-2", sizeClass, c)}>{d}</div>;
                    }
                    const isNext = idx === ballsInThisOver.length && legalBallsInThisOver < 6;
                    return <div key={`over-placeholder-${idx}`} className={cn("rounded-full border-dashed border-2 flex items-center justify-center font-black transition-all shrink-0", sizeClass, isNext ? "border-primary bg-primary/5 text-primary scale-110 animate-pulse" : "border-muted text-muted-foreground/20")}>•</div>;
                  });
                })()}
              </div>
            </div>
            <div className="bg-card rounded-[2rem] p-5 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-4 px-1"><History className="h-4 w-4 text-primary" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Match Feed</span></div>
              <div className="space-y-0 max-h-60 overflow-y-auto scrollbar-hide px-1">
                {sessionEvents.length === 0 ? <p className="text-[10px] text-muted-foreground italic text-center py-4 uppercase font-bold tracking-widest">No deliveries yet...</p> : (
                  (() => {
                    const reversedEvents = [...sessionEvents].reverse();
                    return reversedEvents.slice(0, 15).map((ball, i) => {
                      const isOverEnd = i < reversedEvents.length - 1 && ball.overNo !== reversedEvents[i+1].overNo;
                      return (
                        <div key={`${ball.overNo}-${ball.ballInOver}-${i}`}>
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 py-3 border-b border-border/30 last:border-0 transition-colors">
                            <div className="h-10 w-10 rounded-full border border-border bg-muted/10 flex items-center justify-center shrink-0"><span className="text-[10px] font-black text-muted-foreground italic leading-none">{ball.overNo}.{ball.ballInOver}</span></div>
                            <div className="flex-1 min-w-0"><div className="flex flex-col"><div className="flex items-center justify-between mb-0.5"><p className="text-sm font-bold truncate">{formatPlayerName(ball.bowlerName)} to {formatPlayerName(ball.strikerName)}</p><div className={cn("px-2 py-0.5 rounded-full border font-black text-[9px] uppercase tracking-widest shadow-sm", ball.isWicket ? "border-red-500 bg-red-500/10 text-red-600" : ball.extraType === "WIDE" || ball.extraType === "NO_BALL" ? "border-yellow-600 bg-yellow-500/10 text-yellow-700" : ball.runs === 4 ? "border-primary bg-primary/10 text-primary" : ball.runs === 6 ? "border-purple-600 bg-purple-500/10 text-purple-600" : ball.extraType === "BYE" || ball.extraType === "LEG_BYE" ? "border-blue-400 bg-blue-400/10 text-blue-600" : "border-muted bg-muted/20 text-muted-foreground")}>{ball.isWicket ? "W" : ball.runs}</div></div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">{ball.wicketType || (ball.extraType ? ball.extraType : "Legal Delivery")}</p></div></div>
                          </motion.div>
                          {isOverEnd && <div className="py-3 flex items-center gap-2"><div className="h-[1px] flex-1 bg-border/40" /><span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 px-4 py-1 rounded-full border border-primary/10 shadow-sm">End of Over {reversedEvents[i+1].overNo}</span><div className="h-[1px] flex-1 bg-border/40" /></div>}
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex-none z-40 border-t bg-background/95 backdrop-blur-lg pb-8 shadow-2xl">
        <div className="mx-auto max-w-3xl px-4 py-4"><div className="grid grid-cols-4 gap-2">
          {[ {l:"0", s:"Dot", v:"dot", r:0}, {l:"1", r:1, v:"default"}, {l:"2", r:2, v:"default"}, {l:"3", r:3, v:"default"}, {l:"4", s:"Four", v:"boundary", r:4}, {l:"6", s:"Sixer", v:"six", r:6}, {l:"W", s:"Wicket", v:"wicket", r:0, w:true} ].map((b, i) => (
            <ScoringButton key={i} label={b.l} sublabel={b.s} onClick={() => onScoreClick({runs: b.r, isWicket: b.w})} variant={b.v as any} disabled={isProcessing} />
          ))}
          <ScoringButton label="NB" sublabel="No Ball" onClick={() => { setPendingExtraType("NO_BALL"); setShowExtraModal(true); }} variant="extra" disabled={isProcessing} />
          <ScoringButton label="WD" sublabel="Wide" onClick={() => { setPendingExtraType("WIDE"); setShowExtraModal(true); }} variant="extra" disabled={isProcessing} />
          <ScoringButton label="BYE" sublabel="Bye" onClick={() => { setPendingExtraType("BYE"); setShowExtraModal(true); }} variant="extra" disabled={isProcessing} />
          <ScoringButton label="LB" sublabel="LegBye" onClick={() => { setPendingExtraType("LEG_BYE"); setShowExtraModal(true); }} variant="extra" disabled={isProcessing} />
          <ScoringButton label="RETIRED" sublabel="Hurt" onClick={() => setShowRetiredHurtModal(true)} variant="retired" disabled={isProcessing} />
        </div></div>
      </div>

      <AnimatePresence>
        {showWicketModal && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="w-full max-w-sm bg-card rounded-[3rem] border shadow-2xl p-8"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black uppercase tracking-tighter italic">Out!</h3><Button variant="ghost" size="icon" onClick={() => setShowWicketModal(false)}><X className="h-6 w-6" /></Button></div><div className="grid grid-cols-2 gap-3">{["BOWLED", "CAUGHT", "LBW", "RUN_OUT", "STUMPED", "HIT_WICKET"].map((t) => <Button key={t} variant="outline" className="h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 transition-all" onClick={() => handleWicketType(t)}>{t.replace("_", " ")}</Button>)}</div></motion.div>
          </div>
        )}
        {showRunOutDismissedModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-card rounded-[3rem] border shadow-2xl p-8"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black uppercase tracking-tighter italic text-red-600">Who was out?</h3><Button variant="ghost" size="icon" onClick={() => { setShowRunOutDismissedModal(false); setPendingBall(null); }}><X className="h-6 w-6" /></Button></div><div className="grid gap-3">{[{ id: match.striker_id, name: match.striker_name, label: "Striker" }, { id: match.non_striker_id, name: match.non_striker_name, label: "Non-Striker" }].map((p) => <Button key={p.id} variant="outline" className="h-20 rounded-[1.5rem] border-2 border-red-500/20 font-black uppercase text-sm flex flex-col items-center justify-center gap-1" onClick={() => handleRunOutDismissed(p.id!)}><span className="text-red-600">{formatPlayerName(p.name)}</span><span className="text-[9px] opacity-40 uppercase">{p.label}</span></Button>)}</div></motion.div>
          </div>
        )}
        {showRetiredHurtModal && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-card rounded-[3rem] border shadow-2xl p-8"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black uppercase tracking-tighter italic text-orange-600">Retired Hurt</h3><Button variant="ghost" size="icon" onClick={() => setShowRetiredHurtModal(false)}><X className="h-6 w-6" /></Button></div><p className="text-[10px] font-black text-muted-foreground uppercase mb-6 tracking-widest text-center opacity-60">Select batsman leaving the field</p><div className="grid gap-3">{[{ id: match.striker_id, name: match.striker_name, label: "Striker" }, { id: match.non_striker_id, name: match.non_striker_name, label: "Non-Striker" }].map((p) => <Button key={p.id} variant="outline" className="h-20 rounded-[1.5rem] border-2 border-orange-500/20 font-black uppercase text-sm flex flex-col items-center justify-center gap-1" onClick={() => handleRetiredHurt(p.id!)}><span className="text-orange-600">{formatPlayerName(p.name)}</span><span className="text-[9px] opacity-40 uppercase">{p.label}</span></Button>)}</div></motion.div>
          </div>
        )}
        {showFielderModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-card rounded-[3rem] border shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"><div className="p-8 border-b bg-muted/20"><div className="flex justify-between items-center"><h3 className="text-2xl font-black uppercase tracking-tighter italic">Fielder Involved</h3><Button variant="ghost" size="icon" onClick={() => { setShowFielderModal(false); setPendingBall(null); }}><X className="h-6 w-6" /></Button></div></div><div className="flex-1 overflow-y-auto p-4 space-y-3">{allBowlingUsers.map(p => <button key={p.user_id} onClick={() => handleFielderSelection(p.user_id)} className="w-full p-5 rounded-[2rem] bg-muted/10 border-2 border-transparent hover:bg-primary/5 flex items-center gap-4 group"><div className="h-10 w-10 rounded-2xl bg-card border flex items-center justify-center font-black text-sm group-hover:bg-primary group-hover:text-white">{p.full_name.charAt(0).toUpperCase()}</div><span className="font-black text-sm uppercase">{formatPlayerName(p.full_name)}</span></button>)}</div></motion.div>
          </div>
        )}
        {showNewBatsmanModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-card rounded-[3rem] border shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"><div className="p-8 border-b bg-muted/20"><div className="flex justify-between items-center"><h3 className="text-2xl font-black uppercase tracking-tighter italic">Next Batsman</h3><Button variant="ghost" size="icon" onClick={() => { setShowNewBatsmanModal(false); setPendingBall(null); }}><X className="h-6 w-6" /></Button></div></div><div className="flex-1 overflow-y-auto p-4 space-y-3">{remainingBatsmen.length === 0 ? <div className="text-center py-10 opacity-40"><Medal className="h-12 w-12 mx-auto mb-2" /><p className="font-black uppercase tracking-widest italic text-lg">Innings Over!</p></div> : remainingBatsmen.map(p => <button key={p.user_id} onClick={() => handleNextBatsmanSelection(p.user_id)} className="w-full p-5 rounded-[2rem] bg-muted/10 border-2 border-transparent hover:bg-primary/5 flex items-center gap-4 group"><div className="h-10 w-10 rounded-2xl bg-card border flex items-center justify-center font-black text-sm group-hover:bg-primary group-hover:text-white">{p.full_name.charAt(0).toUpperCase()}</div><span className="font-black text-sm uppercase">{formatPlayerName(p.full_name)}</span></button>)}</div></motion.div>
          </div>
        )}
        {showNewBowlerModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-card rounded-[3rem] border shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"><div className="p-8 border-b bg-blue-600/5"><div className="flex justify-between items-center"><h3 className="text-2xl font-black uppercase tracking-tighter italic text-blue-600">New Over</h3><Button variant="ghost" size="icon" onClick={() => setShowNewBowlerModal(false)}><X className="h-5 w-5" /></Button></div></div><div className="flex-1 overflow-y-auto p-4 space-y-3">{otherBowlers.length === 0 ? <p className="text-center py-10 text-muted-foreground font-bold italic">No other bowlers available</p> : otherBowlers.map(p => <button key={p.user_id} onClick={() => handleNextBowlerSelection(p.user_id)} className="w-full p-5 rounded-[2rem] bg-muted/10 border-2 border-transparent hover:bg-blue-600/40 flex items-center gap-4 group"><div className="h-10 w-10 rounded-2xl bg-card border flex items-center justify-center font-black text-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white">{p.full_name.charAt(0).toUpperCase()}</div><span className="font-black text-sm uppercase">{formatPlayerName(p.full_name)}</span></button>)}</div></motion.div>
          </div>
        )}
        {showExtraModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-card rounded-[3rem] border shadow-2xl p-8"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black uppercase tracking-tighter italic">{pendingExtraType} RUNS</h3><Button variant="ghost" size="icon" onClick={() => setShowExtraModal(false)}><X className="h-6 w-6" /></Button></div><p className="text-[10px] font-black text-muted-foreground uppercase mb-6 tracking-widest text-center opacity-60 italic">Select runs taken by batsmen</p><div className="grid grid-cols-3 gap-3">{[0, 1, 2, 3, 4, 6].map((r) => <div key={r} className="space-y-2"><Button variant="outline" className="w-full h-16 rounded-2xl font-black text-lg" onClick={() => handleExtraRuns(r)}>{r}</Button>{pendingExtraType === "WIDE" && <Button variant="ghost" className="w-full h-8 rounded-xl text-[8px] font-black uppercase text-red-500 bg-red-500/5" onClick={() => handleExtraRuns(r, true)}>+ Wicket</Button>}</div>)}</div></motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
