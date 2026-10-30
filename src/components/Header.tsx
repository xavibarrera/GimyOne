import React from 'react';
import { Timer } from 'lucide-react';
import { WeekPhase } from '../types/workout';
import { WEEK_PHASES } from '../data/onePlanData';

interface HeaderProps {
  currentWeek: WeekPhase;
  monthName: string;
  onOpenRestTimer: () => void;
  onSelectWeek: (w: WeekPhase) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentWeek,
  monthName,
  onOpenRestTimer,
  onSelectWeek,
  onOpenSettings,
}) => {
  const currentPhase = WEEK_PHASES.find((p) => p.week === currentWeek) || WEEK_PHASES[1];

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 pt-safe">
      <div className="max-w-xl mx-auto h-14 px-4 flex items-center justify-between gap-3">
        {/* Zone 1: Brand Wordmark & Month Badge */}
        <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <span className="text-xl font-condensed font-black tracking-wider text-white">
            GIMY<span className="text-amber-400">ONE</span>
          </span>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-zinc-800 border-l border-zinc-700 ml-0.5 text-zinc-400 hover:text-amber-400 transition-colors"
            title="Ajustes de la rutina mensual"
          >
            <span className="text-[10px] font-condensed tracking-widest uppercase font-bold text-amber-400/90 hover:text-amber-300">
              {monthName}
            </span>
          </button>
        </div>

        {/* Zone 2: Current Week Phase Selector */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectWeek(((currentWeek % 4) + 1) as WeekPhase)}
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

        {/* Zone 3: Rest Timer */}
        <div className="flex items-center gap-1.5 shrink-0">
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

