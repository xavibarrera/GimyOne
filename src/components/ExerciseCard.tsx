import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  GripVertical,
  Calculator,
  Check,
  History,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ExerciseDefinition, ExerciseSet, ExerciseHistoryRecord, WeekPhase } from '../types/workout';

interface ExerciseCardProps {
  exercise: ExerciseDefinition;
  sets: ExerciseSet[];
  lastRecord?: ExerciseHistoryRecord;
  currentWeek: WeekPhase;
  onUpdateSet: (setIndex: number, field: 'weightKg' | 'actualReps' | 'completed' | 'rpe', value: any) => void;
  onOpenPlateCalculator: (exerciseName: string, currentWeight: number, onApply: (w: number) => void) => void;
  onOpenHistory: (exerciseId: string) => void;
  onSetCompleted?: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  sets,
  lastRecord,
  currentWeek,
  onUpdateSet,
  onOpenPlateCalculator,
  onOpenHistory,
  onSetCompleted,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Suggested progressive weight based on last record
  const lastWeight = lastRecord?.weightKg ?? 0;
  const suggestedWeight = lastRecord ? (currentWeek >= 3 ? lastWeight + 2.5 : lastWeight) : 0;

  const handleApplyWeightToAll = (newWeight: number) => {
    sets.forEach((_, idx) => {
      onUpdateSet(idx, 'weightKg', newWeight);
    });
  };

  const completedSetsCount = sets.filter((s) => s.completed).length;
  const allCompleted = completedSetsCount === sets.length;

  return (
    <motion.div
      layout
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        allCompleted
          ? 'bg-zinc-900/60 border-emerald-500/30'
          : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700/80'
      } shadow-lg`}
    >
      {/* Exercise Card Header (tap to toggle collapse) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 pb-2.5 flex items-start justify-between gap-2 cursor-pointer select-none active:bg-zinc-850/50 transition-colors"
      >
        <div className="flex items-start gap-2.5 min-w-0">
          {/* Drag Handle */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-1 mt-0.5 text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing rounded-lg touch-none shrink-0"
            title="Arrastra para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                {exercise.pattern}
              </span>
              <span className="text-zinc-500 text-xs">·</span>
              <span className="text-[11px] font-mono-num text-zinc-400">
                {exercise.targetReps}
              </span>
              <span className="text-zinc-500 text-xs">·</span>
              <span className={`text-[10px] font-mono-num font-semibold ${allCompleted ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {completedSetsCount}/{sets.length} series
              </span>
              {lastRecord && (
                <>
                  <span className="text-zinc-500 text-xs">·</span>
                  <span className="text-[10px] font-mono-num text-amber-300 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Último: {lastRecord.weightKg} kg
                  </span>
                </>
              )}
              {exercise.isLiftOfTheMonth && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ★ Lift of Month
                </span>
              )}
            </div>

            <h4 className="text-base font-semibold text-white tracking-tight truncate mt-0.5">
              {exercise.name}
            </h4>
          </div>
        </div>

