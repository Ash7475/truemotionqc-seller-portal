import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface LoginSplashTransitionProps {
  onComplete: () => void;
}

const luxuryEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const LoginSplashTransition: React.FC<LoginSplashTransitionProps> = ({ onComplete }) => {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const duration = shouldReduceMotion ? 380 : 1650;
    const timer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [onComplete, shouldReduceMotion]);

  if (shouldReduceMotion) {
    return (
      <motion.div
        key="reduced-splash"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 bg-[#360E1A] flex flex-col items-center justify-center overflow-hidden select-none pointer-events-none"
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="font-serif text-4xl font-medium text-[#FAF4EC] tracking-tight">
            TrueMotion QC
          </div>
          <span className="font-mono text-[10px] tracking-[0.25em] text-[#C4A46B] uppercase">
            OPENING SELLER ATELIER
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="cinematic-splash"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -12, scale: 1.02 }}
      transition={{ duration: 0.4, ease: luxuryEase }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#3E111F] via-[#360E1A] to-[#2C0A14] flex flex-col items-center justify-center overflow-hidden select-none pointer-events-auto"
    >
      {/* Champagne Gold Ambient Radial Glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1.15 }}
        transition={{ duration: 0.9, ease: luxuryEase }}
        className="absolute w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(196, 164, 107, 0.22) 0%, rgba(196, 164, 107, 0.06) 45%, rgba(44, 10, 20, 0) 72%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm px-6">
        {/* Double-Pillar Serif "T" Crest Reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, ease: luxuryEase }}
          className="w-20 h-20 rounded-2xl bg-white/[0.06] border border-[#C4A46B]/30 flex items-center justify-center shadow-2xl"
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d="M5 7H27"
              stroke="#E6D2B5"
              strokeWidth="2.1"
              strokeLinecap="square"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45, delay: 0.1, ease: luxuryEase }}
            />
            <motion.path
              d="M5 7V10.5M27 7V10.5"
              stroke="#C4A46B"
              strokeWidth="1.6"
              strokeLinecap="square"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.35, delay: 0.25, ease: luxuryEase }}
            />
            <motion.path
              d="M8.5 10H23.5"
              stroke="#C4A46B"
              strokeWidth="1"
              strokeOpacity="0.85"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.35, delay: 0.3, ease: luxuryEase }}
            />
            <motion.path
              d="M14.2 10V26M17.8 10V26"
              stroke="#E6D2B5"
              strokeWidth="1.8"
              strokeLinecap="square"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.32, ease: luxuryEase }}
            />
            <motion.path
              d="M11 26.5H21"
              stroke="#C4A46B"
              strokeWidth="1.8"
              strokeLinecap="square"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.35, delay: 0.55, ease: luxuryEase }}
            />
          </svg>
        </motion.div>

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.45, ease: luxuryEase }}
          className="pt-5 font-serif text-4xl sm:text-5xl font-medium text-[#FAF4EC] tracking-tight leading-none"
        >
          TrueMotion QC
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="pt-3 flex items-center justify-center gap-3 w-full"
        >
          <span className="h-px w-8 bg-[#C4A46B]/45" />
          <span className="font-mono text-[10px] uppercase tracking-[0.26em] font-semibold text-[#C4A46B]">
            SELLER ATELIER
          </span>
          <span className="h-px w-8 bg-[#C4A46B]/45" />
        </motion.div>

        {/* Champagne Gold Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.85, ease: luxuryEase }}
          className="pt-7 flex flex-col items-center space-y-2.5"
        >
          <div className="w-44 h-1 bg-white/15 rounded-full overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, delay: 0.85, ease: luxuryEase }}
              className="h-full w-full bg-[#C4A46B] origin-left rounded-full"
            />
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#DFC8BC]/75">
            ENTERING WORKSPACE
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};
