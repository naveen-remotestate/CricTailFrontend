import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatPlayerName } from "@/lib/utils";

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
  const batsmen = [
    { 
      user: striker, 
      runs: strikerRuns, 
      balls: strikerBalls, 
      isStriker: true 
    },
    { 
      user: nonStriker, 
      runs: nonStrikerRuns, 
      balls: nonStrikerBalls, 
      isStriker: false 
    }
  ].sort((a) => (a.isStriker ? -1 : 1)); // Always keep striker on top

  return (
    <Card className="overflow-hidden border-none shadow-md bg-card/50">
      <CardContent className="p-0">
        <div className="flex flex-col">
          <AnimatePresence mode="popLayout" initial={false}>
            {batsmen.map((b) => (
              <motion.div
                key={b.user?.user_id || (b.isStriker ? 'striker' : 'non-striker')}
                layout="position"
                initial={{ opacity: 0, y: b.isStriker ? -20 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`flex items-center justify-between px-4 py-3 ${
                  b.isStriker ? "bg-primary/5 border-b border-primary/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                      b.isStriker ? "bg-primary/20 border-primary/30 text-primary" : "bg-muted border-muted-foreground/10 text-muted-foreground"
                    }`}>
                      {b.user?.full_name?.charAt(0) || "?"}
                    </div>
                    {b.isStriker && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-1 -bottom-1 bg-primary text-[10px] p-0.5 rounded-full text-primary-foreground shadow-sm"
                      >
                        🏏
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold truncate max-w-[120px] ${b.isStriker ? "text-foreground" : "text-muted-foreground"}`}>
                      {formatPlayerName(b.user?.full_name)}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-black text-muted-foreground/60">
                      {b.isStriker ? "On Strike" : "Non-Striker"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                      <motion.span 
                        key={b.runs}
                        initial={b.isStriker ? { scale: 1.2, color: "var(--primary)" } : {}}
                        animate={{ scale: 1, color: "inherit" }}
                        className={`text-xl font-black ${b.isStriker ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {b.runs}
                      </motion.span>
                      <span className="text-[10px] font-bold text-muted-foreground/40">
                        ({b.balls})
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
