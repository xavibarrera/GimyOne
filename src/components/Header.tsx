import React from 'react';
import { Flame, Timer, Sparkles } from 'lucide-react';
import { WeekPhase } from '../types/workout';
import { WEEK_PHASES } from '../data/onePlanData';

interface HeaderProps {
  currentWeek: WeekPhase;
  onOpenRestTimer: () => void;
  onSelectWeek: (w: WeekPhase) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentWeek,
  onOpenRestTimer,
  onSelectWeek,
}) => {
  const currentPhase = WEEK_PHASES.find((p) => p.week === currentWeek) || WEEK_PHASES[1];

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 pt-safe">
      <div className="max-w-xl mx-auto h-14 px-4 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <span className="text-xl font-condensed font-black tracking-wider text-white">
            GIMY<span className="text-amber-400">ONE</span>
          </span>
          <span className="text-[10px] font-condensed tracking-widest text-zinc-500 uppercase border-l border-zinc-700 pl-1.5 ml-0.5">
            OCTUBRE
          </span>
        </div>

        {/* Zone 2: Current Week Phase Selector */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectWeek((currentWeek % 4 + 1) as WeekPhase)}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs flex items-center gap-1.5 transition-colors"
            title="Cambiar fase semanal"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="font-condensed font-bold text-zinc-200">
              SEM {currentWeek}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">
              {currentPhase.name}
            </span>
          </button>
        </div>

        {/* Zone 3: Quick Rest Timer Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenRestTimer}
            className="p-2 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-900 active:scale-95 transition-all flex items-center gap-1"
            title="Temporizador de descanso"
          >
            <Timer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
