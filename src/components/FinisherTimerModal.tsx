import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, RotateCcw, Volume2, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinisherTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayTitle: string;
  finisher: {
    title: string;
    duration: string;
    format: string;
    details: string[];
    timerConfig?: {
      type: 'emom' | 'tabata' | 'amrap' | 'intervals';
      totalMinutes: number;
      workSeconds?: number;
      restSeconds?: number;
      rounds?: number;
    };
  };
}

export const FinisherTimerModal: React.FC<FinisherTimerModalProps> = ({
  isOpen,
  onClose,
  dayTitle,
  finisher,
}) => {
  const config = finisher.timerConfig || { type: 'amrap', totalMinutes: 6 };
  const totalSeconds = (config.totalMinutes || 6) * 60;

  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  const [intervalTimeLeft, setIntervalTimeLeft] = useState(config.workSeconds || 40);
  const [isFinished, setIsFinished] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = (freq = 800, duration = 0.15) => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback silent
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          setIsFinished(true);
          playBeep(1200, 0.4);
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          return 0;
        }

        // Interval / Tabata phase handling
        if (config.type === 'tabata' || config.type === 'intervals') {
          const workSec = config.workSeconds || 20;
          const restSec = config.restSeconds || 10;
          const totalRounds = config.rounds || 8;

          setIntervalTimeLeft((iPrev) => {
            if (iPrev <= 1) {
              if (isWorkPhase) {
                // Switch to Rest
                playBeep(600, 0.2);
                setIsWorkPhase(false);
                return restSec;
              } else {
                // Switch to next round Work
                playBeep(900, 0.25);
                setCurrentRound((r) => Math.min(totalRounds, r + 1));
                setIsWorkPhase(true);
                return workSec;
              }
            }
            if (iPrev <= 3) {
              playBeep(500, 0.08); // countdown 3-2-1
            }
            return iPrev - 1;
          });
        }

        // EMOM handling
        if (config.type === 'emom') {
          if ((totalSeconds - prev + 1) % 60 === 0) {
            playBeep(900, 0.3);
            setCurrentRound((r) => Math.min(config.totalMinutes, r + 1));
          }
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isWorkPhase, config, totalSeconds]);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
    setCurrentRound(1);
    setIsWorkPhase(true);
    setIntervalTimeLeft(config.workSeconds || 40);
    setIsFinished(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - timeLeft) / totalSeconds) * 100));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                Finisher Timer · {dayTitle}
              </span>
              <h3 className="text-xl font-condensed font-bold text-white tracking-wide">
                {finisher.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/50 active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Exercise Instructions Details */}
          <div className="my-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
            <div className="text-[11px] text-zinc-400 uppercase tracking-wide font-semibold mb-1.5 flex items-center justify-between">
              <span>{finisher.format}</span>
              <span className="text-amber-400">{finisher.duration}</span>
            </div>
            <div className="space-y-1">
              {finisher.details.map((item, idx) => (
                <div key={idx} className="text-xs text-zinc-300 flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold shrink-0">·</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Big Clock Dial */}
          <div className="my-4 py-8 px-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Phase pill if interval */}
            {(config.type === 'tabata' || config.type === 'intervals') && (
              <div
                className={`mb-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  isWorkPhase
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isWorkPhase ? '⚡ TRABAJO A TOPE' : '⏸ DESCANSO ACTIVO'} · Ronda {currentRound}/
                {config.rounds || 8}
              </div>
            )}

            {config.type === 'emom' && (
              <div className="mb-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
                Minuto {Math.floor((totalSeconds - timeLeft) / 60) + 1} de {config.totalMinutes} ·{' '}
                {(Math.floor((totalSeconds - timeLeft) / 60) + 1) % 2 !== 0 ? 'Kettlebell Swing' : 'Burpees'}
              </div>
            )}

            {/* Display time */}
            {config.type === 'tabata' || config.type === 'intervals' ? (
              <div className="flex flex-col items-center">
                <div className="text-7xl font-condensed font-extrabold text-white tracking-tighter font-mono-num">
                  {intervalTimeLeft}s
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Tiempo total restante: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                </div>
              </div>
            ) : (
              <div className="text-7xl font-condensed font-extrabold text-white tracking-tighter font-mono-num">
                {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
              </div>
            )}

            {/* Progress Bar */}
            <div className="w-full max-w-xs h-2 bg-zinc-800 rounded-full mt-5 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {isFinished && (
              <div className="mt-3 flex items-center gap-1.5 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                ¡Finisher completado con éxito!
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="p-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition-transform"
              title="Reiniciar"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                playBeep(800, 0.1);
                setIsRunning(!isRunning);
              }}
              className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform ${
                isRunning
                  ? 'bg-zinc-800 text-amber-400 border border-amber-500/40 hover:bg-zinc-700'
                  : 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/10'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" /> Pausar
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" /> {timeLeft === totalSeconds ? 'Comenzar Finisher' : 'Reanudar'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
