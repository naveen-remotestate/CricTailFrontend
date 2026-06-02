import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2800);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
        >
          {/* STADIUM LIGHT FLARE EFFECT */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div 
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-full max-w-[1200px] aspect-square bg-primary/10 rounded-full blur-[150px]" 
            />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-primary/5 to-transparent" />
          </div>

          {/* CRICKET BALL STREAK ANIMATION */}
          <motion.div
            initial={{ x: "-150%", y: "50%", rotate: -45, opacity: 0 }}
            animate={{ x: "150%", y: "-50%", opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="absolute h-[2px] w-[300px] bg-gradient-to-r from-transparent via-primary to-transparent z-0"
          />

          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotateX: 45 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* LOGO REVEAL */}
            <div className="relative mb-10">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                 className="absolute -inset-4 rounded-full border-2 border-t-primary border-transparent opacity-40"
               />
               
               <div className="relative h-36 w-36 rounded-full bg-card border-4 border-border flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary),0.1)] overflow-hidden">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.4 }}
                    className="relative"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-20 w-20 text-primary" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      {/* Minimalist Vertical Bat */}
                      <motion.g
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                      >
                         <path d="M12 2v4" strokeWidth="2.5" />
                         <path d="M10 6h4" />
                         <path d="M9 6h6v12c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2V6z" fill="currentColor" fillOpacity="0.05" />
                         <path d="M9 6h6v12c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2V6z" />
                      </motion.g>

                      {/* Still Ball */}
                      <motion.g
                        initial={{ scale: 0, x: 6, y: -2 }}
                        animate={{ scale: 1, x: 6, y: -2 }}
                        transition={{ delay: 1, type: "spring", stiffness: 200, damping: 12 }}
                      >
                        <circle cx="12" cy="14" r="3" fill="currentColor" />
                        <circle cx="12" cy="14" r="3" stroke="white" strokeWidth="0.5" />
                      </motion.g>
                    </svg>
                  </motion.div>
                  
                  <motion.div 
                    animate={{ top: ["-100%", "200%"] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
                    className="absolute left-0 right-0 h-10 bg-gradient-to-b from-transparent via-primary/20 to-transparent"
                  />
               </div>
            </div>

            {/* BRANDING */}
            <div className="relative text-center">
              <motion.div
                initial={{ letterSpacing: "0.5em", opacity: 0, y: 20 }}
                animate={{ letterSpacing: "0.05em", opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
              >
                <h1 className="text-7xl font-black uppercase italic tracking-tighter text-foreground">
                  Cric<span className="text-primary">Tale</span>
                </h1>
              </motion.div>
              
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 1, ease: "circOut" }}
                className="mt-6 h-1 w-40 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
              />
            </div>
          </motion.div>

          {/* BROADCAST FRAME */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ delay: 1.2 }}
            className="absolute inset-10 border border-foreground pointer-events-none rounded-3xl"
            style={{ maskImage: "radial-gradient(circle at center, transparent 60%, black 100%)" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
