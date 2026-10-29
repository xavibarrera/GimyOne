import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, TrendingUp, Calendar, Dumbbell } from 'lucide-react';
import { getExerciseHistoryList } from '../services/storage';
import { ONE_WORKOUT_DAYS } from '../data/onePlanData';

interface ExerciseHistoryModalProps {
  exerciseId: string | null;
  onClose: () => void;
  onOpenPlateCalculator: (exerciseName: string, weight: number) => void;
}

export const ExerciseHistoryModal: React.FC<ExerciseHistoryModalProps> = ({
  exerciseId,
  onClose,
  onOpenPlateCalculator,
}) => {
  if (!exerciseId) return null;

  // Find exercise details
  let exerciseName = exerciseId;
  let exercisePattern = '';
  for (const day of ONE_WORKOUT_DAYS) {
    const match = day.exercises.find((e) => e.id === exerciseId);
    if (match) {
      exerciseName = match.name;
      exercisePattern = match.pattern;
      break;
    }
  }

  const allRecords = getExerciseHistoryList()
    .filter((h) => h.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const maxWeight = allRecords.length > 0 ? Math.max(...allRecords.map((r) => r.weightKg)) : 0;
  const currentWeight = allRecords[0]?.weightKg || 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                Historial de Cargas · {exercisePattern}
              </span>
              <h3 className="text-xl font-condensed font-bold text-white tracking-wide truncate max-w-[280px]">
                {exerciseName}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/50 active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-2.5 my-3.5">
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                Última Carga
              </div>
              <div className="text-2xl font-condensed font-extrabold text-amber-400 font-mono-num mt-0.5">
                {currentWeight} <span className="text-xs text-zinc-400">kg</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                Récord Personal
              </div>
              <div className="text-2xl font-condensed font-extrabold text-emerald-400 font-mono-num mt-0.5">
                {maxWeight} <span className="text-xs text-zinc-400">kg</span>
              </div>
            </div>
          </div>

          {/* Timeline of logged sessions */}
          <div className="space-y-2 mt-1">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Registros Anteriores ({allRecords.length})
            </div>

            {allRecords.map((record, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 font-condensed font-bold text-xs font-mono-num">
                    #{allRecords.length - index}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white font-mono-num flex items-baseline gap-1">
                      <span className="text-base text-amber-400">{record.weightKg} kg</span>
                      <span className="text-zinc-400">× {record.reps} reps</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{record.date}</span>
                      <span>·</span>
                      <span>Semana {record.week}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenPlateCalculator(exerciseName, record.weightKg);
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Ver Discos
                </button>
              </div>
            ))}

            {allRecords.length === 0 && (
              <div className="text-center py-6 text-zinc-500 text-xs">
                Aún no hay registros guardados para este ejercicio.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
