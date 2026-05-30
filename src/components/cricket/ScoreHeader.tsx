import { motion } from "framer-motion";
import type { Match, LiveMatchState } from "@/types";
import { formatOvers, calculateRunRate, calculateRequiredRate, formatTeamName } from "@/lib/utils";
import { Trophy, Info, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreHeaderProps {
  match: Match;
  liveState: LiveMatchState;
}

export function ScoreHeader({ match, liveState }: ScoreHeaderProps) {
  const isSecondInnings = match.current_innings_no === 2;
  
  // Use backend properties directly
  const target = isSecondInnings ? (match.previous_innings_score || 0) + 1 : undefined;
  
  const totalBalls = match.overs * 6;
  const legalBallsBowled = liveState.legal_balls || 0;
  const ballsRemaining = totalBalls - legalBallsBowled;
  
  const requiredRate = target ? calculateRequiredRate(target, liveState.total_runs, ballsRemaining) : undefined;
  
  const battingTeamId = match.batting_team_id;
  const teamAName = match.team_a_name;
  const teamBName = match.team_b_name;

  const isTeamABatting = battingTeamId === match.team_a_id;

  const battingTeamName = isTeamABatting ? teamAName : teamBName;

  const tossWinnerName = match.toss_winner_team_id === match.team_a_id ? match.team_a_name : match.team_b_name;
  const tossText = match.toss_winner_team_id 
    ? `${tossWinnerName} WON TOSS & CHOSE TO ${match.toss_decision}`
    : "TOSS NOT YET CONDUCTED";

  return (
    <div className="sticky top-16 z-40 w-full bg-background border-b shadow-sm">
      {/* Primary Score Bar */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white px-4 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 rounded-sm">
                INNINGS {match.current_innings_no}
              </span>
              <h2 className="text-sm font-bold tracking-tight uppercase truncate max-w-[150px]">
                {formatTeamName(battingTeamName)}
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Team A */}
              <div className="flex flex-col">
                <span className={cn(
                  "text-xs font-black transition-all",
                  isTeamABatting ? "text-lg text-white" : "text-[10px] text-white/40 uppercase"
                )}>
                  {formatTeamName(teamAName)}
                </span>
              </div>

              <span className="text-[10px] font-black text-white/20">VS</span>

              {/* Team B */}
              <div className="flex flex-col">
                <span className={cn(
                  "text-xs font-black transition-all",
                  !isTeamABatting ? "text-lg text-white" : "text-[10px] text-white/40 uppercase"
                )}>
                  {formatTeamName(teamBName)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <motion.div
                key={liveState.total_runs}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-3xl font-black tracking-tighter leading-none"
              >
                {liveState.total_runs}<span className="text-primary mx-0.5">/</span>{liveState.total_wickets}
              </motion.div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-tighter mt-1">
                {formatOvers(legalBallsBowled)} <span className="mx-1">|</span> {match.overs} OVS
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Info Bar (TV Style) */}
      <div className="bg-muted/50 px-4 py-1.5 overflow-hidden">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-[10px] font-black uppercase tracking-tight">
          {isSecondInnings ? (
            // 2nd Innings: Chasing Info
            <>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-primary">
                  <Trophy className="h-3 w-3" />
                  <span>TARGET: {target}</span>
                </div>
                <div className="text-muted-foreground border-l pl-3 h-3 flex items-center">
                  NEED: {target ? Math.max(target - liveState.total_runs, 0) : 0} FROM {ballsRemaining}
                </div>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="bg-background px-2 py-0.5 rounded shadow-sm">RRR: {requiredRate}</span>
                <span className="text-foreground">CRR: {calculateRunRate(liveState.total_runs, legalBallsBowled)}</span>
              </div>
            </>
          ) : (
            // 1st Innings: Setup Info
            <>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Info className="h-3 w-3" />
                  <span>{tossText}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  <span>{match.overs} OVER MATCH</span>
                </div>
                <span className="text-foreground bg-background px-2 py-0.5 rounded shadow-sm border border-primary/10">
                  CRR: {calculateRunRate(liveState.total_runs, legalBallsBowled)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
