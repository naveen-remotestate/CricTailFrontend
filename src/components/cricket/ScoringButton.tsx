import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoringButtonProps {
  label: string;
  sublabel?: string;
  onClick: () => void;
  variant?: "default" | "wicket" | "extra" | "boundary" | "six" | "dot";
  className?: string;
  disabled?: boolean;
}

const variantStyles = {
  default: "bg-card border-2 border-border hover:border-cricket-red/50 hover:bg-cricket-red/5 active:bg-cricket-red/10",
  wicket: "bg-cricket-red/10 border-2 border-cricket-red/30 hover:bg-cricket-red/20 hover:border-cricket-red/50 active:bg-cricket-red/30 text-cricket-red",
  extra: "bg-yellow-500/10 border-2 border-yellow-500/30 hover:bg-yellow-500/20 hover:border-yellow-500/50 active:bg-yellow-500/30 text-yellow-600",
  boundary: "bg-cricket-red/10 border-2 border-cricket-red/30 hover:bg-cricket-red/20 hover:border-cricket-red/50 active:bg-cricket-red/30 text-cricket-red",
  six: "bg-purple-500/10 border-2 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 active:bg-purple-500/30 text-purple-600",
  dot: "bg-muted/50 border-2 border-border hover:border-cricket-silverDark/50 active:bg-muted",
};

export function ScoringButton({
  label,
  sublabel,
  onClick,
  variant = "default",
  className,
  disabled,
}: ScoringButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl p-4 transition-colors no-select",
        variantStyles[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className="text-2xl font-bold">{label}</span>
      {sublabel && <span className="text-xs opacity-70 mt-0.5">{sublabel}</span>}
    </motion.button>
  );
}
