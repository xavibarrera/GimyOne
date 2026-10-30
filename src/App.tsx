import React, { useState } from 'react';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { WorkoutView } from './components/WorkoutView';
import { SessionHistoryCalendarView } from './components/SessionHistoryCalendarView';
import { WeightMemoryView } from './components/WeightMemoryView';
import { ProgressionView } from './components/ProgressionView';
import { PlateCalculatorModal } from './components/PlateCalculatorModal';
import { ExerciseHistoryModal } from './components/ExerciseHistoryModal';
import { FinisherTimerModal } from './components/FinisherTimerModal';
import { RestTimerOverlay } from './components/RestTimerOverlay';
import { WeekPhase, DayWorkout, MonthlyPlan } from './types/workout';
import {
  getStoredWeekPhase,
  setStoredWeekPhase,
  getStoredSelectedDay,
  setStoredSelectedDay,
  getStoredMonthlyPlan,
  setStoredMonthlyPlan,
} from './services/storage';
import { ImportPlanModal } from './components/ImportPlanModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('rutina');
  const [currentWeek, setCurrentWeek] = useState<WeekPhase>(() => getStoredWeekPhase());
  const [selectedDayId, setSelectedDayId] = useState<string>(() => getStoredSelectedDay());
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyPlan>(() => getStoredMonthlyPlan());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Plate Calculator Modal state
  const [plateModalConfig, setPlateModalConfig] = useState<{
    isOpen: boolean;
    exerciseName?: string;
    currentWeight: number;
    onApply?: (w: number) => void;
  }>({
    isOpen: false,
    currentWeight: 60,
  });

  // History Modal state
  const [historyModalExerciseId, setHistoryModalExerciseId] = useState<string | null>(null);

  // Finisher Timer Modal state
  const [finisherConfig, setFinisherConfig] = useState<{
    isOpen: boolean;
    dayTitle: string;
    finisher?: DayWorkout['finisher'];
  }>({
    isOpen: false,
    dayTitle: '',
  });

  // Rest Timer state
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);

  const handleSelectDay = (dayId: string) => {
    setSelectedDayId(dayId);
    setStoredSelectedDay(dayId);
  };

  const handleSelectWeek = (week: WeekPhase) => {
    setCurrentWeek(week);
    setStoredWeekPhase(week);
  };

  const handleSavePlan = (newPlan: MonthlyPlan) => {
    setMonthlyPlan(newPlan);
    setStoredMonthlyPlan(newPlan);
    if (!newPlan.workoutDays.some((d) => d.id === selectedDayId)) {
      const firstDayId = newPlan.workoutDays[0]?.id || 'lunes';
      setSelectedDayId(firstDayId);
      setStoredSelectedDay(firstDayId);
    }
  };

  const openPlateCalculator = (
    exerciseName: string,
    currentWeight: number,
    onApply?: (w: number) => void
  ) => {
    setPlateModalConfig({
      isOpen: true,
      exerciseName,
      currentWeight,
      onApply,
    });
  };

  const openFinisherTimer = (dayTitle: string, finisher: DayWorkout['finisher']) => {
    setFinisherConfig({
      isOpen: true,
      dayTitle,
      finisher,
    });
  };

  const triggerRestTimer = (seconds = 90) => {
    setRestTimerSeconds(seconds);
    setIsRestTimerActive(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between">
      {/* Top Header */}
      <Header
        currentWeek={currentWeek}
        monthName={monthlyPlan.monthName}
        onOpenRestTimer={() => triggerRestTimer(90)}
        onSelectWeek={handleSelectWeek}
        onOpenImportPlan={() => setIsImportModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto">
        {activeTab === 'rutina' && (
          <WorkoutView
            selectedDayId={selectedDayId}
            onSelectDay={handleSelectDay}
            currentWeek={currentWeek}
            workoutDays={monthlyPlan.workoutDays}
            onOpenPlateCalculator={openPlateCalculator}
            onOpenHistory={(exId) => setHistoryModalExerciseId(exId)}
            onOpenFinisherTimer={openFinisherTimer}
            onTriggerRestTimer={triggerRestTimer}
          />
        )}

        {activeTab === 'historial' && (
          <SessionHistoryCalendarView
            onGoToWorkout={(dayId) => {
              if (dayId) handleSelectDay(dayId);
              setActiveTab('rutina');
            }}
            onOpenPlateCalculator={openPlateCalculator}
          />
        )}

        {activeTab === 'memoria' && (
          <WeightMemoryView
            workoutDays={monthlyPlan.workoutDays}
            onOpenPlateCalculator={(name, weight) => openPlateCalculator(name, weight)}
          />
        )}

        {activeTab === 'progresion' && (
          <ProgressionView
            currentWeek={currentWeek}
            monthName={monthlyPlan.monthName}
            liftOfTheMonth={monthlyPlan.liftOfTheMonth}
            workoutDays={monthlyPlan.workoutDays}
            onSelectWeek={handleSelectWeek}
            onOpenPlateCalculator={(name, weight) => openPlateCalculator(name, weight)}
          />
        )}

        {activeTab === 'calculadora' && (
          <div className="p-4 max-w-xl mx-auto space-y-4 pb-28">
            <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 text-center">
              <h2 className="text-xl font-condensed font-extrabold text-white">
                Calculadora Táctil de Discos
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Calcula la distribución exacta de discos por cada lado de la barra de forma visual.
              </p>
              <button
                onClick={() => openPlateCalculator('Barra Olímpica', 70)}
                className="mt-4 px-6 py-3 rounded-2xl bg-amber-500 text-black font-condensed font-bold text-sm hover:bg-amber-400 active:scale-95 transition-transform shadow-lg shadow-amber-500/20"
              >
                Abrir Barra Interactiva
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Sticky Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Monthly Plan Import / Export Modal */}
      <ImportPlanModal
        isOpen={isImportModalOpen}
        currentPlan={monthlyPlan}
        onClose={() => setIsImportModalOpen(false)}
        onSavePlan={handleSavePlan}
      />

      {/* Plate Calculator Modal */}
      <PlateCalculatorModal
        isOpen={plateModalConfig.isOpen}
        onClose={() => setPlateModalConfig((prev) => ({ ...prev, isOpen: false }))}
        initialWeight={plateModalConfig.currentWeight}
        exerciseName={plateModalConfig.exerciseName}
        onApplyWeight={plateModalConfig.onApply}
      />

      {/* Exercise History Details Modal */}
      <ExerciseHistoryModal
        exerciseId={historyModalExerciseId}
        workoutDays={monthlyPlan.workoutDays}
        onClose={() => setHistoryModalExerciseId(null)}
        onOpenPlateCalculator={(name, w) => openPlateCalculator(name, w)}
      />

      {/* Finisher Timer Modal */}
      {finisherConfig.finisher && (
        <FinisherTimerModal
          isOpen={finisherConfig.isOpen}
          onClose={() => setFinisherConfig((prev) => ({ ...prev, isOpen: false }))}
          dayTitle={finisherConfig.dayTitle}
          finisher={finisherConfig.finisher}
        />
      )}

      {/* Floating Rest Countdown Timer */}
      <RestTimerOverlay
        initialSeconds={restTimerSeconds}
        isActive={isRestTimerActive}
        onClose={() => setIsRestTimerActive(false)}
      />
    </div>
  );
}
