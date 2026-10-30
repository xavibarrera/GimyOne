import React, { useState } from 'react';
import { MonthlyPlan } from '../types/workout';
import {
  importPlanFromCSV,
  exportPlanToCSV,
  getGeminiConversionPrompt,
  createDefaultMonthlyPlan,
} from '../services/csvPlanService';

interface ImportPlanModalProps {
  currentPlan: MonthlyPlan;
  isOpen: boolean;
  onClose: () => void;
  onSavePlan: (newPlan: MonthlyPlan) => void;
}

export const ImportPlanModal: React.FC<ImportPlanModalProps> = ({
  currentPlan,
  isOpen,
  onClose,
  onSavePlan,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'import' | 'export'>('import');
  const [csvText, setCsvText] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCSV, setCopiedCSV] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    plan?: MonthlyPlan;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopyPrompt = async () => {
    try {
      const prompt = getGeminiConversionPrompt();
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      // Fallback
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    }
  };

  const handleCopyCurrentCSV = async () => {
    try {
      const csv = exportPlanToCSV(currentPlan);
      await navigator.clipboard.writeText(csv);
      setCopiedCSV(true);
      setTimeout(() => setCopiedCSV(false), 2500);
    } catch {
      setCopiedCSV(true);
      setTimeout(() => setCopiedCSV(false), 2500);
    }
  };

  const handleDownloadCSV = () => {
    const csv = exportPlanToCSV(currentPlan);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GimyOne_${currentPlan.monthName.toLowerCase()}_plan.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvText(content);
        validateCSV(content);
      }
    };
    reader.readAsText(file);
  };

  const validateCSV = (text: string) => {
    if (!text.trim()) {
      setImportPreview(null);
      return;
    }
    const res = importPlanFromCSV(text);
    if (!res.error && res.plan) {
      setImportPreview({ plan: res.plan });
    } else {
      setImportPreview({ error: res.error || 'Error al procesar el archivo CSV' });
    }
  };

  const handleUpdateMonthName = (newName: string) => {
    if (importPreview?.plan) {
      const upper = newName.toUpperCase();
      setImportPreview({
        ...importPreview,
        plan: {
          ...importPreview.plan,
          monthName: upper,
          liftOfTheMonth: {
            ...importPreview.plan.liftOfTheMonth,
            tagline: `Lift of the Month · ${upper}`,
          },
        },
      });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCsvText(val);
    validateCSV(val);
  };

  const handleApplyPlan = () => {
    if (importPreview?.plan) {
      onSavePlan(importPreview.plan);
      onClose();
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('¿Restaurar la rutina por defecto de Octubre?')) {
      const defaultPlan = createDefaultMonthlyPlan();
      onSavePlan(defaultPlan);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#141517] border border-stone-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-stone-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide uppercase font-condensed">
                Rutina Mensual
              </h2>
              <p className="text-xs text-stone-400">
                Mes actual: <span className="text-amber-400 font-semibold">{currentPlan.monthName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/60 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              activeTab === 'import'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Importar CSV
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              activeTab === 'prompt'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Prompt Gemini
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              activeTab === 'export'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Exportar / Reset
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB: IMPORT CSV */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-3.5 text-xs text-stone-300 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                  <span>💡 Flujo Mensual Rápido</span>
                </div>
                <p className="text-stone-400 leading-relaxed">
                  Sube el archivo <code className="text-stone-200 bg-stone-800 px-1 py-0.5 rounded">.csv</code> generado por Gemini o pega su contenido aquí. La app actualizará automáticamente todos los días, ejercicios y el Lift of the Month.
                </p>
              </div>

              {/* File upload button */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  1. Subir archivo .CSV
                </label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-700/80 hover:border-amber-500/60 rounded-2xl cursor-pointer bg-stone-900/40 hover:bg-stone-900 transition-all text-center group">
                  <svg className="w-8 h-8 text-stone-500 group-hover:text-amber-400 mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm font-medium text-stone-300 group-hover:text-white">
                    Seleccionar archivo .csv
                  </span>
                  <span className="text-xs text-stone-500 mt-0.5">
                    o arrástralo aquí
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Textarea for direct paste */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    2. O pegar texto CSV directamente
                  </label>
                  {csvText && (
                    <button
                      onClick={() => {
                        setCsvText('');
                        setImportPreview(null);
                      }}
                      className="text-xs text-stone-500 hover:text-stone-300"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <textarea
                  value={csvText}
                  onChange={handleTextChange}
                  placeholder={`seccion,dia,titulo_dia,subtitulo,coaching_tip,nombre,patron,series,reps,equipo,notas,lift_of_the_month\nMETA,NOVIEMBRE,HIPERTROFIA,,,Trap Bar Deadlift,,,3 x 6-8,,Pecho alto,true\nFUERZA,LUNES,FULL BODY CONTROL,Fuerza y técnica,Control,Goblet Squat,sentadilla,3,3 x 10,mancuernas,Pausa abajo,false`}
                  rows={5}
                  className="w-full bg-stone-900 border border-stone-800 rounded-2xl p-3 text-xs text-stone-200 font-mono focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Preview or Error Box */}
              {importPreview?.error && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <div className="font-bold text-rose-200">Error en el archivo</div>
                    <div className="mt-0.5">{importPreview.error}</div>
                  </div>
                </div>
              )}

              {importPreview?.plan && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Rutina válida detectada</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-stone-900/90 p-2.5 rounded-xl border border-stone-800 focus-within:border-amber-500/60 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Mes del Programa</span>
                        <span className="text-[10px] text-amber-400 font-mono">editable</span>
                      </div>
                      <input
                        type="text"
                        value={importPreview.plan.monthName}
                        onChange={(e) => handleUpdateMonthName(e.target.value)}
                        placeholder="EJ. NOVIEMBRE"
                        className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg px-2.5 py-1 text-white font-bold text-sm tracking-wide uppercase outline-none transition-colors"
                      />
                    </div>
                    <div className="bg-stone-900/90 p-2.5 rounded-xl border border-stone-800 flex flex-col justify-center">
                      <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider block mb-1">Lift of the Month</span>
                      <span className="text-amber-400 font-bold truncate block text-sm">{importPreview.plan.liftOfTheMonth.name}</span>
                      <span className="text-[10px] text-stone-500 truncate">{importPreview.plan.liftOfTheMonth.targetReps}</span>
                    </div>
                  </div>

                  <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800 text-xs space-y-1">
                    <div className="flex justify-between text-stone-400">
                      <span>Días de entrenamiento:</span>
                      <span className="text-white font-semibold">{importPreview.plan.workoutDays.length} días (Lunes a Viernes)</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Ejercicios de fuerza totales:</span>
                      <span className="text-white font-semibold">
                        {importPreview.plan.workoutDays.reduce((acc, d) => acc + d.exercises.length, 0)} ejercicios
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyPlan}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all uppercase tracking-wider text-xs"
                  >
                    Guardar y Activar Rutina {importPreview.plan.monthName}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: GEMINI PROMPT */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Instrucciones para Gemini</span>
                </div>
                <ol className="text-xs text-stone-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Toma una foto clara a la pizarra mensual del box ONE.</li>
                  <li>Abre Gemini (<code className="text-amber-400">gemini.google.com</code>) o la app de Gemini en tu móvil.</li>
                  <li>Adjunta la foto y pega el prompt que puedes copiar abajo.</li>
                  <li>Gemini te responderá exactamente con el bloque CSV listo para importar en GimyOne.</li>
                </ol>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Prompt optimizado
                  </span>
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-colors"
                  >
                    {copiedPrompt ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-emerald-400 font-bold">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        <span>Copiar Prompt</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3 text-xs font-mono text-stone-300 max-h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
                  {getGeminiConversionPrompt()}
                </div>
              </div>

              <button
                onClick={handleCopyPrompt}
                className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                {copiedPrompt ? '¡Prompt copiado al portapapeles!' : 'Copiar Prompt para usar con la foto en Gemini'}
              </button>
            </div>
          )}

          {/* TAB: EXPORT / RESET */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                  Exportar Rutina Actual ({currentPlan.monthName})
                </span>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Puedes descargar el CSV actual como copia de seguridad o para ver exactamente cómo se estructuran las columnas.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleDownloadCSV}
                    className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl border border-stone-700/60 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar .CSV
                  </button>
                  <button
                    onClick={handleCopyCurrentCSV}
                    className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl border border-stone-700/60 transition-colors flex items-center justify-center gap-2"
                  >
                    {copiedCSV ? (
                      <span className="text-emerald-400 font-bold">¡Copiado!</span>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copiar CSV
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-stone-900/80 border border-stone-800/80 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                  Restablecer Rutina Original
                </span>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Si deseas volver al plan original de la pizarra de Octubre (Trap Bar Deadlift, Full Body Control, etc.), pulsa aquí. Tus registros de pesos y sesiones no se borrarán.
                </p>
                <button
                  onClick={handleResetToDefault}
                  className="w-full py-2.5 px-3 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-semibold transition-colors"
                >
                  Restaurar rutina inicial (Octubre)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
