import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMatch, useLiveState, useScorecard } from "@/hooks/useMatches";
import { ScoreHeader } from "@/components/cricket/ScoreHeader";
import { BatsmanDisplay } from "@/components/cricket/BatsmanDisplay";
import { BowlerDisplay } from "@/components/cricket/BowlerDisplay";
import { OverProgress } from "@/components/cricket/OverProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowLeft, Activity, Play, Trophy, X, FileText, Share2 } from "lucide-react";
import type { User } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { formatOvers, calculateRunRate, formatPlayerName, formatTeamName } from "@/lib/utils";

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
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!match || !liveState) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Match not found or not live</p>
      </div>
    );
  }

  const isHost = match.hosted_by === user?.user_id;
  
  const isSecondInnings = match.current_innings_no === 2;
  const target = isSecondInnings ? (match.previous_innings_score || 0) + 1 : undefined;
  const ballsRemaining = (match.overs * 6) - (match.legal_balls || 0);

  // Mock ball data for display
  const currentOverBalls = [
    { runs: 1, isBoundary: false },
    { runs: 0, isDot: true },
    { runs: 4, isBoundary: true },
    { runs: 1, isBoundary: false },
    { runs: 6, isSix: true },
    { runs: 0, isDot: true },
  ];

  const striker: User = {
    user_id: match.striker_id || "",
    full_name: formatPlayerName(match.striker_name) || "Striker",
    mobile_number: "",
    is_active: true,
    created_at: "",
    updated_at: ""
  };

  const nonStriker: User = {
    user_id: match.non_striker_id || "",
    full_name: formatPlayerName(match.non_striker_name) || "Non-Striker",
    mobile_number: "",
    is_active: true,
    created_at: "",
    updated_at: ""
  };

  const bowler: User = {
    user_id: match.bowler_id || "",
    full_name: formatPlayerName(match.bowler_name) || "Bowler",
    mobile_number: "",
    is_active: true,
    created_at: "",
    updated_at: ""
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={handleShareMatch}
                title="Share Match"
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
              <div className="h-4 w-[1px] bg-border mx-1" />
              <div className="live-indicator relative h-2.5 w-2.5 rounded-full bg-red-500" />
              <Badge variant="live" className="text-xs">LIVE</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Score Header */}
      <ScoreHeader 
        match={match} 
        liveState={{
            match_id: match.match_id,
            total_runs: match.current_total_runs,
            total_wickets: match.current_total_wickets,
            legal_balls: match.legal_balls,
            updated_at: new Date().toISOString()
        }} 
      />

      <div className="mx-auto max-w-3xl px-4 py-4 space-y-4">
        {/* Action Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center gap-2"
        >
          {isHost && !match.is_completed && (
            <Button size="sm" className="rounded-full bg-cricket-red hover:bg-cricket-redDark px-6 font-bold shadow-lg shadow-primary/20" asChild>
              <Link to={`/matches/${match.match_id}/score`}>
                <Play className="h-3.5 w-3.5 mr-2 fill-current" />
                START SCORING
              </Link>
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 rounded-full text-[10px] font-black uppercase tracking-widest gap-2 px-6"
            onClick={() => setShowScorecard(true)}
          >
            <FileText className="h-4 w-4" />
            Full Scorecard
          </Button>
        </motion.div>

        {/* Chasing Info (2nd Innings Only) */}
        {isSecondInnings && target && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-3 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm"
          >
            <p className="text-sm font-medium">
              Need <span className="font-black text-primary">{target - match.current_total_runs}</span> runs from{" "}
              <span className="font-black">{Math.floor(ballsRemaining / 6)}.{ballsRemaining % 6}</span> overs
            </p>
          </motion.div>
        )}

        {/* Batsmen */}
        <BatsmanDisplay
          striker={striker}
          nonStriker={nonStriker}
          strikerRuns={match.striker_runs}
          strikerBalls={match.striker_balls}
          nonStrikerRuns={match.non_striker_runs}
          nonStrikerBalls={match.non_striker_balls}
        />

        {/* Bowler */}
        <BowlerDisplay
          bowler={bowler}
          overs={match.bowler_legal_balls}
          runs={match.bowler_runs_given}
          wickets={match.bowler_wickets}
        />

        {/* Over Progress */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Current Over</span>
              <span className="text-xs text-muted-foreground">Over {Math.floor((match.legal_balls || 0) / 6) + 1}</span>
            </div>
            <OverProgress balls={currentOverBalls} currentBall={3} />
          </CardContent>
        </Card>

        {/* Commentary */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Ball-by-Ball</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
              {[
                { over: "6.6", text: "SIX! Massive hit over long-on", highlight: true },
                { over: "6.5", text: "Dot ball, good length delivery", highlight: false },
                { over: "6.4", text: "FOUR! Cracking cover drive", highlight: true },
                { over: "6.3", text: "Single pushed to mid-off", highlight: false },
                { over: "6.2", text: "Dot ball, defended back to bowler", highlight: false },
                { over: "6.1", text: "Single taken to square leg", highlight: false },
              ].map((comment, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-start gap-2 text-sm ${comment.highlight ? "text-primary" : ""}`}
                >
                  <span className="text-xs text-muted-foreground font-mono min-w-[2rem]">{comment.over}</span>
                  <span>{comment.text}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Partnership */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Partnership</span>
              <span className="font-semibold">57 runs (38 balls)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scorecard Modal */}
      <AnimatePresence>
        {showScorecard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b bg-card">
              <h2 className="text-lg font-black uppercase tracking-tighter italic">Match Scorecard</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowScorecard(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto pb-10">
              <div className="p-4 space-y-6 max-w-4xl mx-auto w-full">
                {scorecardLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                  </div>
                ) : !scorecard ? (
                  <div className="text-center py-20">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 opacity-50">
                       <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-bold text-lg">No Scorecard Data</h3>
                  </div>
                ) : (
                  <Tabs 
                    defaultValue={match.current_innings_no.toString()} 
                    className="w-full"
                  >
                    <div className="flex items-center justify-center mb-6">
                      <TabsList className="bg-muted/50 p-1 rounded-full border">
                        <TabsTrigger value="1" className="rounded-full px-8 font-black uppercase tracking-tighter">Innings 1</TabsTrigger>
                        <TabsTrigger value="2" className="rounded-full px-8 font-black uppercase tracking-tighter">Innings 2</TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Innings 1 Content */}
                    <TabsContent value="1" className="mt-0 outline-none">
                      {scorecard.first_innings ? (
                        <div className="space-y-4">
                          <div className="flex flex-col bg-card dark:bg-muted/30 rounded-xl border border-border dark:border-border/50 p-3 gap-2 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-black text-sm uppercase tracking-wider">
                                  {match.team_a_id === scorecard.first_innings.batting_team_id ? match.team_a_name : match.team_b_name}
                                </h3>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Innings 1 Summary</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black">{scorecard.first_innings.total_runs}/{scorecard.first_innings.total_wickets}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">{formatOvers(scorecard.first_innings.legal_balls)} OVS | CRR {calculateRunRate(scorecard.first_innings.total_runs, scorecard.first_innings.legal_balls)}</p>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-border/30 flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Team Extras</span>
                              <span className="text-[10px] font-black uppercase">{scorecard.first_innings.extras}</span>
                            </div>
                          </div>

                          {/* Batting Card */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary px-1">
                              BATTING - {formatTeamName(match.team_a_id === scorecard.first_innings.batting_team_id ? match.team_a_name : match.team_b_name)}
                            </h4>
                            <div className="overflow-x-auto bg-card dark:bg-primary/5 rounded-xl p-3 border shadow-sm border-border dark:border-primary/10">
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
                                  {scorecard.first_innings.batting?.sort((a: any, b: any) => {
                                    if (a.is_out && !b.is_out) return -1;
                                    if (!a.is_out && b.is_out) return 1;
                                    const aAtCrease = (a.user_id === match.striker_id || a.user_id === match.non_striker_id) && 1 === match.current_innings_no;
                                    const bAtCrease = (b.user_id === match.striker_id || b.user_id === match.non_striker_id) && 1 === match.current_innings_no;
                                    if (aAtCrease && !bAtCrease) return -1;
                                    if (!aAtCrease && bAtCrease) return 1;
                                    return 0;
                                  }).map((card: any) => {
                                    const isCurrentStriker = (card.user_id === match.striker_id || card.user_id === match.non_striker_id) && 1 === match.current_innings_no;
                                    return (
                                      <tr key={card.user_id} className="border-b border-primary/10 last:border-0">
                                        <td className="py-3">
                                          <div className="flex flex-col">
                                            <span className={!card.is_out && isCurrentStriker ? "font-black text-primary italic" : "font-bold text-foreground"}>
                                              {formatPlayerName(card.player_name) || "Unknown"} {!card.is_out && isCurrentStriker && "*"}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground italic">
                                              {card.is_out 
                                                ? (card.dismissal_type || "Out") 
                                                : isCurrentStriker 
                                                  ? "not out" 
                                                  : card.balls_faced > 0 
                                                    ? "not out" 
                                                    : "yet to bat"}
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
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Bowling Card */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 px-1">
                              BOWLING - {formatTeamName(match.team_a_id === scorecard.first_innings.bowling_team_id ? match.team_a_name : match.team_b_name)}
                            </h4>
                            <div className="overflow-x-auto bg-card dark:bg-blue-500/5 rounded-xl p-3 border shadow-sm border-border dark:border-blue-500/10">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-blue-500/10 text-left text-[10px] font-black uppercase tracking-widest text-blue-600/60">
                                    <th className="pb-2">Bowler</th>
                                    <th className="pb-2 text-right">O</th>
                                    <th className="pb-2 text-right">R</th>
                                    <th className="pb-2 text-right text-blue-700">W</th>
                                    <th className="pb-2 text-right">WD</th>
                                    <th className="pb-2 text-right">Econ</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {scorecard.first_innings.bowling?.map((card: any) => (
                                    <tr key={card.user_id} className="border-b border-blue-500/10 last:border-0">
                                      <td className="py-2 font-bold text-blue-900 dark:text-blue-200">{formatPlayerName(card.player_name) || "Unknown"}</td>
                                      <td className="py-2 text-right">{formatOvers(card.legal_balls)}</td>
                                      <td className="py-2 text-right">{card.runs_conceded}</td>
                                      <td className="py-2 text-right font-black text-blue-700 dark:text-blue-400">{card.wickets}</td>
                                      <td className="py-2 text-right text-muted-foreground">{card.wides}</td>
                                      <td className="py-2 text-right font-medium">
                                        {calculateRunRate(card.runs_conceded, card.legal_balls)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed">
                          <p className="text-muted-foreground">Innings 1 not started yet.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="2" className="mt-0 outline-none">
                      {scorecard.second_innings ? (
                        <div className="space-y-4">
                          <div className="flex flex-col bg-card dark:bg-muted/30 rounded-xl border border-border dark:border-border/50 p-3 gap-2 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-black text-sm uppercase tracking-wider">
                                  {match.team_a_id === scorecard.second_innings.batting_team_id ? match.team_a_name : match.team_b_name}
                                </h3>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Innings 2 Summary</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black">{scorecard.second_innings.total_runs}/{scorecard.second_innings.total_wickets}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">{formatOvers(scorecard.second_innings.legal_balls)} OVS | CRR {calculateRunRate(scorecard.second_innings.total_runs, scorecard.second_innings.legal_balls)}</p>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-border/30 flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Team Extras</span>
                              <span className="text-[10px] font-black uppercase">{scorecard.second_innings.extras}</span>
                            </div>
                          </div>

                          {/* Batting Card */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary px-1">
                              BATTING - {formatTeamName(match.team_a_id === scorecard.second_innings.batting_team_id ? match.team_a_name : match.team_b_name)}
                            </h4>
                            <div className="overflow-x-auto bg-card dark:bg-primary/5 rounded-xl p-3 border shadow-sm border-border dark:border-primary/10">
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
                                  {scorecard.second_innings.batting?.sort((a: any, b: any) => {
                                    if (a.is_out && !b.is_out) return -1;
                                    if (!a.is_out && b.is_out) return 1;
                                    const aAtCrease = (a.user_id === match.striker_id || a.user_id === match.non_striker_id) && 2 === match.current_innings_no;
                                    const bAtCrease = (b.user_id === match.striker_id || b.user_id === match.non_striker_id) && 2 === match.current_innings_no;
                                    if (aAtCrease && !bAtCrease) return -1;
                                    if (!aAtCrease && bAtCrease) return 1;
                                    return 0;
                                  }).map((card: any) => {
                                    const isCurrentStriker = (card.user_id === match.striker_id || card.user_id === match.non_striker_id) && 2 === match.current_innings_no;
                                    return (
                                      <tr key={card.user_id} className="border-b border-primary/10 last:border-0">
                                        <td className="py-3">
                                          <div className="flex flex-col">
                                            <span className={!card.is_out && isCurrentStriker ? "font-black text-primary italic" : "font-bold text-foreground"}>
                                              {formatPlayerName(card.player_name) || "Unknown"} {!card.is_out && isCurrentStriker && "*"}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground italic">
                                              {card.is_out 
                                                ? (card.dismissal_type || "Out") 
                                                : isCurrentStriker 
                                                  ? "not out" 
                                                  : card.balls_faced > 0 
                                                    ? "not out" 
                                                    : "yet to bat"}
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
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Bowling Card */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 px-1">
                              BOWLING - {formatTeamName(match.team_a_id === scorecard.second_innings.bowling_team_id ? match.team_a_name : match.team_b_name)}
                            </h4>
                            <div className="overflow-x-auto bg-card dark:bg-blue-500/5 rounded-xl p-3 border shadow-sm border-border dark:border-blue-500/10">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-blue-500/10 text-left text-[10px] font-black uppercase tracking-widest text-blue-600/60">
                                    <th className="pb-2">Bowler</th>
                                    <th className="pb-2 text-right">O</th>
                                    <th className="pb-2 text-right">R</th>
                                    <th className="pb-2 text-right text-blue-700">W</th>
                                    <th className="pb-2 text-right">WD</th>
                                    <th className="pb-2 text-right">Econ</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {scorecard.second_innings.bowling?.map((card: any) => (
                                    <tr key={card.user_id} className="border-b border-blue-500/10 last:border-0">
                                      <td className="py-2 font-bold text-blue-900 dark:text-blue-200">{formatPlayerName(card.player_name) || "Unknown"}</td>
                                      <td className="py-2 text-right">{formatOvers(card.legal_balls)}</td>
                                      <td className="py-2 text-right">{card.runs_conceded}</td>
                                      <td className="py-2 text-right font-black text-blue-700 dark:text-blue-400">{card.wickets}</td>
                                      <td className="py-2 text-right text-muted-foreground">{card.wides}</td>
                                      <td className="py-2 text-right font-medium">
                                        {calculateRunRate(card.runs_conceded, card.legal_balls)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-24 bg-muted/10 rounded-3xl border border-dashed border-border">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 opacity-20">
                             <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <h3 className="font-black text-muted-foreground uppercase tracking-tighter italic">2nd Innings Not Started</h3>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
                
                {match.winner_team_id && (
                  <div className="flex flex-col items-center justify-center gap-2 text-cricket-gold py-10 bg-cricket-gold/5 rounded-3xl border border-cricket-gold/20">
                    <Trophy className="h-10 w-10 animate-bounce" />
                    <span className="text-xl font-black uppercase tracking-tighter italic">
                      {match.winner_team_id === match.team_a_id ? match.team_a_name : match.team_b_name} WON THE MATCH
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
