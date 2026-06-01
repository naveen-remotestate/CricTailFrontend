
import type { Match, LiveMatchState } from "@/types";
import { formatOvers, calculateRunRate, calculateRequiredRate, formatTeamName } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ScoreHeaderProps {
  match: Match;
  liveState: LiveMatchState;
  compact?: boolean;
  firstInningsSummary?: {
    runs: number;
    wickets: number;
    legal_balls?: number;
  };
}

export function ScoreHeader({ match, liveState, compact, firstInningsSummary }: ScoreHeaderProps) {
  const isSecondInnings = match.current_innings_no === 2;
  const target = isSecondInnings ? (match.previous_innings_score || 0) + 1 : undefined;
  const totalBalls = match.overs * 6;
  const legalBallsBowled = liveState.legal_balls || 0;
  const ballsRemaining = totalBalls - legalBallsBowled;
  const requiredRate = target ? calculateRequiredRate(target, liveState.total_runs, ballsRemaining) : undefined;
  
  const teamAName = match.team_a_name;
  const teamBName = match.team_b_name;
  const battingTeamName = match.batting_team_id === match.team_a_id ? teamAName : teamBName;
  const bowlingTeamName = match.batting_team_id === match.team_a_id ? teamBName : teamAName;

  // Innings Logic
  const inn1TeamName = isSecondInnings ? bowlingTeamName : battingTeamName;
  const inn2TeamName = isSecondInnings ? battingTeamName : bowlingTeamName;
  
  const inn1Score = isSecondInnings 
    ? (firstInningsSummary ? `${firstInningsSummary.runs}/${firstInningsSummary.wickets}` : "-/-") 
    : `${liveState.total_runs}/${liveState.total_wickets}`;
    
  const inn2Score = isSecondInnings 
    ? `${liveState.total_runs}/${liveState.total_wickets}` 
    : "Yet to bat";

  const inn1Overs = isSecondInnings
    ? (match.previous_innings_legal_balls ? `${formatOvers(match.previous_innings_legal_balls)}` : `${match.overs}`)
    : formatOvers(legalBallsBowled);

  const inn2Overs = isSecondInnings
    ? formatOvers(legalBallsBowled)
    : "0.0";

  if (compact) {
    return (
      <div className="sticky top-0 z-40 w-full bg-[#1a1a2e] text-white px-4 py-1.5 border-b border-white/5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase text-primary leading-none">INN {match.current_innings_no}</span>
            <h2 className="text-[10px] font-black uppercase italic leading-none">{formatTeamName(battingTeamName)}</h2>
          </div>
          <div className="text-lg font-black">{liveState.total_runs}/{liveState.total_wickets}</div>
          <div className="text-right text-[9px] font-black">{formatOvers(legalBallsBowled)}/{match.overs}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background">
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] text-white px-4 pt-1.5 pb-1 relative overflow-hidden">
        
        {/* CENTERED MATCHUP (H + V Center) - Background Decoration Style */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20 select-none z-0">
           <div className="flex items-center gap-3">
              <span className="text-lg sm:text-xl font-black uppercase tracking-[0.2em] italic text-red-500">{formatTeamName(teamAName)}</span>
              <span className="text-xs font-black text-white/10 italic">VS</span>
              <span className="text-lg sm:text-xl font-black uppercase tracking-[0.2em] italic text-blue-500">{formatTeamName(teamBName)}</span>
           </div>
           <div className="text-[8px] font-black uppercase tracking-[0.5em] text-white/40 mt-0.5">Innings {match.current_innings_no}</div>
        </div>

        {/* INNINGS COMPARISON (Row 1) */}
        <div className="flex items-start justify-between mb-1 relative z-10">
           {/* 1st Innings (Left) */}
           <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5 mb-0.5">
                 <span className={cn(
                   "text-[8px] font-black uppercase tracking-widest",
                   !isSecondInnings ? "text-primary" : "text-white/30"
                 )}>
                   {formatTeamName(inn1TeamName)}
                 </span>
                 {!isSecondInnings && <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />}
              </div>
              <div className={cn(
                "font-black tracking-tighter leading-none mb-0.5",
                !isSecondInnings ? "text-2xl" : "text-lg text-white/60"
              )}>
                {inn1Score}
              </div>
              <div className="text-[8px] font-black text-white/20 italic tracking-widest uppercase">
                {inn1Overs} / {match.overs} OV
              </div>
           </div>

           {/* 2nd Innings (Right) */}
           <div className="flex flex-col items-end text-right">
              <div className="flex items-center gap-1.5 mb-0.5">
                 {isSecondInnings && <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />}
                 <span className={cn(
                   "text-[8px] font-black uppercase tracking-widest",
                   isSecondInnings ? "text-primary" : "text-white/30"
                 )}>
                   {formatTeamName(inn2TeamName)}
                 </span>
              </div>
              <div className={cn(
                "font-black tracking-tighter leading-none mb-0.5",
                isSecondInnings ? "text-2xl" : "text-lg text-white/60"
              )}>
                {inn2Score}
              </div>
              <div className="text-[8px] font-black text-white/20 italic tracking-widest uppercase text-right">
                {inn2Overs} / {match.overs} OV
              </div>
           </div>
        </div>

        {/* STATS BAR (Row 2) */}
        <div className="pt-1.5 border-t border-white/5 flex items-center justify-between relative z-10">
           <div className="flex items-center gap-3 text-[7px] font-black uppercase tracking-widest text-white/40">
              {isSecondInnings || !!match.winner_team_id ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="opacity-50">{formatTeamName(inn1TeamName)} RR:</span>
                    <span className="text-white/60">{calculateRunRate(firstInningsSummary?.runs || 0, firstInningsSummary?.legal_balls || (match.overs * 6))}</span>
                  </div>
                  <div className="h-2 w-[1px] bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <span className={cn(!!match.winner_team_id ? "opacity-50" : "text-primary")}>{formatTeamName(inn2TeamName)} RR:</span>
                    <span className={cn(!!match.winner_team_id ? "text-white/60" : "text-white")}>{calculateRunRate(liveState.total_runs, legalBallsBowled)}</span>
                  </div>
                </>
              ) : (
                <span>RR: {calculateRunRate(liveState.total_runs, legalBallsBowled)}</span>
              )}
           </div>

           <div>
              {(isSecondInnings && target && !match.winner_team_id) ? (
                 <div className="text-right flex items-center gap-1.5">
                    <span className="text-[8px] font-black text-yellow-500/60 uppercase">Target: {target}</span>
                    <span className="text-[9px] font-black text-primary uppercase italic">
                       Need {Math.max(target - liveState.total_runs, 0)} from {ballsRemaining}
                    </span>
                 </div>
              ) : (
                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/10 italic">Match In Progress</span>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
