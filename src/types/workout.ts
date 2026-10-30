export type MovementPattern = 'sentadilla' | 'empuje' | 'traccion' | 'bisagra' | 'core' | 'resistencia';

export type WeekPhase = 1 | 2 | 3 | 4;

export interface WeekPhaseInfo {
  week: WeekPhase;
  name: string; // "CONOCE", "CONTROLA", "PROGRESA", "SUPÉRATE"
  targetRpe: string; // "RPE 6-7", "RPE 7", "RPE 7-8", "RPE 8"
  description: string;
  badgeColor: string;
}

export interface ExerciseSet {
  setNumber: number;
  weightKg: number;
  targetReps: string;
  actualReps: number;
  completed: boolean;
  rpe?: number;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  pattern: MovementPattern;
  targetSets: number;
  targetReps: string;
  equipment: 'barra' | 'mancuernas' | 'polea' | 'sandbag' | 'peso_corporal' | 'kettlebell' | 'trineo' | 'otro';
  isUnilateral?: boolean;
  notes?: string;
  isLiftOfTheMonth?: boolean;
  defaultWeightKg?: number;
}

export interface RoutineBlock {
  type: 'movilidad' | 'activacion' | 'fuerza' | 'estaciones' | 'finisher';
  title: string;
  durationMin?: number;
  items: string[]; // for mobility / activation
  format?: string; // e.g. "4 SERIES", "EMOM 8 MINUTOS", "TABATA 20/10"
}

export interface DayWorkout {
  id: string; // 'lunes', 'martes', etc.
  dayName: string; // "LUNES", "MARTES", etc.
  dayTitle: string; // "FULL BODY CONTROL", "TEAM WORK", etc.
  subtitle: string;
  coachingTip: string;
  mobility: string[];
  activation: string[];
  exercises: ExerciseDefinition[];
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

export interface LiftOfTheMonth {
  name: string;
  exerciseId: string;
  tagline: string;
  tips: string;
  targetReps: string;
}

export interface MonthlyPlan {
  monthName: string; // e.g. "OCTUBRE", "NOVIEMBRE"
  blockName?: string; // e.g. "BASE - CONTROL - PROGRESIÓN"
  liftOfTheMonth: LiftOfTheMonth;
  workoutDays: DayWorkout[];
}


export interface ExerciseHistoryRecord {
  exerciseId: string;
  date: string;
  weightKg: number;
  reps: number;
  rpe?: number;
  week: WeekPhase;
  setSummary?: string;
}

export interface SessionLog {
  id: string;
  dayId: string;
  dayTitle: string;
  date: string; // ISO date string
  week: WeekPhase;
  durationMinutes: number;
  exercisesLogged: {
    exerciseId: string;
    exerciseName: string;
    sets: ExerciseSet[];
    bestWeightKg: number;
    totalVolumeKg: number;
  }[];
  notes?: string;
}
