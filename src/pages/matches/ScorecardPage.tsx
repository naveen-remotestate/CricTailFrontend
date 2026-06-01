import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMatch, useScorecard } from "@/hooks/useMatches";
import { Skeleton } from "@/components/ui/skeleton";
import { formatOvers, calculateRunRate, formatPlayerName, formatTeamName, cn } from "@/lib/utils";
import { Trophy, ArrowLeft, Share2, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InningsScorecard } from "@/types";
import { useMatchCreationStore } from "@/store/matchCreationStore";

export default function ScorecardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const creationStore = useMatchCreationStore();
  const { data: match, isLoading: matchLoading } = useMatch(id || "");
  const { data: scorecard, isLoading: scorecardLoading } = useScorecard(id || "");

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

  const renderInningsContent = (inn: InningsScorecard | undefined, inningsNo: number) => {
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
                {inn.batting?.map((card) => {
                  const isYetToBat = !card.is_out && card.balls_faced === 0 && card.user_id !== strikerId && card.user_id !== nonStrikerId;
                  const isNotOut = !card.is_out && (card.user_id === strikerId || card.user_id === nonStrikerId);
                  
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
                              isNotOut ? "not out" : (isYetToBat ? "yet to bat" : "not out")
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
                })}
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
            {formatTeamName(match.team_a_name)} <span className="text-primary text-xl px-1">VS</span> {formatTeamName(match.team_b_name)}
          </h2>
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            <span>{match.overs} Overs</span>
            <span className="opacity-30">•</span>
            <span>{new Date(match.created_at).toLocaleDateString()}</span>
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
              {renderInningsContent(scorecard.first_innings, 1)}
            </TabsContent>
            <TabsContent value="second" className="mt-0 focus-visible:outline-none">
              {renderInningsContent(scorecard.second_innings, 2)}
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
