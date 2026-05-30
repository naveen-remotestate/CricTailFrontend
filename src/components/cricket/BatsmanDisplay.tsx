import { motion } from "framer-motion";
import type { User } from "@/types";

interface BatsmanDisplayProps {
  striker?: User;
  nonStriker?: User;
  strikerRuns?: number;
  strikerBalls?: number;
  nonStrikerRuns?: number;
  nonStrikerBalls?: number;
}

export function BatsmanDisplay({
  striker,
  nonStriker,
  strikerRuns = 0,
  strikerBalls = 0,
  nonStrikerRuns = 0,
  nonStrikerBalls = 0,
}: BatsmanDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div
        layout
        className="rounded-xl border-2 border-primary bg-primary/5 p-3"
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {striker?.full_name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{striker?.full_name}</p>
            <p className="text-xs text-primary">* Striker</p>
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <motion.span
            key={strikerRuns}
            initial={{ scale: 1.3, color: "#22c55e" }}
            animate={{ scale: 1, color: "inherit" }}
            className="text-2xl font-bold"
          >
            {strikerRuns}
          </motion.span>
          <span className="text-xs text-muted-foreground">({strikerBalls})</span>
        </div>
      </motion.div>

      <motion.div
        layout
        className="rounded-xl border border-border bg-card p-3"
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
            {nonStriker?.full_name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{nonStriker?.full_name}</p>
            <p className="text-xs text-muted-foreground">Non-striker</p>
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold">{nonStrikerRuns}</span>
          <span className="text-xs text-muted-foreground">({nonStrikerBalls})</span>
        </div>
      </motion.div>
    </div>
  );
}
