import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'motion/react';
import {
  Flame,
  Clock,
  Sparkles,
  CheckCircle2,
  Play,
  RotateCcw,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Save,
  Timer,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ONE_WORKOUT_DAYS, WEEK_PHASES } from '../data/onePlanData';
import {
  DayWorkout,
  ExerciseDefinition,
  ExerciseSet,
  WeekPhase,
  SessionLog,
} from '../types/workout';
import { ExerciseCard } from './ExerciseCard';
import {
  getLastExerciseRecord,
  saveSessionLog,
  getCustomExerciseOrder,
  setCustomExerciseOrder,
} from '../services/storage';

interface WorkoutViewProps {
  selectedDayId: string;
  onSelectDay: (dayId: string) => void;
  currentWeek: WeekPhase;
  onOpenPlateCalculator: (exerciseName: string, currentWeight: number, onApply?: (w: number) => void) => void;
  onOpenHistory: (exerciseId: string) => void;
  onOpenFinisherTimer: (dayTitle: string, finisher: DayWorkout['finisher']) => void;
  onTriggerRestTimer: (seconds?: number) => void;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  selectedDayId,
  onSelectDay,
  currentWeek,
  onOpenPlateCalculator,
  onOpenHistory,
  onOpenFinisherTimer,
  onTriggerRestTimer,
}) => {
  const currentDay = ONE_WORKOUT_DAYS.find((d) => d.id === selectedDayId) || ONE_WORKOUT_DAYS[0];

  // Reorderable exercises state
  const [exercisesOrder, setExercisesOrder] = useState<ExerciseDefinition[]>(() => {
    const savedOrderIds = getCustomExerciseOrder(currentDay.id);
    if (!savedOrderIds) return currentDay.exercises;
    // Map in saved order, then append any missing
    const ordered: ExerciseDefinition[] = [];
    savedOrderIds.forEach((id) => {
      const match = currentDay.exercises.find((e) => e.id === id);
      if (match) ordered.push(match);
    });
    currentDay.exercises.forEach((e) => {
      if (!ordered.some((o) => o.id === e.id)) ordered.push(e);
    });
    return ordered;
  });

  // Keep track of sets per exercise
  const [setsState, setSetsState] = useState<Record<string, ExerciseSet[]>>({});

  // Mobility & activation check states
  const [mobilityOpen, setMobilityOpen] = useState(false);
  const [completedMobility, setCompletedMobility] = useState<Record<string, boolean>>({});
  const [completedActivation, setCompletedActivation] = useState<Record<string, boolean>>({});

  // Session duration timer
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(true);

  // Initialize sets for current day's exercises
  useEffect(() => {
    const savedOrderIds = getCustomExerciseOrder(currentDay.id);
    let initialList = currentDay.exercises;
    if (savedOrderIds) {
      const ordered: ExerciseDefinition[] = [];
      savedOrderIds.forEach((id) => {
        const match = currentDay.exercises.find((e) => e.id === id);
        if (match) ordered.push(match);
      });
      currentDay.exercises.forEach((e) => {
        if (!ordered.some((o) => o.id === e.id)) ordered.push(e);
      });
      initialList = ordered;
    }
    setExercisesOrder(initialList);

    // Initialize set objects
    const newSets: Record<string, ExerciseSet[]> = {};
    initialList.forEach((ex) => {
      const lastRecord = getLastExerciseRecord(ex.id);
      const defaultWeight = lastRecord?.weightKg ?? 0;

      newSets[ex.id] = Array.from({ length: ex.targetSets }).map((_, i) => ({
        setNumber: i + 1,
        weightKg: defaultWeight,
        targetReps: ex.targetReps,
        actualReps: lastRecord?.reps || 10,
        completed: false,
        rpe: 7,
      }));
    });
    setSetsState(newSets);
  }, [currentDay.id]);

  // Session timer ticker
  useEffect(() => {
    if (!sessionStarted) return;
    const interval = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStarted]);

  // Handle reorder
  const handleReorder = (newOrder: ExerciseDefinition[]) => {
    setExercisesOrder(newOrder);
    setCustomExerciseOrder(
      currentDay.id,
      newOrder.map((e) => e.id)
    );
  };

  const updateSetField = (
    exerciseId: string,
    setIndex: number,
    field: 'weightKg' | 'actualReps' | 'completed' | 'rpe',
    value: any
  ) => {
    setSetsState((prev) => {
      const exerciseSets = prev[exerciseId] || [];
      const updated = [...exerciseSets];
      if (updated[setIndex]) {
        updated[setIndex] = { ...updated[setIndex], [field]: value };
      }
      return { ...prev, [exerciseId]: updated };
    });
  };

  const handleFinishWorkout = () => {
    // Collect summary
    const loggedExercises = exercisesOrder.map((ex) => {
      const exSets = setsState[ex.id] || [];
      const completedSets = exSets.filter((s) => s.completed);
      const bestWeight = completedSets.length > 0 ? Math.max(...completedSets.map((s) => s.weightKg)) : 0;
      const totalVol = completedSets.reduce((sum, s) => sum + s.weightKg * s.actualReps, 0);

      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: exSets,
        bestWeightKg: bestWeight,
        totalVolumeKg: totalVol,
      };
    });

    const session: SessionLog = {
      id: `session_${Date.now()}`,
      dayId: currentDay.id,
      dayTitle: currentDay.dayTitle,
      date: new Date().toISOString().split('T')[0],
      week: currentWeek,
      durationMinutes: Math.max(1, Math.round(sessionSeconds / 60)),
      exercisesLogged: loggedExercises,
    };

    saveSessionLog(session);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 },
    });
  };

  const activePhase = WEEK_PHASES.find((p) => p.week === currentWeek) || WEEK_PHASES[1];
  const totalSetsCount = Object.values(setsState).reduce((acc, curr) => acc + curr.length, 0);
  const completedSetsTotal = Object.values(setsState).reduce(
    (acc, curr) => acc + curr.filter((s) => s.completed).length,
    0
  );
  const sessionProgress = totalSetsCount > 0 ? Math.round((completedSetsTotal / totalSetsCount) * 100) : 0;

  const sessionMins = Math.floor(sessionSeconds / 60);
  const sessionSecs = sessionSeconds % 60;

  return (
    <div className="pb-28 pt-2 px-4 max-w-xl mx-auto space-y-4">
      {/* 5 DAYS SELECTOR (LUNES A VIERNES) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {ONE_WORKOUT_DAYS.map((day) => {
          const isSelected = day.id === selectedDayId;
          return (
            <button
              key={day.id}
              onClick={() => onSelectDay(day.id)}
              className={`py-2 px-3.5 rounded-xl flex flex-col items-center shrink-0 transition-all ${
                isSelected
                  ? 'bg-amber-500 text-black font-extrabold shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider">
                {day.dayName.slice(0, 3)}
              </span>
              <span className="text-xs font-condensed tracking-tight truncate max-w-[80px]">
                {day.dayTitle.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* DAY HERO HEADER */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-condensed font-extrabold text-amber-400 tracking-wider uppercase">
                {currentDay.dayName}
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-[11px] font-semibold text-zinc-400">
                Semana {currentWeek}: {activePhase.name}
              </span>
            </div>
            <h2 className="text-2xl font-condensed font-extrabold text-white tracking-tight mt-0.5">
              {currentDay.dayTitle}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 leading-snug">
              {currentDay.subtitle}
            </p>
          </div>

          {/* Session Timer & Progress */}
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-[11px] font-mono-num text-zinc-400 justify-end">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>
                {sessionMins}:{sessionSecs < 10 ? `0${sessionSecs}` : sessionSecs}
              </span>
            </div>
            <div className="text-xs font-condensed font-bold text-amber-400 mt-0.5 font-mono-num">
              {completedSetsTotal}/{totalSetsCount} series ({sessionProgress}%)
            </div>
          </div>
        </div>

        {/* Coaching tip banner from the board */}
        <div className="mt-3 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-[11px] text-zinc-300 flex items-start gap-2">
          <span className="text-amber-400 font-bold shrink-0">COACHING TIP:</span>
          <span className="italic">{currentDay.coachingTip}</span>
        </div>
      </div>

      {/* MOVILIDAD & ACTIVACIÓN ACCORDION */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/80 overflow-hidden">
        <button
          onClick={() => setMobilityOpen(!mobilityOpen)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-850 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-condensed font-bold text-white tracking-wide">
                Movilidad & Activación (8-10')
              </div>
              <div className="text-[10px] text-zinc-400">
                {currentDay.mobility.length} ejercicios de cadera, tobillo y core
              </div>
            </div>
          </div>
          <div className="p-1 text-zinc-400">
            {mobilityOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {mobilityOpen && (
          <div className="p-3.5 pt-0 border-t border-zinc-800/60 space-y-3">
            {/* Movilidad */}
            <div>
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Movilidad Articular
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {currentDay.mobility.map((m, idx) => {
                  const isDone = !!completedMobility[`${currentDay.id}_m_${idx}`];
                  return (
                    <button
                      key={idx}
                      onClick={() =>
                        setCompletedMobility((prev) => ({
                          ...prev,
                          [`${currentDay.id}_m_${idx}`]: !isDone,
                        }))
                      }
                      className={`p-2 rounded-xl text-left text-xs flex items-center gap-2 border transition-colors ${
                        isDone
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-zinc-300'
                          : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isDone ? 'text-emerald-400' : 'text-zinc-600'
                        }`}
                      />
                      <span className="truncate">{m}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activación */}
            <div>
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Activación Dinámica (8')
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {currentDay.activation.map((a, idx) => {
                  const isDone = !!completedActivation[`${currentDay.id}_a_${idx}`];
                  return (
                    <button
                      key={idx}
                      onClick={() =>
                        setCompletedActivation((prev) => ({
                          ...prev,
                          [`${currentDay.id}_a_${idx}`]: !isDone,
                        }))
                      }
                      className={`p-2 rounded-xl text-left text-xs flex items-center gap-2 border transition-colors ${
                        isDone
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-zinc-300'
                          : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isDone ? 'text-emerald-400' : 'text-zinc-600'
                        }`}
                      />
                      <span className="truncate">{a}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EXERCISES HEADER & DRAG HINT */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-xs font-condensed font-bold text-zinc-300 uppercase tracking-wider">
          Bloque de Fuerza ({exercisesOrder.length} Ejercicios)
        </div>
        <div className="text-[10px] text-zinc-500 flex items-center gap-1">
          <span>Arrastra</span>
          <span className="text-amber-400 font-semibold">⋮⋮</span>
          <span>para reordenar</span>
        </div>
      </div>

      {/* REORDERABLE EXERCISES LIST (Drag & Drop) */}
      <Reorder.Group
        axis="y"
        values={exercisesOrder}
        onReorder={handleReorder}
        className="space-y-3"
      >
        {exercisesOrder.map((exercise) => {
          const lastRecord = getLastExerciseRecord(exercise.id);
          const currentSets = setsState[exercise.id] || [];

          return (
            <Reorder.Item
              key={exercise.id}
              value={exercise}
              className="touch-none"
            >
              <ExerciseCard
                exercise={exercise}
                sets={currentSets}
                lastRecord={lastRecord}
                currentWeek={currentWeek}
                onUpdateSet={(setIndex, field, val) =>
                  updateSetField(exercise.id, setIndex, field, val)
                }
                onOpenPlateCalculator={(name, weight, applyFn) => {
                  onOpenPlateCalculator(name, weight, applyFn);
                }}
                onOpenHistory={onOpenHistory}
                onSetCompleted={() => onTriggerRestTimer(90)}
              />
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      {/* FINISHER & CARDIO TRIGGER CARD */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 shadow-lg">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Finisher Cardio
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-[11px] font-mono-num text-zinc-400">
              {currentDay.finisher.duration}
            </span>
          </div>
          <h3 className="text-lg font-condensed font-bold text-white tracking-tight truncate mt-0.5">
            {currentDay.finisher.title}
          </h3>
          <p className="text-xs text-zinc-400 truncate">
            {currentDay.finisher.format}
          </p>
        </div>

        <button
          onClick={() => onOpenFinisherTimer(currentDay.dayTitle, currentDay.finisher)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 shrink-0 active:scale-95 transition-all shadow-md shadow-amber-500/10"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Lanzar Timer
        </button>
      </div>

      {/* FINISH WORKOUT BUTTON */}
      <div className="pt-2">
        <button
          onClick={handleFinishWorkout}
          className="w-full py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-amber-500/40 text-amber-400 font-condensed font-bold text-base flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-transform"
        >
          <Save className="w-4 h-4" />
          Guardar y Cerrar Sesión del Día
        </button>
      </div>
    </div>
  );
};
