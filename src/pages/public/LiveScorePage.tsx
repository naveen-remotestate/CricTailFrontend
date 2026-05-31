import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMatch, useLiveState, useScorecard } from "@/hooks/useMatches";
import { ScoreHeader } from "@/components/cricket/ScoreHeader";
import { BatsmanDisplay } from "@/components/cricket/BatsmanDisplay";
import { BowlerDisplay } from "@/components/cricket/BowlerDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowLeft, Activity, Play, Trophy, X, FileText, Share2, History } from "lucide-react";
import type { User, BallEvent, InningsScorecard } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { formatOvers, calculateRunRate, formatPlayerName, formatTeamName, cn } from "@/lib/utils";

export default function LiveScorePage() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading: matchLoading } = useMatch(id || "");
  const { data: liveState, isLoading: liveLoading } = useLiveState(id || "");
  const { data: scorecard, isLoading: scorecardLoading } = useScorecard(id || "");
  const { user } = useAuthStore();
  const [showScorecard, setShowScorecard] = useState(false);

  const handleShareMatch = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied! Share it with your friends.");
    }).catch(() => {
      toast.error("Failed to copy link.");
    });
  };

  if (matchLoading || liveLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-32" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!match || !liveState) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <p className="text-muted-foreground font-bold uppercase tracking-widest">Match not found or not live</p>
      </div>
    );
  }

  const isHost = match.hosted_by === user?.user_id;
  const isSecondInnings = match.current_innings_no === 2;
  const target = isSecondInnings ? (match.previous_innings_score || 0) + 1 : undefined;
  const ballsRemaining = (match.overs * 6) - (match.legal_balls || 0);

  const activeOverNo = Math.floor((match?.legal_balls || 0) / 6);
  const currentInnings = match?.innings?.find(i => i.innings_no === match.current_innings_no);
  const ballEvents = currentInnings?.ball_events || [];
  const ballsInCurrentOver = ballEvents.filter(b => b.over_no === activeOverNo).sort((a, b) => a.ball_sequence - b.ball_sequence);

  const striker: User = {
    user_id: match.striker_id || "",
    full_name: formatPlayerName(match.striker_name) || "Striker",
    mobile_number: "", is_active: true, created_at: "", updated_at: ""
  };

  const nonStriker: User = {
    user_id: match.non_striker_id || "",
    full_name: formatPlayerName(match.non_striker_name) || "Non-Striker",
    mobile_number: "", is_active: true, created_at: "", updated_at: ""
  };

  const bowler: User = {
    user_id: match.bowler_id || "",
    full_name: formatPlayerName(match.bowler_name) || "Bowler",
    mobile_number: "", is_active: true, created_at: "", updated_at: ""
  };

  const renderInningsContent = (inn: InningsScorecard | undefined, inningsNo: number) => {
    if (!inn) return (
      <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed">
        <p className="text-muted-foreground">Innings {inningsNo} not started yet.</p>
      </div>
    );

    const battingTeamName = match.team_a_id === inn.batting_team_id ? match.team_a_name : match.team_b_name;
    const bowlingTeamName = match.team_a_id === inn.bowling_team_id ? match.team_a_name : match.team_b_name;

    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="flex flex-col bg-card dark:bg-muted/30 rounded-xl border border-border p-4 gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider">{battingTeamName}</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Innings {inningsNo} Summary</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">{inn.total_runs}/{inn.total_wickets}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">
                {formatOvers(inn.legal_balls)} OVS | CRR {calculateRunRate(inn.total_runs, inn.legal_balls)}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-border/30 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Team Extras</span>
            <span className="text-[10px] font-black uppercase">{inn.extras}</span>
          </div>
        </div>

        {/* Batting Table */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary px-1">BATTING - {formatTeamName(battingTeamName)}</h4>
          <div className="overflow-x-auto bg-card dark:bg-primary/5 rounded-xl p-3 border shadow-sm border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10 text-left text-[10px] font-black uppercase tracking-widest text-primary/60">
                  <th className="pb-2">Batter</th>
                  <th className="pb-2 text-right">R</th>
                  <th className="pb-2 text-right">B</th>
                  <th className="pb-2 text-right">4s</th>
                  <th className="pb-2 text-right">6s</th>
                  <th className="pb-2 text-right">SR</th>
                </tr>
              </thead>
              <tbody>
                {inn.batting?.map((card) => (
                  <tr key={card.user_id} className="border-b border-primary/10 last:border-0">
                    <td className="py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{formatPlayerName(card.player_name)}</span>
                        <span className="text-[10px] text-muted-foreground italic">
                          {card.is_out ? (card.dismissal_type || "Out") : "not out"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-black">{card.runs}</td>
                    <td className="py-3 text-right text-muted-foreground">{card.balls_faced}</td>
                    <td className="py-3 text-right text-muted-foreground">{card.fours}</td>
                    <td className="py-3 text-right text-muted-foreground">{card.sixes}</td>
                    <td className="py-3 text-right font-bold text-primary">
                      {card.balls_faced > 0 ? ((card.runs / card.balls_faced) * 100).toFixed(1) : "0.0"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bowling Table */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 px-1">BOWLING - {formatTeamName(bowlingTeamName)}</h4>
          <div className="overflow-x-auto bg-card dark:bg-blue-600/5 rounded-xl p-3 border shadow-sm border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-600/10 text-left text-[10px] font-black uppercase tracking-widest text-blue-600/60">
                  <th className="pb-2">Bowler</th>
                  <th className="pb-2 text-right">O</th>
                  <th className="pb-2 text-right">M</th>
                  <th className="pb-2 text-right">R</th>
                  <th className="pb-2 text-right">W</th>
                  <th className="pb-2 text-right">Econ</th>
                </tr>
              </thead>
              <tbody>
                {inn.bowling?.map((card) => (
                  <tr key={card.user_id} className="border-b border-blue-600/10 last:border-0">
                    <td className="py-3">
                      <span className="font-bold text-foreground">{formatPlayerName(card.player_name)}</span>
                    </td>
                    <td className="py-3 text-right font-black">{formatOvers(card.legal_balls)}</td>
                    <td className="py-3 text-right font-black">0</td> {/* Maidens not in API response yet */}
                    <td className="py-3 text-right font-black">{card.runs_conceded}</td>
                    <td className="py-3 text-right font-black text-blue-600">{card.wickets}</td>
                    <td className="py-3 text-right font-bold">
                      {calculateRunRate(card.runs_conceded, card.legal_balls)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handleShareMatch} title="Share Match">
                <Share2 className="h-3.5 w-3.5" />
              </Button>
              <div className="h-4 w-[1px] bg-border mx-1" />
              <div className="live-indicator relative h-2.5 w-2.5 rounded-full bg-red-500" />
              <Badge variant="live" className="text-xs">LIVE</Badge>
            </div>
          </div>
        </div>
      </div>

      <ScoreHeader match={match} liveState={{ match_id: match.match_id, total_runs: match.current_total_runs, total_wickets: match.current_total_wickets, legal_balls: match.legal_balls, updated_at: new Date().toISOString() }} />

      <div className="mx-auto max-w-3xl px-4 py-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center gap-2">
          {isHost && !match.is_completed && (
            <Button size="sm" className="rounded-full bg-cricket-red hover:bg-cricket-redDark px-6 font-bold shadow-lg shadow-primary/20" asChild>
              <Link to={`/matches/${match.match_id}/score`}>
                <Play className="h-3.5 w-3.5 mr-2 fill-current" /> START SCORING
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-9 rounded-full text-[10px] font-black uppercase tracking-widest gap-2 px-6 bg-card" onClick={() => setShowScorecard(true)}>
            <FileText className="h-4 w-4" /> Full Scorecard
          </Button>
        </motion.div>

        {isSecondInnings && target && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-3 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm">
            <p className="text-sm font-medium">Need <span className="font-black text-primary">{target - match.current_total_runs}</span> runs from <span className="font-black">{Math.floor(ballsRemaining / 6)}.{ballsRemaining % 6}</span> overs</p>
          </motion.div>
        )}

        <BatsmanDisplay striker={striker} nonStriker={nonStriker} strikerRuns={match.striker_runs} strikerBalls={match.striker_balls} nonStrikerRuns={match.non_striker_runs} nonStrikerBalls={match.non_striker_balls} />

        <BowlerDisplay bowler={bowler} overs={match.bowler_legal_balls} runs={match.bowler_runs_given} wickets={match.bowler_wickets} />

        {/* Current Over Progress */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Balls</span>
                </div>
                <span className="text-[10px] font-black uppercase text-primary">Over {activeOverNo + 1}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 items-center">
                {(() => {
                  const legalBallsBowled = ballsInCurrentOver.filter(b => b.is_legal_delivery).length;
                  const remainingLegalNeeded = Math.max(0, 6 - legalBallsBowled);
                  
                  const totalItems = [
                    ...ballsInCurrentOver.map(b => ({ type: 'ball' as const, data: b })),
                    ...Array(remainingLegalNeeded).fill(null).map((_, i) => ({ type: 'placeholder' as const, index: i }))
                  ];

                  return totalItems.map((item, idx) => {
                    if (item.type === 'ball') {
                      const ball = item.data!;
                      let displayText = "";
                      let colorClass = "border-muted bg-muted/20 text-muted-foreground";
                      
                      if (ball.is_wicket) {
                        displayText = "W";
                        if (ball.extra_type === "WIDE") displayText = `W+${ball.total_runs}wd`;
                        else if (ball.extra_type === "NO_BALL") displayText = `W+${ball.total_runs}nb`;
                        colorClass = "border-red-500 bg-red-500/10 text-red-600";
                      } else if (ball.extra_type === "WIDE") {
                        displayText = `${ball.total_runs}wd`;
                        colorClass = "border-yellow-600 bg-yellow-500/10 text-yellow-700";
                      } else if (ball.extra_type === "NO_BALL") {
                        displayText = `${ball.total_runs}nb`;
                        colorClass = "border-yellow-600 bg-yellow-500/10 text-yellow-700";
                      } else if (ball.extra_type === "BYE") {
                        displayText = `${ball.total_runs}b`;
                        colorClass = "border-blue-400 bg-blue-400/10 text-blue-600";
                      } else if (ball.extra_type === "LEG_BYE") {
                        displayText = `${ball.total_runs}lb`;
                        colorClass = "border-blue-400 bg-blue-400/10 text-blue-600";
                      } else {
                        displayText = ball.runs_off_bat.toString();
                        if (ball.runs_off_bat === 4) colorClass = "border-primary bg-primary/10 text-primary";
                        else if (ball.runs_off_bat === 6) colorClass = "border-purple-600 bg-purple-500/10 text-purple-600";
                      }

                      return (
                        <div key={`ball-${idx}`} className={cn(
                          "h-10 w-10 rounded-full border-2 flex items-center justify-center font-black text-xs transition-all",
                          colorClass
                        )}>{displayText}</div>
                      );
                    } else {
                      const isNext = idx === ballsInCurrentOver.length && legalBallsBowled < 6;
                      return (
                        <div key={`placeholder-${idx}`} className={cn(
                          "h-10 w-10 rounded-full border-2 border-dashed flex items-center justify-center font-black text-xs transition-all",
                          isNext ? "border-primary bg-primary/5 text-primary scale-110 shadow-md animate-pulse" : "border-muted text-muted-foreground/20"
                        )}>•</div>
                      );
                    }
                  });
                })()}
            </div>
          </CardContent>
        </Card>

        {/* Commentary Section */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Ball-by-Ball</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
               {ballEvents.length === 0 ? (
                 <p className="text-xs text-muted-foreground italic text-center py-4">Live ball events appearing here...</p>
               ) : (
                 ballEvents.slice().reverse().map((ball, i) => (
                   <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2 text-sm border-b border-border/50 pb-2 last:border-0">
                      <span className="text-[10px] text-muted-foreground font-mono min-w-[2.5rem] mt-0.5">{ball.over_no}.{ball.ball_in_over}</span>
                      <span className="flex-1">
                        {ball.is_wicket ? <span className="text-red-500 font-bold uppercase tracking-widest">Wicket!</span> : 
                         ball.runs_off_bat === 4 ? <span className="text-primary font-bold italic">FOUR!</span> :
                         ball.runs_off_bat === 6 ? <span className="text-purple-500 font-black italic underline">SIX!</span> :
                         `${ball.runs_off_bat} run${ball.runs_off_bat !== 1 ? 's' : ''}`}
                         {ball.extra_type && <span className="ml-2 text-xs font-bold text-yellow-600">({ball.total_runs} {ball.extra_type})</span>}
                      </span>
                   </motion.div>
                 ))
               )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {showScorecard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-background flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b bg-card">
              <h2 className="text-lg font-black uppercase tracking-tighter italic">Match Scorecard</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowScorecard(false)} className="rounded-full"><X className="h-5 w-5" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto pb-10">
              <div className="p-4 space-y-6 max-w-4xl mx-auto w-full">
                {scorecardLoading ? (<div className="space-y-4"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-64 w-full rounded-xl" /></div>) : !scorecard ? (
                  <div className="text-center py-20"><div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 opacity-50"><FileText className="h-8 w-8 text-muted-foreground" /></div><h3 className="font-bold text-lg">No Scorecard Data</h3></div>
                ) : (
                  <Tabs defaultValue={match.current_innings_no.toString()} className="w-full">
                    <div className="flex items-center justify-center mb-6">
                      <TabsList className="bg-muted/50 p-1 rounded-full border">
                        <TabsTrigger value="1" className="rounded-full px-8 font-black uppercase tracking-tighter">Innings 1</TabsTrigger>
                        <TabsTrigger value="2" className="rounded-full px-8 font-black uppercase tracking-tighter">Innings 2</TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="1" className="mt-0 outline-none">
                      {renderInningsContent(scorecard.first_innings, 1)}
                    </TabsContent>
                    <TabsContent value="2" className="mt-0 outline-none">
                      {renderInningsContent(scorecard.second_innings, 2)}
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
