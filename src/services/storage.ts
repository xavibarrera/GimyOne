import { SessionLog, WeekPhase, ExerciseHistoryRecord } from '../types/workout';
import { ONE_WORKOUT_DAYS } from '../data/onePlanData';

const STORAGE_KEYS = {
  CURRENT_WEEK: 'gimyone_current_week',
  SELECTED_DAY: 'gimyone_selected_day',
  SESSION_LOGS: 'gimyone_session_logs_v2', // v2 ensures zero legacy mock data
  EXERCISE_HISTORY: 'gimyone_exercise_history_v2', // v2 ensures zero legacy mock data
  CUSTOM_EXERCISE_ORDER: 'gimyone_exercise_order',
};

// No mock data: starts 100% clean
const SEED_HISTORY: ExerciseHistoryRecord[] = [];

export function getStoredWeekPhase(): WeekPhase {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_WEEK);
    if (!raw) return 1; // Default to Week 1 "CONOCE"
    const parsed = parseInt(raw, 10);
    if ([1, 2, 3, 4].includes(parsed)) return parsed as WeekPhase;
    return 1;
  } catch {
    return 1;
  }
}

export function setStoredWeekPhase(week: WeekPhase): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_WEEK, week.toString());
  } catch (err) {
    console.error('Error saving week phase', err);
  }
}

export function getStoredSelectedDay(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SELECTED_DAY);
    if (raw && ONE_WORKOUT_DAYS.some((d) => d.id === raw)) return raw;
    const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    const map: Record<number, string> = {
      1: 'lunes',
      2: 'martes',
      3: 'miercoles',
      4: 'jueves',
      5: 'viernes',
    };
    return map[dayIndex] || 'lunes';
  } catch {
    return 'lunes';
  }
}

export function setStoredSelectedDay(dayId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_DAY, dayId);
  } catch (err) {
    console.error('Error saving selected day', err);
  }
}

export function getExerciseHistoryList(): ExerciseHistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXERCISE_HISTORY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXERCISE_HISTORY, JSON.stringify(SEED_HISTORY));
      return SEED_HISTORY;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_HISTORY;
  }
}

export function getLastExerciseRecord(exerciseId: string): ExerciseHistoryRecord | undefined {
  const history = getExerciseHistoryList();
  const filtered = history.filter((h) => h.exerciseId === exerciseId);
  if (filtered.length === 0) return undefined;
  // Sort descending by date
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

export function saveExerciseHistoryRecord(record: ExerciseHistoryRecord): void {
  const current = getExerciseHistoryList();
  const updated = [record, ...current];
  try {
    localStorage.setItem(STORAGE_KEYS.EXERCISE_HISTORY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving exercise record', err);
  }
}

export function getSessionLogs(): SessionLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION_LOGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSessionLog(session: SessionLog): void {
  const current = getSessionLogs();
  const updated = [session, ...current];
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_LOGS, JSON.stringify(updated));

    // Also update history records for all completed exercises
    session.exercisesLogged.forEach((ex) => {
      if (ex.bestWeightKg > 0) {
        saveExerciseHistoryRecord({
          exerciseId: ex.exerciseId,
          date: session.date,
          weightKg: ex.bestWeightKg,
          reps: ex.sets.find((s) => s.weightKg === ex.bestWeightKg)?.actualReps || 10,
          week: session.week,
          setSummary: `${ex.sets.filter((s) => s.completed).length} series`,
        });
      }
    });
  } catch (err) {
    console.error('Error saving session log', err);
  }
}

export function deleteSessionLog(sessionId: string): void {
  try {
    const current = getSessionLogs();
    const updated = current.filter((s) => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEYS.SESSION_LOGS, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting session log', err);
  }
}

export function getCustomExerciseOrder(dayId: string): string[] | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.CUSTOM_EXERCISE_ORDER}_${dayId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCustomExerciseOrder(dayId: string, order: string[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEYS.CUSTOM_EXERCISE_ORDER}_${dayId}`, JSON.stringify(order));
  } catch (err) {
    console.error('Error saving exercise order', err);
  }
}
