import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoringButtonProps {
  label: string;
  sublabel?: string;
  onClick: () => void;
  variant?: "default" | "wicket" | "extra" | "boundary" | "six" | "dot" | "undo" | "retired";
  className?: string;
  disabled?: boolean;
}

const variantStyles = {
  default: "bg-card border-2 border-border hover:border-cricket-red/50 hover:bg-cricket-red/5 active:bg-cricket-red/10",
  wicket: "bg-cricket-red/10 border-2 border-cricket-red/30 hover:bg-cricket-red/20 hover:border-cricket-red/50 active:bg-cricket-red/30 text-cricket-red",
  extra: "bg-yellow-500/10 border-2 border-yellow-500/30 hover:bg-yellow-500/20 hover:border-yellow-500/50 active:bg-yellow-500/30 text-yellow-600",
  boundary: "bg-cricket-blue/10 border-2 border-cricket-blue/30 hover:bg-cricket-blue/20 hover:border-cricket-blue/50 active:bg-cricket-blue/30 text-cricket-blue",
  six: "bg-purple-500/10 border-2 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 active:bg-purple-500/30 text-purple-600",
  dot: "bg-muted/50 border-2 border-border hover:border-cricket-silverDark/50 active:bg-muted",
  undo: "bg-muted/10 border-2 border-border hover:bg-muted/20 active:bg-muted/30 text-muted-foreground",
  retired: "bg-orange-500/10 border-2 border-orange-500/30 hover:bg-orange-500/20 hover:border-orange-500/50 active:bg-orange-500/30 text-orange-600",
};

export function ScoringButton({
  label,
  sublabel,
  onClick,
  variant = "default",
  className,
  disabled,
}: ScoringButtonProps) {
  const isLongLabel = label.length > 3;

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl p-2 sm:p-4 transition-colors no-select min-h-[70px]",
        variantStyles[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className={cn(
        "font-black leading-none tracking-tighter",
        isLongLabel ? "text-sm sm:text-base" : "text-xl sm:text-2xl"
      )}>
        {label}
      </span>
      {sublabel && (
        <span className="text-[9px] sm:text-[10px] font-black uppercase opacity-60 mt-1 tracking-widest whitespace-nowrap">
          {sublabel}
        </span>
      )}
    </motion.button>
  );
}
