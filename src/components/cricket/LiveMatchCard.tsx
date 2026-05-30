import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Match } from "@/types";
import { formatOvers, calculateRunRate } from "@/lib/utils";

interface LiveMatchCardProps {
  match: Match;
  featured?: boolean;
}

export function LiveMatchCard({ match, featured = false }: LiveMatchCardProps) {
  const liveState = match.live_state;
  const currentInnings = match.innings?.find((i) => !i.is_completed) || match.innings?.[match.innings.length - 1];
  const battingTeam = match.team_a?.id === currentInnings?.batting_team_id ? match.team_a : match.team_b;
  const bowlingTeam = match.team_a?.id === currentInnings?.batting_team_id ? match.team_b : match.team_a;

  const teamAInitials = match.team_a?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const teamBInitials = match.team_b?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  if (featured) {
    return (
      <motion.div 
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }}
        className="h-full"
      >
        <Link to={`/matches/${match.id}/live`}>
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
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-xl font-black shadow-lg shadow-primary/20">
                    {teamAInitials}
                  </div>
                  <p className="text-xs font-bold text-center truncate w-full">{match.team_a?.name}</p>
                </div>

                {/* Score / VS */}
                <div className="flex flex-col items-center gap-1 px-4">
                  {match.status === "LIVE" ? (
                    <>
                      <div className="text-3xl font-black tracking-tighter">
                        {liveState?.total_runs || 0}<span className="text-primary">/</span>{liveState?.total_wickets || 0}
                      </div>
                      <div className="text-[10px] font-bold text-white/40 uppercase">
                        {formatOvers(liveState?.legal_balls || 0)} OVS
                      </div>
                    </>
                  ) : (
                    <div className="text-xl font-black text-white/20 italic">VS</div>
                  )}
                </div>

                {/* Team B */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black">
                    {teamBInitials}
                  </div>
                  <p className="text-xs font-bold text-center truncate w-full">{match.team_b?.name}</p>
                </div>
              </div>

              {match.status === "LIVE" && liveState && (
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-bold text-white/60">{liveState.striker?.full_name?.split(" ")[0]} batting</span>
                  </div>
                  <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    CRR: {calculateRunRate(liveState.total_runs, liveState.legal_balls)}
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
      <Link to={`/matches/${match.id}/live`}>
        <Card className="border-none bg-card hover:bg-muted/50 transition-all rounded-3xl overflow-hidden shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant={match.status === "LIVE" ? "live" : match.status === "COMPLETED" ? "completed" : "upcoming"} className="text-[9px] font-black tracking-widest px-2 rounded-full">
                {match.status}
              </Badge>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{match.overs} OVERS</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-[10px] font-black">
                    {teamAInitials}
                  </div>
                  <span className={cn("text-xs font-bold truncate", match.winner_team_id === match.team_a_id ? "text-foreground" : "text-muted-foreground")}>
                    {match.team_a?.name}
                  </span>
                </div>
                {match.status === "COMPLETED" && (
                  <span className="text-xs font-black ml-2">{match.innings?.[0]?.total_runs || 0}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-[10px] font-black">
                    {teamBInitials}
                  </div>
                  <span className={cn("text-xs font-bold truncate", match.winner_team_id === match.team_b_id ? "text-foreground" : "text-muted-foreground")}>
                    {match.team_b?.name}
                  </span>
                </div>
                {match.status === "COMPLETED" && (
                  <span className="text-xs font-black ml-2">{match.innings?.[1]?.total_runs || 0}</span>
                )}
              </div>
            </div>

            {match.status === "LIVE" && liveState && (
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-[10px] font-black text-primary">LIVE SCORE</span>
                <span className="text-sm font-black text-primary">
                  {liveState.total_runs}/{liveState.total_wickets}
                </span>
              </div>
            )}
            
            {match.status === "COMPLETED" && (
              <div className="mt-3 text-center">
                <p className="text-[9px] font-black text-primary uppercase tracking-tighter bg-primary/5 py-1 rounded-full">
                  {match.winner_team_id === match.team_a_id ? match.team_a?.name : match.team_b?.name} won
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
