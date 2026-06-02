import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  shape: "rect" | "circle" | "triangle";
  angle: number;
  velocity: number;
  rotation: number;
  rotationSpeed: number;
}

const COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#eab308", // Yellow
  "#a855f7", // Purple
  "#22c55e", // Green
  "#f97316", // Orange
  "#ffffff", // White (for sparkle)
];

export function Confetti({ trigger, eventLabel, duration = 1500 }: { trigger: number; eventLabel?: string | null; duration?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    if (trigger > 0) {
      // Create a stadium-sized burst
      const newParticles = Array.from({ length: 150 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 15 + Math.random() * 25;
        return {
          id: Math.random() + i,
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 6 + Math.random() * 8,
          shape: (["rect", "circle", "triangle"] as const)[Math.floor(Math.random() * 3)],
          angle: angle,
          velocity: velocity,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 40,
        };
      });
      
      setParticles(newParticles);
      setShowLabel(true);
      
      const timer = setTimeout(() => {
        setParticles([]);
        setShowLabel(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden flex items-center justify-center">
      <AnimatePresence>
        {/* EVENT LABEL - HIGH IMPACT */}
        {showLabel && eventLabel && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={{ 
              scale: [0, 1.2, 1], 
              opacity: 1, 
              rotate: 0,
            }}
            exit={{ scale: 2, opacity: 0, filter: "blur(20px)" }}
            transition={{ duration: 0.4, ease: "backOut" }}
            className="relative z-[10000]"
          >
            <div className="relative">
              <h2 className={cn(
                "text-7xl sm:text-9xl font-black italic uppercase tracking-tighter text-center drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]",
                eventLabel === "WICKET!" ? "text-red-600" : 
                eventLabel === "SIXER!" ? "text-purple-600" : 
                "text-blue-600"
              )}>
                {eventLabel}
              </h2>
              {/* Secondary Glow */}
              <div className={cn(
                "absolute inset-0 blur-3xl opacity-40 -z-10",
                eventLabel === "WICKET!" ? "bg-red-500" : 
                eventLabel === "SIXER!" ? "bg-purple-500" : 
                "bg-blue-500"
              )} />
            </div>
          </motion.div>
        )}

        {/* PARTICLES */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              x: p.x - p.size / 2, // Center particle
              y: p.y - p.size / 2, 
              scale: 0, 
              rotate: p.rotation,
              opacity: 1 
            }}
            animate={{ 
              x: [
                p.x, 
                p.x + Math.cos(p.angle) * p.velocity * 10, // Initial burst
                p.x + Math.cos(p.angle) * p.velocity * 12 + (Math.random() - 0.5) * 50 // Drift
              ],
              y: [
                p.y, 
                p.y + Math.sin(p.angle) * p.velocity * 10 - 50, // Pop up
                window.innerHeight + 100 // Fall down
              ],
              scale: [0, 1, 1, 0.8, 0], 
              rotate: p.rotation + 500,
              opacity: [1, 1, 1, 1, 0]
            }}
            transition={{ 
              duration: 1 + Math.random() * 0.5, // Even faster particle duration
              ease: [0.23, 1, 0.32, 1] 
            }}
            className="fixed overflow-hidden top-0 left-0"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === "circle" ? "50%" : p.shape === "triangle" ? "0" : "2px",
              clipPath: p.shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : "none",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            }}
          >
            {/* Shimmer Effect on Particle */}
            <motion.div 
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="absolute inset-0 bg-white/40"
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Screen Flash */}
      <AnimatePresence>
        {showLabel && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-white z-[9998]"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
