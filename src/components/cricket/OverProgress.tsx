import { motion } from "framer-motion";

interface OverProgressProps {
  balls: Array<{
    runs: number;
    isWicket?: boolean;
    isWide?: boolean;
    isNoBall?: boolean;
    isBoundary?: boolean;
    isSix?: boolean;
    isDot?: boolean;
  }>;
  currentBall: number;
}

export function OverProgress({ balls, currentBall }: OverProgressProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 6 }).map((_, i) => {
        const ball = balls[i];
        const isCurrent = i === currentBall - 1;

        return (
          <motion.div
            key={i}
            initial={isCurrent ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
              ball?.isWicket
                ? "bg-cricket-red/20 text-cricket-red"
                : ball?.isSix
                ? "bg-purple-500/20 text-purple-500"
                : ball?.isBoundary
                ? "bg-cricket-red/10 text-cricket-red"
                : ball?.isWide || ball?.isNoBall
                ? "bg-yellow-500/20 text-yellow-500"
                : ball?.isDot
                ? "bg-muted text-muted-foreground"
                : ball
                ? "bg-cricket-silver/20 text-foreground"
                : "bg-muted/50 text-muted-foreground"
            } ${isCurrent ? "ring-2 ring-cricket-red ring-offset-1" : ""}`}
          >
            {ball?.isWicket ? "W" : ball?.isWide ? `${ball.runs + 1}wd` : ball?.isNoBall ? `${ball.runs + 1}nb` : ball?.isDot ? "0" : ball?.runs ?? ""}
          </motion.div>
        );
      })}
    </div>
  );
}
