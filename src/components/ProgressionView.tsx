import React from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Award,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  Activity,
  Sparkles,
} from 'lucide-react';
import { WEEK_PHASES, LIFT_OF_THE_MONTH, ONE_WORKOUT_DAYS } from '../data/onePlanData';
import { WeekPhase, LiftOfTheMonth, DayWorkout } from '../types/workout';
import { getExerciseHistoryList, getSessionLogs } from '../services/storage';

interface ProgressionViewProps {
  currentWeek: WeekPhase;
  monthName?: string;
  liftOfTheMonth?: LiftOfTheMonth;
  workoutDays?: DayWorkout[];
  onSelectWeek: (week: WeekPhase) => void;
  onOpenPlateCalculator: (exerciseName: string, currentWeight: number) => void;
}

export const ProgressionView: React.FC<ProgressionViewProps> = ({
  currentWeek,
  monthName = 'OCTUBRE',
  liftOfTheMonth,
  workoutDays,
  onSelectWeek,
  onOpenPlateCalculator,
}) => {
  const lotm = liftOfTheMonth || LIFT_OF_THE_MONTH;
  const days = workoutDays && workoutDays.length > 0 ? workoutDays : ONE_WORKOUT_DAYS;

  const historyList = getExerciseHistoryList();
  const sessionLogs = getSessionLogs();

  // Lift of the month specific records
  const lotmRecords = historyList
    .filter((h) => h.exerciseId === lotm.exerciseId || h.exerciseId.includes(lotm.exerciseId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const currentTrapBarWeight = lotmRecords[lotmRecords.length - 1]?.weightKg || 0;
  const initialTrapBarWeight = lotmRecords[0]?.weightKg || 0;
  const deadliftDelta = currentTrapBarWeight - initialTrapBarWeight;

  // Estimated 1RM using Brzycki formula: Weight × (36 / (37 - reps))
  const lastRecord = lotmRecords[lotmRecords.length - 1];
  const estimated1RM = lastRecord && lastRecord.weightKg > 0
    ? Math.round(lastRecord.weightKg * (36 / (37 - (lastRecord.reps || 8))))
    : 0;

  // Movement patterns calculation
  const patternCounts: Record<string, number> = {
    sentadilla: 0,
    empuje: 0,
    traccion: 0,
    bisagra: 0,
    core: 0,
  };

  days.forEach((day) => {
    day.exercises.forEach((ex) => {
      if (patternCounts[ex.pattern] !== undefined) {
        patternCounts[ex.pattern] += 1;
      }
    });
  });

  const totalPatternExercises = Object.values(patternCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="pb-24 pt-3 px-4 max-w-xl mx-auto space-y-5">
      {/* View Title */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold uppercase tracking-wider">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Sistema de Progresión ONE</span>
        </div>
        <h2 className="text-2xl font-condensed font-extrabold text-white tracking-tight mt-0.5">
          Base · Control · Progresión
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Ciclo de 4 semanas enfocado en aumento de fuerza, técnica y sobrecarga planificada.
        </p>
      </div>

      {/* 4 WEEKS TIMELINE SELECTOR */}
      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
          <span>Fase del Bloque Mensual</span>
          <span className="text-amber-400">Toca para cambiar de semana</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {WEEK_PHASES.map((p) => {
            const isSelected = currentWeek === p.week;
            const isPast = p.week < currentWeek;

            return (
              <button
                key={p.week}
                onClick={() => onSelectWeek(p.week)}
                className={`p-2.5 rounded-2xl flex flex-col items-center text-center transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-[1.02]'
                    : isPast
                    ? 'bg-zinc-900 border border-emerald-500/30 text-zinc-300'
                    : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono-num font-bold">SEM {p.week}</span>
                  {isPast && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </div>
                <div
                  className={`text-sm font-condensed font-extrabold tracking-wide mt-1 ${
                    isSelected ? 'text-black' : 'text-zinc-100'
                  }`}
                >
                  {p.name}
                </div>
                <div
                  className={`text-[9px] font-medium mt-0.5 ${
                    isSelected ? 'text-black/80' : 'text-amber-400'
                  }`}
                >
                  {p.targetRpe}
                </div>
              </button>
            );
          })}
        </div>

        {/* Current Active Phase Description Card */}
        {(() => {
          const current = WEEK_PHASES.find((p) => p.week === currentWeek) || WEEK_PHASES[0];
          return (
            <motion.div
              key={current.week}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-condensed font-bold text-white tracking-wide">
                    Semana {current.week}: {current.name}
                  </span>
                  <span className="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400">
                    Objetivo: {current.targetRpe}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {current.description}
                </p>
              </div>
            </motion.div>
          );
        })()}
      </div>

      {/* LIFT OF THE MONTH CARD */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/30 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>{lotm.tagline || 'LIFT OF THE MONTH'}</span>
            </div>
            <h3 className="text-2xl font-condensed font-extrabold text-white tracking-wide mt-0.5">
              {lotm.name}
            </h3>
            <div className="text-xs text-zinc-400 mt-0.5">
              Rango objetivo: <span className="text-white font-mono-num font-semibold">{lotm.targetReps || '3 × 6-8 reps'}</span>
            </div>
          </div>

          <button
            onClick={() => onOpenPlateCalculator(lotm.name, currentTrapBarWeight)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/20"
          >
            Cargar Discos
          </button>
        </div>

        {/* Current Weight & Estimated 1RM */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          <div className="p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
            <div className="text-[10px] text-zinc-400 font-medium">PESO ACTUAL</div>
            <div className="text-2xl font-condensed font-extrabold text-white font-mono-num">
              {currentTrapBarWeight} <span className="text-xs text-zinc-400">kg</span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
            <div className="text-[10px] text-zinc-400 font-medium">1RM ESTIMADO</div>
            <div className="text-2xl font-condensed font-extrabold text-amber-400 font-mono-num">
              ~{estimated1RM} <span className="text-xs text-zinc-400">kg</span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
            <div className="text-[10px] text-zinc-400 font-medium">PROGRESIÓN</div>
            <div className="text-2xl font-condensed font-extrabold text-emerald-400 font-mono-num">
              {deadliftDelta >= 0 ? `+${deadliftDelta}` : deadliftDelta} <span className="text-xs text-zinc-400">kg</span>
            </div>
          </div>
        </div>

        {/* Coach tip for the month */}
        <div className="text-[11px] text-zinc-400 leading-snug p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
          💡 <span className="text-zinc-300 font-medium">Técnica clave:</span> {lotm.tips || LIFT_OF_THE_MONTH.tips}
        </div>
      </div>

      {/* MOVEMENT PATTERNS DISTRIBUTION */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Balance de Patrones Motores</span>
          </div>
          <span className="text-xs text-amber-400 font-mono-num font-semibold">
            5 Pilares ONE
          </span>
        </div>

        <div className="space-y-2">
          {Object.entries(patternCounts).map(([pattern, count]) => {
            const percent = Math.round((count / (totalPatternExercises || 1)) * 100);
            return (
              <div key={pattern} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize text-zinc-300 font-medium">{pattern}</span>
                  <span className="text-zinc-400 font-mono-num text-[11px]">
                    {count} ejercicios ({percent}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percent * 2}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ONE MANIFESTO / REGLAS GENERALES */}
      <div className="p-4 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
        <div className="text-xs font-condensed font-bold text-zinc-400 uppercase tracking-wider">
          Reglas del Entrenamiento ONE
        </div>
        <div className="grid grid-cols-1 gap-1.5 text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">✓</span> Da siempre tu 100% de esfuerzo enfocado.
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">✓</span> Cuida la técnica: la calidad siempre por delante de la carga.
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">✓</span> Respeta los tiempos de descanso entre series.
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">✓</span> Apoya a tu equipo y compañeros de sesión.
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">✓</span> Disfruta del proceso de superación diaria.
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800/60 text-center">
          <span className="text-xs font-condensed font-extrabold tracking-widest text-amber-400 uppercase">
            "Entrena con propósito, supérate cada día. #WEAREONE"
          </span>
        </div>
      </div>
    </div>
  );
};
