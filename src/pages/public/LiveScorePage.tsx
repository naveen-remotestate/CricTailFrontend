import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useMatch, useLiveState } from "@/hooks/useMatches";
import { ScoreHeader } from "@/components/cricket/ScoreHeader";
import { BatsmanDisplay } from "@/components/cricket/BatsmanDisplay";
import { BowlerDisplay } from "@/components/cricket/BowlerDisplay";
import { OverProgress } from "@/components/cricket/OverProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatOvers, calculateRunRate, calculateRequiredRate } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Trophy, ArrowLeft, Activity } from "lucide-react";

export default function LiveScorePage() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading: matchLoading } = useMatch(id || "");
  const { data: liveState, isLoading: liveLoading } = useLiveState(id || "");

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

  const currentInnings = match.innings?.find((i) => !i.is_completed);
  const firstInnings = match.innings?.[0];
  const isSecondInnings = match.current_innings_no === 2;
  const target = isSecondInnings ? (firstInnings?.total_runs || 0) + 1 : undefined;
  const ballsRemaining = (match.overs * 6) - (liveState.legal_balls || 0);
  const requiredRate = target ? calculateRequiredRate(target, liveState.total_runs, ballsRemaining) : undefined;

  // Mock ball data for display
  const currentOverBalls = [
    { runs: 1, isBoundary: false },
    { runs: 0, isDot: true },
    { runs: 4, isBoundary: true },
    { runs: 1, isBoundary: false },
    { runs: 6, isSix: true },
    { runs: 0, isDot: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to={`/matches/${match.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <div className="live-indicator relative h-2.5 w-2.5 rounded-full bg-red-500" />
              <Badge variant="live" className="text-xs">LIVE</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Score Header */}
      <ScoreHeader match={match} liveState={liveState} />

      <div className="mx-auto max-w-3xl px-4 py-4 space-y-4">
        {/* Match Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground">
            {match.current_innings_no === 1 ? "First Innings" : "Second Innings"}
            {target && ` | Target: ${target}`}
          </p>
          {requiredRate && (
            <p className="text-sm">
              Need <span className="font-semibold text-primary">{target! - liveState.total_runs}</span> runs from{" "}
              <span className="font-semibold">{Math.floor(ballsRemaining / 6)}.{ballsRemaining % 6}</span> overs
            </p>
          )}
        </motion.div>

        {/* Batsmen */}
        <BatsmanDisplay
          striker={liveState.striker}
          nonStriker={liveState.non_striker}
          strikerRuns={42}
          strikerBalls={28}
          nonStrikerRuns={15}
          nonStrikerBalls={12}
        />

        {/* Bowler */}
        <BowlerDisplay
          bowler={liveState.current_bowler}
          overs={18}
          runs={22}
          wickets={1}
          maidens={0}
          wides={2}
          noBalls={1}
        />

        {/* Over Progress */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Current Over</span>
              <span className="text-xs text-muted-foreground">Over {Math.floor((liveState.legal_balls || 0) / 6) + 1}</span>
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
    </div>
  );
}
