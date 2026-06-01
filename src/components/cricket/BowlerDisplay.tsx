import { motion } from "framer-motion";
import type { User } from "@/types";
import { formatOvers, calculateRunRate, formatPlayerName } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

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
}: BowlerDisplayProps) {
  return (
    <Card className="overflow-hidden border-none shadow-md bg-card/50">
      <CardContent className="p-0">
        <motion.div
          layout="position"
          className="flex items-center justify-between px-4 py-3 bg-blue-500/5"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-blue-500/20 border-blue-500/30 text-blue-600">
                {bowler?.full_name?.charAt(0) || "?"}
              </div>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -bottom-1 bg-blue-600 text-[10px] p-0.5 rounded-full text-white shadow-sm"
              >
                ⚾
              </motion.div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm font-bold truncate max-w-[150px] text-foreground">
                {formatPlayerName(bowler?.full_name) || "Waiting..."}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-black text-blue-600/70">
                Current Bowler
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-1">
                <motion.span 
                  key={runs}
                  initial={{ scale: 1.2, color: "#2563eb" }}
                  animate={{ scale: 1, color: "inherit" }}
                  className="text-xl font-black text-foreground"
                >
                  {wickets}/{runs}
                </motion.span>
              </div>
              <div className="flex gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase">
                <span>{formatOvers(overs)} ovs</span>
                <span className="text-blue-500/40">|</span>
                <span>Econ {calculateRunRate(runs, overs)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
