import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  CheckCircle2,
  Trash2,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import { getSessionLogs, deleteSessionLog } from '../services/storage';
import { SessionLog } from '../types/workout';

interface SessionHistoryCalendarViewProps {
  onGoToWorkout: (dayId?: string) => void;
  onOpenPlateCalculator?: (name: string, weight: number) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const SessionHistoryCalendarView: React.FC<SessionHistoryCalendarViewProps> = ({
  onGoToWorkout,
  onOpenPlateCalculator,
}) => {
  // Today's date reference
  const today = useMemo(() => new Date(), []);
  const todayIso = today.toISOString().split('T')[0];

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-11
  const [selectedDateIso, setSelectedDateIso] = useState<string>(todayIso);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Retrieve all logged sessions
  const sessionLogs = useMemo(() => {
    return getSessionLogs();
  }, [refreshKey]);

  // Map dates to sessions (YYYY-MM-DD -> SessionLog[])
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, SessionLog[]>();
    sessionLogs.forEach((log) => {
      const existing = map.get(log.date) || [];
      existing.push(log);
      map.set(log.date, existing);
    });
    return map;
  }, [sessionLogs]);

  // Compute days in current month view
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // 0 = Monday, 6 = Sunday

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateIso(todayIso);
  };

  // Sessions for the currently selected date
  const selectedDaySessions = useMemo(() => {
    return sessionsByDate.get(selectedDateIso) || [];
  }, [sessionsByDate, selectedDateIso]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthlyLogs = sessionLogs.filter((s) => s.date.startsWith(monthPrefix));
    const totalVolume = monthlyLogs.reduce((sum, log) => {
      return (
        sum +
        log.exercisesLogged.reduce((eSum, ex) => eSum + (ex.totalVolumeKg || 0), 0)
      );
    }, 0);

    return {
      totalSessions: monthlyLogs.length,
      totalVolumeKg: totalVolume,
    };
  }, [sessionLogs, currentYear, currentMonth]);

  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este registro de sesión?')) {
      deleteSessionLog(sessionId);
      setRefreshKey((k) => k + 1);
    }
  };

  // Format selected date nicely
  const formattedSelectedDate = useMemo(() => {
    const [year, month, day] = selectedDateIso.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedDateIso]);

  return (
    <div className="pb-28 pt-2 px-4 max-w-xl mx-auto space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold uppercase tracking-wider">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Histórico de Sesiones</span>
          </div>
          <h2 className="text-2xl font-condensed font-extrabold text-white tracking-tight mt-0.5">
            Calendario de Entrenamientos
          </h2>
        </div>

        <button
          onClick={handleToday}
          className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold text-zinc-300 hover:text-amber-400 transition-colors"
        >
          Hoy
        </button>
      </div>

      {/* MONTHLY SUMMARY METRICS STRIP */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800/90 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
              Sesiones {MONTH_NAMES[currentMonth]}
            </div>
            <div className="text-2xl font-condensed font-extrabold text-white font-mono-num">
              {monthlyStats.totalSessions}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800/90 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
              Volumen Total
            </div>
            <div className="text-2xl font-condensed font-extrabold text-amber-400 font-mono-num">
              {monthlyStats.totalVolumeKg.toLocaleString()} <span className="text-xs text-zinc-400">kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* CALENDAR CONTAINER */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-3">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-base font-condensed font-extrabold text-white uppercase tracking-wider">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday Labels (Lun - Dom) */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          {WEEKDAY_NAMES.map((w, idx) => (
            <div key={idx} className="py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty spacer cells before 1st day of month */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
              dayNum
            ).padStart(2, '0')}`;
            const hasSession = sessionsByDate.has(dateStr);
            const isSelected = selectedDateIso === dateStr;
            const isToday = dateStr === todayIso;

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDateIso(dateStr)}
                className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-amber-500 text-black font-extrabold shadow-md shadow-amber-500/20 ring-2 ring-amber-400'
                    : hasSession
                    ? 'bg-zinc-800/90 text-white font-bold border border-amber-500/40 hover:bg-zinc-800'
                    : isToday
                    ? 'bg-zinc-950 text-amber-400 font-bold border border-zinc-700'
                    : 'bg-zinc-950/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <span className="text-xs font-mono-num">{dayNum}</span>

                {/* Session indicator dot */}
                {hasSession && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected ? 'bg-black' : 'bg-amber-400'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED DAY DETAILS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
              DETALLE DEL DÍA
            </div>
            <h3 className="text-base font-condensed font-bold text-white capitalize">
              {formattedSelectedDate}
            </h3>
          </div>

          {selectedDaySessions.length > 0 && (
            <span className="text-xs font-mono-num px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {selectedDaySessions.length} sesión{selectedDaySessions.length > 1 ? 'es' : ''}
            </span>
          )}
        </div>

        {/* Sessions list for this day */}
        {selectedDaySessions.length > 0 ? (
          selectedDaySessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3 shadow-lg"
            >
              {/* Session Header */}
              <div className="flex items-start justify-between pb-2.5 border-b border-zinc-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-condensed font-extrabold text-amber-400 uppercase tracking-wider">
                      Semana {session.week}
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-xs text-zinc-400 font-mono-num flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {session.durationMinutes} min
                    </span>
                  </div>
                  <h4 className="text-xl font-condensed font-extrabold text-white tracking-wide mt-0.5">
                    {session.dayTitle}
                  </h4>
                </div>

                <button
                  onClick={() => handleDeleteSession(session.id)}
                  className="p-2 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 active:scale-95 transition-all"
                  title="Eliminar registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Exercises Performed */}
              <div className="space-y-2">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Ejercicios Realizados ({session.exercisesLogged.length})
                </div>

                {session.exercisesLogged.map((ex, idx) => {
                  const completedSets = ex.sets.filter((s) => s.completed);
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">
                          {ex.exerciseName}
                        </span>
                        {ex.bestWeightKg > 0 && (
                          <span className="text-xs font-mono-num font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Mejor: {ex.bestWeightKg} kg
                          </span>
                        )}
                      </div>

                      {/* Sets list */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                        {completedSets.map((s, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono-num text-zinc-300 flex items-center justify-between"
                          >
                            <span className="text-zinc-500 font-semibold">#{s.setNumber}</span>
                            <span className="font-bold text-white">{s.weightKg}kg</span>
                            <span className="text-zinc-400">×{s.actualReps}</span>
                          </div>
                        ))}
                      </div>

                      {completedSets.length === 0 && (
                        <div className="text-xs text-zinc-500 italic">
                          Sin series marcadas como completadas
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-500 mx-auto">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-300">
                Sin entrenamientos registrados en esta fecha
              </div>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Los entrenamientos que guardes al terminar tu sesión aparecerán aquí con el detalle de todas tus series y pesos.
              </p>
            </div>

            {selectedDateIso === todayIso && (
              <button
                onClick={() => onGoToWorkout()}
                className="mt-2 px-4 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/10"
              >
                Comenzar Sesión de Hoy
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
