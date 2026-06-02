import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Match } from "@/types";
import { formatOvers, calculateRunRate, formatPlayerName, formatTeamName } from "@/lib/utils";

interface LiveMatchCardProps {
  match: Match;
  featured?: boolean;
}

export function LiveMatchCard({ match, featured = false }: LiveMatchCardProps) {
  // Use properties directly from match as they are now top-level in MatchResponse
  const teamAInitials = match.team_a_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const teamBInitials = match.team_b_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  
  // Align with Live/Finished logic
  const isCompleted = !!match.winner_team_id;
  const isLive = !isCompleted;
  
  const battingTeamName = match.batting_team_id === match.team_a_id ? match.team_a_name : match.team_b_name;

  // Calculate scores for display
  // Team batting second is the current batting team when match finishes (innings 2)
  const teamBattedSecondId = match.batting_team_id;
  const teamBattedFirstId = match.bowling_team_id;

  const getTeamScore = (teamId: string) => {
    // If match is finished, we have both scores
    if (isCompleted) {
      if (teamId === teamBattedSecondId) {
        return `${match.current_total_runs}/${match.current_total_wickets}`;
      } else if (teamId === teamBattedFirstId) {
        const wickets = match.previous_innings_wickets !== undefined ? `/${match.previous_innings_wickets}` : "";
        return `${match.previous_innings_score}${wickets}`;
      }
    } 
    // If match is live
    else if (isLive) {
      if (teamId === match.batting_team_id) {
        return `${match.current_total_runs}/${match.current_total_wickets}`;
      }
      // If it's second innings, show the first innings score for the other team
      if (match.current_innings_no === 2 && match.previous_innings_score !== undefined) {
        const wickets = match.previous_innings_wickets !== undefined ? `/${match.previous_innings_wickets}` : "";
        return `${match.previous_innings_score}${wickets}`;
      }
      return "Yet to bat";
    }
    return null;
  };

  const teamAScore = getTeamScore(match.team_a_id);
  const teamBScore = getTeamScore(match.team_b_id);

  if (featured) {
    return (
      <motion.div 
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }}
        className="h-full"
      >
        <Link to={isCompleted ? `/matches/${match.match_id}/scorecard` : `/matches/${match.match_id}/live`}>
          <Card className="h-full overflow-hidden border-none bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white rounded-[2rem] shadow-xl shadow-primary/10">
            <CardContent className="p-6 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  {!isCompleted && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", isCompleted ? "text-yellow-500" : "text-primary")}>
                    {isCompleted ? "Match Finished" : "Live Match"}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                  {match.overs} OVERS
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* Team A */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-xl font-black shadow-lg shadow-primary/20 border-2 border-white/10">
                    {teamAInitials}
                  </div>
                  <p className="text-sm font-black text-center truncate w-full uppercase tracking-tight">{formatTeamName(match.team_a_name)}</p>
                  {isCompleted && <p className="text-xl font-black text-primary leading-none mt-1">{teamAScore}</p>}
                </div>

                {/* Score / VS */}
                <div className="flex flex-col items-center gap-1 px-4">
                  {isLive ? (
                    <>
                      <div className="text-3xl font-black tracking-tighter">
                        {match.current_total_runs || 0}<span className="text-primary">/</span>{match.current_total_wickets || 0}
                      </div>
                      <div className="text-[10px] font-bold text-white/40 uppercase">
                        {formatOvers(match.legal_balls || 0)} OVS
                      </div>
                    </>
                  ) : (
                    <div className="text-xl font-black text-white/20 italic">VS</div>
                  )}
                </div>

                {/* Team B */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 border-2 border-white/20 flex items-center justify-center text-xl font-black shadow-lg">
                    {teamBInitials}
                  </div>
                  <p className="text-sm font-black text-center truncate w-full uppercase tracking-tight">{formatTeamName(match.team_b_name)}</p>
                  {isCompleted && <p className="text-xl font-black text-blue-400 leading-none mt-1">{teamBScore}</p>}
                </div>
              </div>

              {isLive ? (
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-bold text-white/60">{formatPlayerName(match.striker_name?.split(" ")[0])} batting</span>
                  </div>
                  <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    RR: {calculateRunRate(match.current_total_runs || 0, match.legal_balls || 0)}
                  </div>
                </div>
              ) : (
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center">
                  <p className="text-xs font-black text-yellow-500 uppercase tracking-widest text-center">
                    {match.winner_team_id === match.team_a_id ? match.team_a_name : match.team_b_name} won
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }} 
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Link to={isCompleted ? `/matches/${match.match_id}/scorecard` : `/matches/${match.match_id}/live`}>
        <Card className="border border-border/50 bg-card hover:bg-muted/50 transition-all rounded-3xl overflow-hidden shadow-sm h-full flex flex-col">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <Badge variant={isLive ? "live" : "completed"} className="text-[9px] font-black tracking-widest px-2 rounded-full">
                {isLive ? "LIVE" : "FINISHED"}
              </Badge>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{match.overs} OVERS</span>
            </div>

            <div className="space-y-4 flex-1">
              {/* Team A Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-xs font-black shadow-sm text-primary">
                    {teamAInitials}
                  </div>
                  <span className={cn("text-sm font-black truncate tracking-tight uppercase", (isCompleted && match.winner_team_id === match.team_a_id) || (isLive && match.batting_team_id === match.team_a_id) ? "text-foreground" : "text-muted-foreground")}>
                    {formatTeamName(match.team_a_name)}
                  </span>
                </div>
                {teamAScore && (
                   <span className={cn("text-sm font-black ml-2", (isCompleted && match.winner_team_id === match.team_a_id) || (isLive && match.batting_team_id === match.team_a_id) ? "text-primary" : "text-muted-foreground", teamAScore === "Yet to bat" && "text-[9px] uppercase tracking-widest opacity-50")}>
                     {teamAScore}
                   </span>
                )}
              </div>

              {/* Team B Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center text-xs font-black shadow-sm text-blue-600">
                    {teamBInitials}
                  </div>
                  <span className={cn("text-sm font-black truncate tracking-tight uppercase", (isCompleted && match.winner_team_id === match.team_b_id) || (isLive && match.batting_team_id === match.team_b_id) ? "text-foreground" : "text-muted-foreground")}>
                    {formatTeamName(match.team_b_name)}
                  </span>
                </div>
                {teamBScore && (
                   <span className={cn("text-sm font-black ml-2", (isCompleted && match.winner_team_id === match.team_b_id) || (isLive && match.batting_team_id === match.team_b_id) ? "text-blue-600" : "text-muted-foreground", teamBScore === "Yet to bat" && "text-[9px] uppercase tracking-widest opacity-50")}>
                     {teamBScore}
                   </span>
                )}
              </div>
            </div>

            {isLive ? (
              <div className="mt-4 pt-3 border-t flex flex-col gap-1">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                     {formatTeamName(battingTeamName)} - Innings {match.current_innings_no}
                   </span>
                   <span className="text-sm font-black text-primary">
                     {match.current_total_runs}/{match.current_total_wickets}
                   </span>
                </div>
                <div className="flex items-center justify-between text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                   <span>{formatOvers(match.legal_balls || 0)} overs bowled</span>
                   <span>RR {calculateRunRate(match.current_total_runs || 0, match.legal_balls || 0)}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center">
                <p className="text-[9px] font-black text-yellow-600 uppercase tracking-tighter bg-yellow-500/10 py-1.5 rounded-full border border-yellow-500/20">
                  {match.winner_team_id === match.team_a_id ? match.team_a_name : match.team_b_name} won
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

// Helper to handle conditional classes safely
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
