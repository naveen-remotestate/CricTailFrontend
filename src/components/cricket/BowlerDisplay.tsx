import { motion } from "framer-motion";
import type { User } from "@/types";
import { formatOvers, calculateRunRate } from "@/lib/utils";

interface BowlerDisplayProps {
  bowler?: User;
  overs: number;
  runs: number;
  wickets: number;
  maidens?: number;
  wides?: number;
  noBalls?: number;
}

export function BowlerDisplay({
  bowler,
  overs,
  runs,
  wickets,
  maidens = 0,
  wides = 0,
  noBalls = 0,
}: BowlerDisplayProps) {
  return (
    <motion.div
      layout
      className="rounded-xl border border-border bg-card p-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-cricket-green/20 flex items-center justify-center text-xs font-bold text-cricket-green">
            {bowler?.full_name?.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold">{bowler?.full_name}</p>
            <p className="text-xs text-muted-foreground">Current Bowler</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">
            {wickets}/{runs}
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>O: {formatOvers(overs)}</span>
        <span>M: {maidens}</span>
        <span>Econ: {calculateRunRate(runs, overs)}</span>
        {(wides > 0 || noBalls > 0) && (
          <span className="text-yellow-500">
            {wides > 0 && `${wides}wd`} {noBalls > 0 && `${noBalls}nb`}
          </span>
        )}
      </div>
    </motion.div>
  );
}
