import React, { useState, useRef } from 'react';
import {
  Settings,
  Download,
  Upload,
  FileSpreadsheet,
  Copy,
  Check,
  RotateCcw,
  Smartphone,
  Share,
  PlusSquare,
  Calculator,
  Timer,
  Database,
  FileDown,
  Info,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { MonthlyPlan } from '../types/workout';
import { exportPlanToCSV, getGeminiConversionPrompt, createDefaultMonthlyPlan } from '../services/csvPlanService';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  getSessionLogs,
  getExerciseHistoryList,
  setStoredMonthlyPlan,
  clearActiveWorkoutDraft,
} from '../services/storage';

interface SettingsViewProps {
  monthlyPlan: MonthlyPlan;
  onOpenImportPlan: () => void;
  onResetPlan: () => void;
  onOpenPlateCalculator: (exerciseName: string, defaultWeight: number) => void;
  onTriggerRestTimer: (seconds: number) => void;
  onPlanUpdated: (newPlan: MonthlyPlan) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  monthlyPlan,
  onOpenImportPlan,
  onResetPlan,
  onOpenPlateCalculator,
  onTriggerRestTimer,
  onPlanUpdated,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [draftCleared, setDraftCleared] = useState(false);

  const backupInputRef = useRef<HTMLInputElement>(null);

