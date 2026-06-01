import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMatch, useScorecard } from "@/hooks/useMatches";
import { Skeleton } from "@/components/ui/skeleton";
import { formatOvers, calculateRunRate, formatPlayerName, formatTeamName } from "@/lib/utils";
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
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <Skeleton className="h-32 rounded-[2rem]" />
        <Skeleton className="h-64 rounded-[2rem]" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Match not found</p>
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
                {inn.batting?.map((card) => (
                  <tr key={card.user_id} className="border-b border-primary/10 last:border-0">
                    <td className="py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{formatPlayerName(card.player_name)}</span>
                        <span className="text-[10px] text-muted-foreground italic">
                          {card.is_out ? (card.dismissal_type?.replace("_", " ") || "Out") : "not out"}
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
    <div className="min-h-screen bg-background pb-10">
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-lg">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-black uppercase tracking-tighter italic">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-primary/20 text-primary hover:bg-primary/10" onClick={handleShareMatch} title="Share Match">
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 opacity-50">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Full Scorecard</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
            <span className="text-primary">{formatTeamName(match.team_a_name)}</span> vs <span className="text-blue-500">{formatTeamName(match.team_b_name)}</span>
          </p>
        </motion.div>

        {match.winner_team_id && (
          <div className="flex items-center justify-center gap-2 text-yellow-600 bg-yellow-500/10 py-3 rounded-2xl border border-yellow-500/20 max-w-md mx-auto">
            <Trophy className="h-5 w-5" />
            <span className="text-sm font-black uppercase tracking-widest">
              {match.winner_team_id === match.team_a_id ? match.team_a_name : match.team_b_name} won
            </span>
          </div>
        )}

        <div className="p-1 space-y-6 max-w-4xl mx-auto w-full">
          {!scorecard ? (
            <div className="text-center py-20">
              <h3 className="font-bold text-lg">No Scorecard Data</h3>
            </div>
          ) : (
            <Tabs defaultValue={match.current_innings_no.toString()} className="w-full">
              <div className="flex items-center justify-center mb-6">
                <TabsList className="bg-muted/50 p-1 rounded-full border shadow-sm">
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
    </div>
  );
}
