import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Plus, Minus, X, Check } from 'lucide-react';

interface RestTimerOverlayProps {
  initialSeconds?: number;
  isActive: boolean;
  onClose: () => void;
}

export const RestTimerOverlay: React.FC<RestTimerOverlayProps> = ({
  initialSeconds = 90,
  isActive,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setIsPaused(false);
  }, [initialSeconds, isActive]);

  useEffect(() => {
    if (!isActive || isPaused) return;

    if (secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isPaused, secondsLeft]);

  if (!isActive) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isDone = secondsLeft === 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-40 bg-zinc-900/95 border border-zinc-700/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDone
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-bounce'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <Timer className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              {isDone ? '¡LISTO PARA LA SIGUIENTE!' : 'TIEMPO DE DESCANSO'}
            </div>
            <div className="text-xl font-condensed font-extrabold text-white tracking-tight font-mono-num">
              {mins}:{secs < 10 ? `0${secs}` : secs}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!isDone && (
            <>
              <button
                onClick={() => setSecondsLeft((s) => Math.max(10, s - 15))}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white active:scale-95 transition-transform"
                title="-15s"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSecondsLeft((s) => s + 15)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white active:scale-95 transition-transform"
                title="+15s"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white active:scale-95 transition-transform ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
