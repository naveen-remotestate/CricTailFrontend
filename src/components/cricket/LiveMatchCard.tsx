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
  const isLive = !match.is_completed;
  const isCompleted = match.is_completed;
  
  const battingTeamName = match.batting_team_id === match.team_a_id ? match.team_a_name : match.team_b_name;

  if (featured) {
    return (
      <motion.div 
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }}
        className="h-full"
      >
        <Link to={`/matches/${match.match_id}/live`}>
          <Card className="h-full overflow-hidden border-none bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white rounded-[2rem] shadow-xl shadow-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Live Match</span>
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
                </div>
              </div>

              {isLive && (
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-bold text-white/60">{formatPlayerName(match.striker_name?.split(" ")[0])} batting</span>
                  </div>
                  <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    CRR: {calculateRunRate(match.current_total_runs, match.legal_balls)}
                  </div>
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
    >
      <Link to={`/matches/${match.match_id}/live`}>
        <Card className="border border-border/50 bg-card hover:bg-muted/50 transition-all rounded-3xl overflow-hidden shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant={isLive ? "live" : isCompleted ? "completed" : "upcoming"} className="text-[9px] font-black tracking-widest px-2 rounded-full">
                {isLive ? "LIVE" : isCompleted ? "COMPLETED" : "UPCOMING"}
              </Badge>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{match.overs} OVERS</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-xs font-black shadow-sm text-primary">
                    {teamAInitials}
                  </div>
                  <span className={cn("text-sm font-black truncate tracking-tight uppercase", match.winner_team_id === match.team_a_id ? "text-foreground" : "text-muted-foreground")}>
                    {formatTeamName(match.team_a_name)}
                  </span>
                </div>
                {isCompleted && match.batting_team_id === match.team_a_id && (
                   <span className="text-xs font-black ml-2">{match.current_total_runs}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center text-xs font-black shadow-sm text-blue-600">
                    {teamBInitials}
                  </div>
                  <span className={cn("text-sm font-black truncate tracking-tight uppercase", match.winner_team_id === match.team_b_id ? "text-foreground" : "text-muted-foreground")}>
                    {formatTeamName(match.team_b_name)}
                  </span>
                </div>
                {isCompleted && match.batting_team_id === match.team_b_id && (
                   <span className="text-xs font-black ml-2">{match.current_total_runs}</span>
                )}
              </div>
            </div>

            {isLive && (
              <div className="mt-3 pt-3 border-t flex flex-col gap-1">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                     {formatTeamName(battingTeamName)} - Innings {match.current_innings_no}
                   </span>
                   <span className="text-sm font-black text-primary">
                     {match.current_total_runs}/{match.current_total_wickets}
                   </span>
                </div>
                <div className="flex items-center justify-between text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                   <span>{formatOvers(match.legal_balls)} overs bowled</span>
                   <span>CRR {calculateRunRate(match.current_total_runs, match.legal_balls)}</span>
                </div>
              </div>
            )}
            
            {isCompleted && (
              <div className="mt-3 text-center">
                <p className="text-[9px] font-black text-primary uppercase tracking-tighter bg-primary/5 py-1 rounded-full">
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
