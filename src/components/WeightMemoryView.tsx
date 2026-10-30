import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, History, Calculator, TrendingUp, Sparkles, Filter, Dumbbell } from 'lucide-react';
import { ONE_WORKOUT_DAYS } from '../data/onePlanData';
import { getExerciseHistoryList, saveExerciseHistoryRecord } from '../services/storage';
import { MovementPattern, ExerciseDefinition, DayWorkout } from '../types/workout';

interface WeightMemoryViewProps {
  workoutDays?: DayWorkout[];
  onOpenPlateCalculator: (exerciseName: string, currentWeight: number) => void;
}

export const WeightMemoryView: React.FC<WeightMemoryViewProps> = ({
  workoutDays,
  onOpenPlateCalculator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPattern, setSelectedPattern] = useState<MovementPattern | 'todos'>('todos');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newWeightInput, setNewWeightInput] = useState<string>('');
  const [newRepsInput, setNewRepsInput] = useState<string>('10');

  const days = workoutDays && workoutDays.length > 0 ? workoutDays : ONE_WORKOUT_DAYS;

  // Collect all unique exercises across the ONE plan
  const allExercises = useMemo(() => {
    const map = new Map<string, ExerciseDefinition>();
    days.forEach((day) => {
      day.exercises.forEach((ex) => {
        if (!map.has(ex.id)) {
          map.set(ex.id, ex);
        }
      });
    });
    return Array.from(map.values());
  }, [days]);

  const historyList = useMemo(() => getExerciseHistoryList(), [editingId]);

  // Map each exercise to its latest recorded history and records count
  const exercisesWithLatest = useMemo(() => {
    return allExercises.map((ex) => {
      const records = historyList
        .filter((h) => h.exerciseId === ex.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latest = records[0];
      const maxWeight = records.length > 0 ? Math.max(...records.map((r) => r.weightKg)) : 0;
      return {
        exercise: ex,
        latest,
        maxWeight,
        totalEntries: records.length,
      };
    });
  }, [allExercises, historyList]);

  // Filter exercises
  const filtered = useMemo(() => {
    return exercisesWithLatest.filter(({ exercise }) => {
      const matchesSearch =
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.pattern.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPattern = selectedPattern === 'todos' || exercise.pattern === selectedPattern;
      return matchesSearch && matchesPattern;
    });
  }, [exercisesWithLatest, searchQuery, selectedPattern]);

  const handleQuickLog = (exerciseId: string) => {
    const val = parseFloat(newWeightInput);
    if (!isNaN(val) && val > 0) {
      saveExerciseHistoryRecord({
        exerciseId,
        date: new Date().toISOString().split('T')[0],
        weightKg: val,
        reps: parseInt(newRepsInput, 10) || 10,
        week: 2,
      });
      setEditingId(null);
      setNewWeightInput('');
    }
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-xl mx-auto space-y-4">
      {/* Title Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold uppercase tracking-wider">
          <History className="w-3.5 h-3.5" />
          <span>Memoria Rápida de Pesos</span>
        </div>
        <h2 className="text-2xl font-condensed font-extrabold text-white tracking-tight mt-0.5">
          Consulta y Actualiza tus Cargas
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Recuerda al instante cuánto levantaste en tu última sesión sin rebuscar.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar ejercicio (ej. Trap Bar, Press, Hip Thrust...)"
          className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-amber-500/80 transition-colors"
        />
      </div>

      {/* Pattern Filter Tags */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(['todos', 'sentadilla', 'empuje', 'traccion', 'bisagra', 'core'] as const).map((pat) => (
          <button
            key={pat}
            onClick={() => setSelectedPattern(pat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize shrink-0 transition-colors ${
              selectedPattern === pat
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {pat}
          </button>
        ))}
      </div>

      {/* Exercise Cards List */}
      <div className="space-y-2.5">
        {filtered.map(({ exercise, latest, maxWeight, totalEntries }) => {
          const isEditing = editingId === exercise.id;
          const currentWeight = latest ? latest.weightKg : 0;

          return (
            <motion.div
              key={exercise.id}
              layout
              className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/80 transition-all shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                    <span className="text-amber-400">{exercise.pattern}</span>
                    <span>·</span>
                    <span>{exercise.equipment}</span>
                    {exercise.isLiftOfTheMonth && (
                      <span className="px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Lift of the month
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-white tracking-tight truncate mt-0.5">
                    {exercise.name}
                  </h3>
                </div>

                {/* Actions: Barbell calculator */}
                <button
                  onClick={() => onOpenPlateCalculator(exercise.name, currentWeight)}
                  className="p-2 text-zinc-400 hover:text-amber-400 rounded-lg bg-zinc-800/60 active:scale-95 transition-all shrink-0"
                  title="Ver desglose de discos"
                >
                  <Calculator className="w-4 h-4" />
                </button>
              </div>

              {/* Weight Highlight Box */}
              <div className="mt-2.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800/90 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    ÚLTIMA VEZ REGISTRADO
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-condensed font-extrabold text-amber-400 font-mono-num">
                      {currentWeight}
                    </span>
                    <span className="text-xs font-semibold text-zinc-400">kg</span>
                    {latest && (
                      <span className="text-xs text-zinc-400 ml-1.5 font-mono-num">
                        × {latest.reps} reps
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    RÉCORD PERSONAL
                  </div>
                  <div className="text-sm font-bold text-zinc-300 font-mono-num">
                    {maxWeight} kg
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {latest?.date ? `Fecha: ${latest.date}` : 'Preconfigurado'}
                  </div>
                </div>
              </div>

              {/* Inline Quick Update Drawer */}
              {isEditing ? (
                <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-zinc-400 block mb-1">Nuevo Peso (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newWeightInput}
                      onChange={(e) => setNewWeightInput(e.target.value)}
                      placeholder={currentWeight.toString()}
                      className="w-full bg-zinc-950 border border-zinc-700 text-sm font-mono-num font-bold text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] text-zinc-400 block mb-1">Reps</label>
                    <input
                      type="number"
                      value={newRepsInput}
                      onChange={(e) => setNewRepsInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 text-sm font-mono-num font-bold text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex items-end gap-1.5 pt-4">
                    <button
                      onClick={() => handleQuickLog(exercise.id)}
                      className="px-3 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 active:scale-95 transition-all"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2.5 py-1.5 bg-zinc-800 text-zinc-400 text-xs rounded-lg hover:bg-zinc-700 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setEditingId(exercise.id);
                      setNewWeightInput((currentWeight + 2.5).toString());
                    }}
                    className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 active:scale-95 transition-transform"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Actualizar nueva carga
                  </button>

                  <span className="text-[11px] text-zinc-500">
                    {totalEntries} registros guardados
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-500 text-sm">
            No se encontraron ejercicios con ese criterio.
          </div>
        )}
      </div>
    </div>
  );
};