  // Export current monthly routine to CSV file
  const handleExportCSV = () => {
    try {
      const csvContent = exportPlanToCSV(monthlyPlan);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `gimyone_rutina_${(monthlyPlan.monthName || 'mes').toLowerCase().replace(/\s+/g, '_')}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error al exportar CSV', err);
    }
  };

  // Copy Gemini Prompt to clipboard
  const handleCopyPrompt = async () => {
    try {
      const prompt = getGeminiConversionPrompt();
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch {
      // Fallback
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    }
  };

  // Export full app backup (sessions, weights, plan) as JSON
  const handleExportBackup = () => {
    try {
      const backupData = {
        app: 'GimyOne',
        exportDate: new Date().toISOString(),
        version: '1.4',
        monthlyPlan,
        sessionLogs: getSessionLogs(),
        exerciseHistory: getExerciseHistoryList(),
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute(
        'download',
        `gimyone_backup_${new Date().toISOString().split('T')[0]}.json`
      );
      link.setAttribute('href', url);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch (err) {
      console.error('Error al exportar backup', err);
    }
  };

  // Restore backup from JSON file
  const handleRestoreBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (data.sessionLogs && Array.isArray(data.sessionLogs)) {
          localStorage.setItem('gimyone_session_logs_v2', JSON.stringify(data.sessionLogs));
        }
        if (data.exerciseHistory && Array.isArray(data.exerciseHistory)) {
          localStorage.setItem(
            'gimyone_exercise_history_v2',
            JSON.stringify(data.exerciseHistory)
          );
        }
        if (data.monthlyPlan && data.monthlyPlan.workoutDays) {
          setStoredMonthlyPlan(data.monthlyPlan);
          onPlanUpdated(data.monthlyPlan);
        }
        alert('Copia de seguridad restaurada correctamente.');
        window.location.reload();
      } catch (err) {
        alert('El archivo no tiene un formato válido de copia de seguridad de GimyOne.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearDrafts = () => {
    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    days.forEach((dayId) => clearActiveWorkoutDraft(dayId));
    setDraftCleared(true);
    setTimeout(() => setDraftCleared(false), 3000);
  };

  const totalExercises = monthlyPlan.workoutDays.reduce(
    (acc, d) => acc + (d.exercises ? d.exercises.length : 0),
    0
  );

  return (
    <div className="p-4 max-w-xl mx-auto space-y-5 pb-28">
      {/* View Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Settings className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-condensed font-black tracking-wide text-white uppercase">
              Ajustes
            </h1>
            <p className="text-[11px] text-zinc-400">
              Rutina mensual, instalación PWA y preferencias
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: INSTALACIÓN DE LA APP (PWA) */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <h2 className="font-condensed font-extrabold text-white text-base tracking-wide uppercase">
              Instalación de la App (PWA)
            </h2>
          </div>
          {isInstalled && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Instalada
            </span>
          )}
        </div>

        {isInstalled ? (
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
            <p className="text-xs text-zinc-300">
              GimyOne está instalada en tu dispositivo. Se ejecuta en pantalla completa y guarda todos tus entrenamientos localmente sin necesidad de conexión.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modo independiente activado (Standalone)</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Instala GimyOne como app nativa en tu móvil o tablet para abrirla directamente desde la pantalla de inicio, a pantalla completa y con acceso offline en el box.
            </p>

            {isInstallable && (
              <button
                onClick={async () => {
                  await install();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-condensed font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                Instalar Ahora en este Dispositivo
              </button>
            )}

            {/* Guía según sistema operativo */}
            {isIOS ? (
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <Share className="w-3.5 h-3.5" />
                  Instrucciones para iPhone / iPad (Safari):
                </div>
                <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside pl-1">
                  <li>
                    Pulsa el icono de <strong className="text-zinc-200">Compartir</strong> (cuadrado con flecha hacia arriba) en Safari.
                  </li>
                  <li>
                    Desplaza hacia abajo y selecciona <strong className="text-zinc-200">"Añadir a pantalla de inicio"</strong>.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  Instrucciones para Android (Chrome) / PC:
                </div>
                <p className="text-xs text-zinc-400">
                  Toca el menú de <strong className="text-zinc-200">3 puntos (⋮)</strong> arriba a la derecha y selecciona <strong className="text-zinc-200">"Instalar aplicación"</strong> o <strong className="text-zinc-200">"Añadir a pantalla principal"</strong>.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECCIÓN 2: PROGRAMACIÓN Y RUTINA MENSUAL */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            <h2 className="font-condensed font-extrabold text-white text-base tracking-wide uppercase">
              Rutina Mensual ({monthlyPlan.monthName})
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {monthlyPlan.workoutDays.length} días · {totalExercises} ejer.
          </span>
        </div>

        {/* Resumen del programa activo */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Mes activo:</span>
            <span className="font-condensed font-bold text-amber-400 text-sm tracking-wider">
              {monthlyPlan.monthName}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Bloque de entrenamiento:</span>
            <span className="font-medium text-zinc-200">
              {monthlyPlan.blockName || 'BASE - CONTROL - PROGRESIÓN'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Lift of the Month:</span>
            <span className="font-medium text-zinc-200">
              {monthlyPlan.liftOfTheMonth.name} ({monthlyPlan.liftOfTheMonth.targetReps})
            </span>
          </div>
        </div>

        {/* Botones de acción mensual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Botón Importar CSV */}
          <button
            onClick={onOpenImportPlan}
            className="py-3 px-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-condensed font-extrabold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            Importar Nueva Rutina (CSV)
          </button>

          {/* Botón Exportar CSV actual */}
          <button
            onClick={handleExportCSV}
            className="py-3 px-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-condensed font-bold text-xs flex items-center justify-center gap-2 border border-zinc-700 active:scale-[0.98] transition-transform"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                <span className="text-emerald-400">¡CSV Descargado!</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-amber-400" />
                Exportar Rutina Actual (CSV)
              </>
            )}
          </button>
        </div>

        {/* Copiar Prompt de Gemini */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Prompt para Gemini (Pizarra ➔ CSV)
            </div>
            <p className="text-[11px] text-zinc-400">
              Pega este texto en Gemini junto con la foto de la pizarra del box para generar el CSV listo para importar.
            </p>
          </div>
          <button
            onClick={handleCopyPrompt}
            className="w-full sm:w-auto px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 shrink-0 border border-zinc-700 transition-colors"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copiar Prompt</span>
              </>
            )}
          </button>
        </div>

        {/* Restaurar rutina original */}
        <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            ¿Quieres volver a la rutina inicial de ejemplo?
          </span>
          <button
            onClick={() => setResetConfirmOpen(true)}
            className="text-xs text-zinc-400 hover:text-amber-400 font-medium flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar por defecto
          </button>
        </div>

        {/* Modal confirmación reset */}
        {resetConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-2xl text-white">
              <h3 className="font-condensed font-extrabold text-lg text-white">
                ¿Restaurar rutina inicial?
              </h3>
              <p className="text-xs text-zinc-300">
                Se restaurará la rutina de Octubre de ONE Strength & Conditioning. Tu historial de pesos y sesiones completadas se mantendrán a salvo.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setResetConfirmOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const def = createDefaultMonthlyPlan();
                    onPlanUpdated(def);
                    onResetPlan();
                    setResetConfirmOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black"
                >
                  Restaurar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN 3: HERRAMIENTAS DE ENTRENAMIENTO */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-400" />
          <h2 className="font-condensed font-extrabold text-white text-base tracking-wide uppercase">
            Herramientas de Entrenamiento
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tarjeta Calculadora de Discos */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-white font-condensed font-bold text-sm">
                <Calculator className="w-4 h-4 text-amber-400" />
                Calculadora de Discos
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Calcula la distribución visual exacta de discos por lado para barra olímpica de 20 kg.
              </p>
            </div>
            <button
              onClick={() => onOpenPlateCalculator('Barra Olímpica', 70)}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-400 font-condensed font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              Abrir Calculadora
            </button>
          </div>

          {/* Tarjeta Temporizador */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-white font-condensed font-bold text-sm">
                <Timer className="w-4 h-4 text-amber-400" />
                Temporizador Rápido
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Inicia descanso rápido entre series para mantener la intensidad planificada.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onTriggerRestTimer(60)}
                className="py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold text-zinc-200 border border-zinc-700 transition-colors"
              >
                60s
              </button>
              <button
                onClick={() => onTriggerRestTimer(90)}
                className="py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-mono font-bold text-amber-400 border border-amber-500/30 transition-colors"
              >
                90s
              </button>
              <button
                onClick={() => onTriggerRestTimer(120)}
                className="py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold text-zinc-200 border border-zinc-700 transition-colors"
              >
                120s
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: COPIA DE SEGURIDAD Y DATOS */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" />
          <h2 className="font-condensed font-extrabold text-white text-base tracking-wide uppercase">
            Copia de Seguridad y Datos
          </h2>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          Tus marcas históricas, registros y sesiones están almacenados localmente en tu dispositivo. Puedes crear una copia de respaldo para transferir tus datos a otro móvil o navegador.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Exportar JSON */}
          <button
            onClick={handleExportBackup}
            className="py-2.5 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-condensed font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {backupSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">¡Copia Descargada!</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-zinc-400" />
                Descargar Copia (JSON)
              </>
            )}
          </button>

          {/* Importar JSON */}
          <button
            onClick={() => backupInputRef.current?.click()}
            className="py-2.5 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-condensed font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4 text-zinc-400" />
            Restaurar Copia (JSON)
          </button>
          <input
            ref={backupInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleRestoreBackupFile}
          />
        </div>

        {/* Limpieza de borradores activos */}
        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            Limpiar sesión en curso no guardada
          </span>
          <button
            onClick={handleClearDrafts}
            className="text-xs text-zinc-400 hover:text-red-400 font-medium flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {draftCleared ? '¡Borrador limpio!' : 'Limpiar borrador'}
          </button>
        </div>
      </section>

      {/* SECCIÓN 5: ACERCA DE LA APP */}
      <footer className="text-center pt-2 space-y-1.5">
        <p className="text-xs font-condensed font-extrabold tracking-wider text-zinc-300 uppercase">
          GimyOne v1.4 · ONE Strength & Conditioning
        </p>
        <p className="text-[11px] text-zinc-500">
          Progreso mensual estructurado · Almacenamiento 100% offline
        </p>
      </footer>
    </div>
  );
};
