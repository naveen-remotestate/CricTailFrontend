import { motion } from "framer-motion";
import type { Match, LiveMatchState } from "@/types";
import { formatOvers, calculateRunRate, calculateRequiredRate } from "@/lib/utils";
import { Trophy, Info, Timer } from "lucide-react";

interface ScoreHeaderProps {
  match: Match;
  liveState: LiveMatchState;
}

export function ScoreHeader({ match, liveState }: ScoreHeaderProps) {
  const isSecondInnings = match.current_innings_no === 2;
  const firstInnings = match.innings?.[0];
  const target = isSecondInnings ? (firstInnings?.total_runs || 0) + 1 : undefined;
  
  const totalBalls = match.overs * 6;
  const legalBallsBowled = liveState.legal_balls || 0;
  const ballsRemaining = totalBalls - legalBallsBowled;
  
  const requiredRate = target ? calculateRequiredRate(target, liveState.total_runs, ballsRemaining) : undefined;
  
  const currentInnings = match.innings?.find((i) => !i.is_completed) || (isSecondInnings ? match.innings?.[1] : match.innings?.[0]);
  const battingTeam = match.team_a?.id === currentInnings?.batting_team_id ? match.team_a : match.team_b;
  const tossWinner = match.toss_winner_team_id === match.team_a?.id ? match.team_a?.name : match.team_b?.name;

  return (
    <div className="sticky top-16 z-40 w-full bg-background border-b shadow-sm">
      {/* Primary Score Bar */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white px-4 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 rounded-sm">
                INNINGS {match.current_innings_no}
              </span>
              <div className="live-indicator relative h-1.5 w-1.5 rounded-full bg-red-500" />
            </div>
            <h2 className="text-sm font-bold tracking-tight uppercase truncate max-w-[120px]">
              {battingTeam?.name}
            </h2>
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
                  <span>{tossWinner} WON TOSS & {match.toss_decision === "BAT" ? "BAT" : "BOWL"}</span>
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