        {/* Quick Tools Header */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() =>
              onOpenPlateCalculator(exercise.name, sets[0]?.weightKg || lastWeight, (w) =>
                handleApplyWeightToAll(w)
              )
            }
            className="p-2 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800/60 active:scale-95 transition-all"
            title="Calculadora de discos / carga"
          >
            <Calculator className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenHistory(exercise.id)}
            className="p-2 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800/60 active:scale-95 transition-all"
            title="Historial de pesos"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 active:scale-95 transition-all"
            title={isExpanded ? 'Colapsar' : 'Expandir'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content: Last-Weight Banner, Notes, and Sets Table */}
      {isExpanded && (
        <div className="pt-1 border-t border-zinc-800/60">
          {/* QUICK LAST-WEIGHT RECALL BANNER (Crucial Feature) */}
          {lastRecord ? (
            <div className="mx-3.5 my-2.5 px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800/90 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <History className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                    Último peso registrado
                  </div>
                  <div className="text-xs font-semibold text-zinc-200 truncate">
                    <span className="text-amber-400 font-mono-num font-bold text-sm">
                      {lastRecord.weightKg} kg
                    </span>
                    <span className="text-zinc-500 font-normal ml-1.5 text-[11px]">
                      ({lastRecord.reps} reps · {lastRecord.date})
                    </span>
                  </div>
                </div>
              </div>

              {/* 1-Tap Weight Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleApplyWeightToAll(lastRecord.weightKg)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 active:scale-95 transition-all"
                  title="Copiar último peso en todas las series"
                >
                  Repetir
                </button>
                <button
                  onClick={() => handleApplyWeightToAll(lastRecord.weightKg + 2.5)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1 active:scale-95 transition-all"
                  title="Incrementar +2.5 kg para sobrecarga progresiva"
                >
                  <TrendingUp className="w-3 h-3" />
                  +2.5k
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-3.5 my-2.5 px-3 py-2 rounded-xl bg-zinc-950/50 border border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-400">
              <History className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>Sin carga previa registrada. Ingresa tu peso de hoy.</span>
            </div>
          )}

          {/* Note / Exercise Tip */}
          {exercise.notes && (
            <div className="px-3.5 mb-2 text-[11px] text-zinc-400 leading-snug">
              {exercise.notes}
            </div>
          )}

          {/* Collapsible Sets Table */}
          <div className="px-3.5 pb-3 pt-1 space-y-2">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
            <div className="col-span-2">Serie</div>
            <div className="col-span-4">Carga (kg)</div>
            <div className="col-span-3">Reps</div>
            <div className="col-span-3 text-right">Completar</div>
          </div>

          {/* Sets Rows */}
          {sets.map((set, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-all ${
                set.completed
                  ? 'bg-emerald-950/20 border border-emerald-500/20'
                  : 'bg-zinc-950/60 border border-zinc-800/60'
              }`}
            >
              {/* Set Label */}
              <div className="col-span-2 flex items-center">
                <span className="text-xs font-condensed font-bold text-zinc-400">
                  #{set.setNumber}
                </span>
              </div>

              {/* Weight Adjustment */}
              <div className="col-span-4 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSet(idx, 'weightKg', Math.max(0, (set.weightKg || 0) - 2.5))
                  }
                  className="w-6 h-7 rounded bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center text-xs font-bold active:scale-90 transition-transform"
                >
                  -
                </button>
                <input
                  type="number"
                  step="0.5"
                  value={set.weightKg === 0 ? '' : set.weightKg}
                  placeholder="0"
                  onChange={(e) =>
                    onUpdateSet(idx, 'weightKg', parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-transparent text-center font-mono-num font-bold text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 rounded"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSet(idx, 'weightKg', (set.weightKg || 0) + 2.5)
                  }
                  className="w-6 h-7 rounded bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center text-xs font-bold active:scale-90 transition-transform"
                >
                  +
                </button>
              </div>

              {/* Reps Adjustment */}
              <div className="col-span-3 flex items-center gap-1">
                <input
                  type="number"
                  value={set.actualReps === 0 ? '' : set.actualReps}
                  placeholder="10"
                  onChange={(e) =>
                    onUpdateSet(idx, 'actualReps', parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full bg-transparent text-center font-mono-num font-bold text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded"
                />
              </div>

              {/* Checkbox button */}
              <div className="col-span-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !set.completed;
                    onUpdateSet(idx, 'completed', nextState);
                    if (nextState && onSetCompleted) {
                      onSetCompleted();
                    }
                  }}
                  className={`w-9 h-8 rounded-lg flex items-center justify-center transition-all ${
                    set.completed
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 active:scale-90'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 active:scale-95'
                  }`}
                >
                  <Check className={`w-4 h-4 stroke-[3] ${set.completed ? 'opacity-100' : 'opacity-40'}`} />
                </button>
              </div>
            </div>
          ))}

          {/* Quick tactile slider for whole exercise load */}
          <div className="pt-2 px-1 flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider shrink-0">
              Ajuste rápido:
            </span>
            <div className="flex items-center gap-1 flex-1 overflow-x-auto py-0.5">
              {[-5, -2.5, -1, +1, +2.5, +5].map((delta) => (
                <button
                  key={delta}
                  onClick={() => {
                    sets.forEach((s, idx) => {
                      onUpdateSet(idx, 'weightKg', Math.max(0, (s.weightKg || lastWeight) + delta));
                    });
                  }}
                  className="px-2 py-0.5 text-[10px] font-mono-num rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 active:scale-95 shrink-0"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>
        </div>
        </div>
      )}
    </motion.div>
  );
};
