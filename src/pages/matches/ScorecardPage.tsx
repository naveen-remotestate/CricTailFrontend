import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMatch, useScorecard, useBallEvents } from "@/hooks/useMatches";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { formatOvers, calculateRunRate, formatPlayerName, formatTeamName, cn } from "@/lib/utils";
import { Trophy, ArrowLeft, Share2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InningsScorecard } from "@/types";

export default function ScorecardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: match, isLoading: matchLoading } = useMatch(id || "");
  const { data: scorecard, isLoading: scorecardLoading } = useScorecard(id || "");

  // Fetch ball events for both innings
  const { data: firstInningsBalls } = useBallEvents(scorecard?.first_innings?.innings_id || "");
  const { data: secondInningsBalls } = useBallEvents(scorecard?.second_innings?.innings_id || "");

  const handleShareMatch = () => {
    const url = `${window.location.origin}/matches/${id}/live`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Live link copied! Share it with viewers.");
    }).catch(() => {
      toast.error("Failed to copy link.");
    });
  };

  if (matchLoading || scorecardLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-[500px] w-full rounded-3xl" />
      </div>
    );
  }

  if (!match || !scorecard) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-bold text-lg italic uppercase tracking-tighter">No Scorecard Data</h3>
        <p className="text-sm text-muted-foreground mt-1">This match hasn't started yet.</p>
        <Button variant="outline" className="mt-6 rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-3 w-3" /> Go Back
        </Button>
      </div>
    );
  }

  const renderInningsContent = (inn: InningsScorecard | undefined, inningsNo: number, ballEvents: any[] | undefined) => {
    if (!inn || (!inn.batting?.length && !inn.bowling?.length)) {
      return (
        <div className="text-center py-12 rounded-3xl border border-dashed bg-muted/20">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Innings {inningsNo} hasn't started yet</p>
        </div>
      );
    }

    const battingTeamName = inn.batting_team_id === match.team_a_id ? match.team_a_name : match.team_b_name;
    const bowlingTeamName = inn.bowling_team_id === match.team_a_id ? match.team_a_name : match.team_b_name;

    // Innings Data Logic
    const isCurrentInnings = match.current_inning_id === inn.innings_id;
    const strikerId = isCurrentInnings ? match.striker_id : null;
    const nonStrikerId = isCurrentInnings ? match.non_striker_id : null;

    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="flex flex-col bg-card dark:bg-muted/30 rounded-xl border border-border p-4 gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl uppercase italic leading-none">{formatTeamName(battingTeamName)}</h3>
            <span className="text-2xl font-black leading-none">{inn.total_runs}<span className="text-primary text-lg">/{inn.total_wickets}</span></span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span>{formatOvers(inn.legal_balls)} Overs</span>
            <span>RR: {calculateRunRate(inn.total_runs, inn.legal_balls)}</span>
          </div>
          <div className="pt-2 border-t border-border/50 text-[10px] font-bold text-muted-foreground flex gap-3">
             <span className="uppercase tracking-widest">Extras: <span className="text-foreground">{inn.extras || 0}</span></span>
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
                {(() => {
                  const battingList = [...(inn.batting || [])].sort((a, b) => {
                    const aIsYetToBat = !a.is_out && a.balls_faced === 0 && a.user_id !== strikerId && a.user_id !== nonStrikerId;
                    const bIsYetToBat = !b.is_out && b.balls_faced === 0 && b.user_id !== strikerId && b.user_id !== nonStrikerId;
                    
                    const aIsNotOut = !a.is_out && !aIsYetToBat;
                    const bIsNotOut = !b.is_out && !bIsYetToBat;

                    // Priority: 1. OUT, 2. NOT OUT, 3. YET TO BAT
                    const getPriority = (isOut: boolean, isNotOut: boolean, isYetToBat: boolean) => {
                      if (isOut) return 1;
                      if (isNotOut) return 2;
                      if (isYetToBat) return 3;
                      return 4;
                    };

                    const aPriority = getPriority(a.is_out, aIsNotOut, aIsYetToBat);
                    const bPriority = getPriority(b.is_out, bIsNotOut, bIsYetToBat);

                    return aPriority - bPriority;
                  });

                  return battingList.map((card) => {
                    const isYetToBat = !card.is_out && card.balls_faced === 0 && card.user_id !== strikerId && card.user_id !== nonStrikerId;
                    const isNotOut = !card.is_out && !isYetToBat;
                    
                    return (
                      <tr key={card.user_id} className="border-b border-primary/10 last:border-0">
                        <td className="py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{formatPlayerName(card.player_name)}</span>
                            <span className={cn(
                              "text-[10px] font-black uppercase italic tracking-tighter",
                              card.is_out ? "text-red-500" : (isNotOut ? "text-emerald-500" : "text-muted-foreground/40")
                            )}>
                              {card.is_out ? (card.dismissal_type?.replace("_", " ") || "Out") : (
                                isNotOut ? "not out" : "yet to bat"
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-black">{card.runs}</td>
                        <td className="py-3 text-right font-black text-muted-foreground">{card.balls_faced}</td>
                        <td className="py-3 text-right font-black text-muted-foreground">{card.fours}</td>
                        <td className="py-3 text-right font-black text-muted-foreground">{card.sixes}</td>
                        <td className="py-3 text-right font-bold text-primary">
                          {card.balls_faced > 0 ? ((card.runs / card.balls_faced) * 100).toFixed(1) : "0.0"}
                        </td>
                      </tr>
                    );
                  });
                })()}
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
                    <td className="py-3 text-right font-black">0</td>
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

        {/* Ball-by-Ball Commentary */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Ball-by-Ball</h4>
          </div>
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <CardContent className="p-3">
              <div className="space-y-0 max-h-[500px] overflow-y-auto scrollbar-hide">
                 {(!ballEvents || ballEvents.length === 0) ? (
                   <p className="text-xs text-muted-foreground italic text-center py-4">No ball events recorded for this innings.</p>
                 ) : (
                   (() => {
                     const reversedEvents = [...ballEvents].reverse();
                     return reversedEvents.map((ball: any, i: number) => {
                       const isOverEnd = i < reversedEvents.length - 1 && ball.over_no !== reversedEvents[i+1].over_no;
                       
                       return (
                         <div key={i}>
                           <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 py-3 px-2 border-b border-border/30 hover:bg-muted/5 transition-colors">
                              <div className="h-10 w-10 rounded-full border border-border bg-muted/10 flex items-center justify-center shrink-0">
                                 <span className="text-[10px] font-black text-muted-foreground italic leading-none">{ball.over_no - 1}.{ball.ball_in_over}</span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <p className="text-[11px] font-black uppercase tracking-tight leading-none text-foreground truncate">
                                      {formatPlayerName(ball.bowler_name)} to {formatPlayerName(ball.striker_name)}
                                    </p>
                                    <div className={cn(
                                      "px-2 py-0.5 rounded-full border font-black text-[9px] uppercase tracking-widest shadow-sm",
                                      ball.is_wicket ? "border-red-500 bg-red-500/10 text-red-600" :
                                      ball.extra_type === "WIDE" || ball.extra_type === "NO_BALL" ? "border-yellow-600 bg-yellow-500/10 text-yellow-700" :
                                      ball.runs_off_bat === 4 ? "border-primary bg-primary/10 text-primary" :
                                      ball.runs_off_bat === 6 ? "border-purple-600 bg-purple-500/10 text-purple-600" :
                                      ball.extra_type === "BYE" || ball.extra_type === "LEG_BYE" ? "border-blue-400 bg-blue-400/10 text-blue-600" :
                                      "border-muted bg-muted/20 text-muted-foreground"
                                    )}>
                                      {(() => {
                                        if (ball.is_wicket) {
                                          if (ball.extra_type === "WIDE") return ball.extra_runs > 0 ? `W+${ball.extra_runs}wd` : "W+wd";
                                          if (ball.extra_type === "NO_BALL") return ball.runs_off_bat > 0 ? `W+${ball.runs_off_bat}nb` : "W+nb";
                                          if (ball.runs_off_bat > 0) return `W+${ball.runs_off_bat}`;
                                          return "W";
                                        }
                                        if (ball.extra_type === "WIDE") return ball.extra_runs > 0 ? `wd+${ball.extra_runs}` : "wd";
                                        if (ball.extra_type === "NO_BALL") return ball.runs_off_bat > 0 ? `nb+${ball.runs_off_bat}` : "nb";
                                        if (ball.extra_type === "BYE") return ball.extra_runs > 0 ? `${ball.extra_runs}b` : "b";
                                        if (ball.extra_type === "LEG_BYE") return ball.extra_runs > 0 ? `${ball.extra_runs}lb` : "lb";
                                        return ball.runs_off_bat;
                                      })()}
                                    </div>
                                  </div>
                                  <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-2">
                                    {ball.is_wicket ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-red-500 font-black uppercase italic tracking-widest text-[9px]">
                                          OUT! {ball.dismissed_player_name ? `${formatPlayerName(ball.dismissed_player_name)} ` : ""}{ball.wicket_type?.replace("_", " ")} {ball.dismissed_by_fielder_name ? `(${formatPlayerName(ball.dismissed_by_fielder_name)})` : ""}
                                        </span>
                                        {ball.extra_type && (
                                          <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 font-black text-[8px] border border-yellow-500/20 uppercase">
                                            {ball.extra_type}
                                          </span>
                                        )}
                                        {(ball.runs_off_bat > 0 || (ball.extra_type === "WIDE" && ball.extra_runs > 0)) && (
                                          <span className="font-bold text-foreground/80 uppercase text-[9px]">
                                            + {ball.extra_type === "WIDE" ? ball.extra_runs : ball.runs_off_bat} RUN{((ball.extra_type === "WIDE" ? ball.extra_runs : ball.runs_off_bat) > 1) ? "S" : ""}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-foreground/80 uppercase">
                                          {ball.runs_off_bat === 4 ? "FOUR RUNS" : ball.runs_off_bat === 6 ? "SIXER!" : ball.runs_off_bat === 0 && !ball.extra_type ? "no run" : `${ball.runs_off_bat} run${ball.runs_off_bat !== 1 ? 's' : ''}`}
                                        </span>
                                        {ball.extra_type && (
                                          <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 font-black text-[8px] border border-yellow-500/20 uppercase">
                                            {ball.extra_type}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                           </motion.div>
                           {isOverEnd && (
                             <div className="py-4 flex items-center gap-3">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border border-border/50">End of Over {reversedEvents[i+1].over_no}</span>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-border via-border to-transparent" />
                             </div>
                           )}
                         </div>
                       );
                     });
                   })()
                 )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">Match Scorecard</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={handleShareMatch}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-8 pb-20">
        {/* Match Title Card */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 mb-2">
             <div className="live-indicator relative h-2 w-2 rounded-full bg-red-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">Full Scorecard</span>
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
            <span className="text-red-500">{formatTeamName(match.team_a_name)}</span>
            <span className="text-muted-foreground/20 text-xl px-2">VS</span>
            <span className="text-blue-500">{formatTeamName(match.team_b_name)}</span>
          </h2>
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            <span>{match.overs} Overs</span>
            <span className="opacity-30">•</span>
            <span>{match.start_time ? new Date(match.start_time).toLocaleDateString() : "Live"}</span>
          </div>
          
          {match.winner_team_id && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 inline-flex items-center gap-3 bg-yellow-500/10 text-yellow-600 px-6 py-2 rounded-full border border-yellow-500/20 shadow-sm">
              <Trophy className="h-4 w-4 fill-current" />
              <span className="text-xs font-black uppercase italic tracking-widest">
                {match.winner_team_id === match.team_a_id ? match.team_a_name : match.team_b_name} WON THE MATCH
              </span>
            </motion.div>
          )}
        </div>

        <Tabs defaultValue="first" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl h-14 bg-muted/20 p-1.5 border border-border/50">
            <TabsTrigger value="first" className="rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
              1st Innings
            </TabsTrigger>
            <TabsTrigger value="second" className="rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
              2nd Innings
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-8">
            <TabsContent value="first" className="mt-0 focus-visible:outline-none">
              {renderInningsContent(scorecard.first_innings, 1, firstInningsBalls)}
            </TabsContent>
            <TabsContent value="second" className="mt-0 focus-visible:outline-none">
              {renderInningsContent(scorecard.second_innings, 2, secondInningsBalls)}
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
