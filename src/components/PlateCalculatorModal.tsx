import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, Check, Sparkles } from 'lucide-react';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
  exerciseName?: string;
  onApplyWeight?: (weight: number) => void;
}

interface PlateDef {
  weight: number;
  color: string;
  borderColor: string;
  textColor: string;
  height: string;
  width: string;
  label: string;
}

const AVAILABLE_PLATES: PlateDef[] = [
  { weight: 20, color: 'bg-blue-600', borderColor: 'border-blue-400', textColor: 'text-white', height: 'h-24', width: 'w-4.5', label: '20' },
  { weight: 15, color: 'bg-amber-500', borderColor: 'border-amber-300', textColor: 'text-black', height: 'h-20', width: 'w-4', label: '15' },
  { weight: 10, color: 'bg-emerald-600', borderColor: 'border-emerald-400', textColor: 'text-white', height: 'h-16', width: 'w-3.5', label: '10' },
  { weight: 5, color: 'bg-zinc-200', borderColor: 'border-white', textColor: 'text-zinc-950', height: 'h-13', width: 'w-3', label: '5' },
  { weight: 2.5, color: 'bg-zinc-800', borderColor: 'border-zinc-500', textColor: 'text-white', height: 'h-10', width: 'w-2.5', label: '2.5' },
  { weight: 1.25, color: 'bg-zinc-400', borderColor: 'border-zinc-300', textColor: 'text-zinc-950', height: 'h-8', width: 'w-2', label: '1.25' },
];

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialWeight = 60,
  exerciseName,
  onApplyWeight,
}) => {
  const [barWeight, setBarWeight] = useState<number>(20); // 20kg standard bar
  // Plates loaded per side (each item in array is plate weight in kg)
  const [platesPerSide, setPlatesPerSide] = useState<number[]>(() => {
    // Auto calculate initial plates if initialWeight >= barWeight
    const remaining = Math.max(0, initialWeight - 20) / 2;
    const initialPlates: number[] = [];
    let cur = remaining;
    for (const p of AVAILABLE_PLATES) {
      while (cur >= p.weight) {
        initialPlates.push(p.weight);
        cur -= p.weight;
      }
    }
    return initialPlates;
  });

  const totalPerSide = platesPerSide.reduce((acc, p) => acc + p, 0);
  const totalWeight = barWeight + totalPerSide * 2;

  const addPlate = (weight: number) => {
    if (platesPerSide.length >= 8) return; // limit sleeve capacity
    setPlatesPerSide((prev) => [...prev, weight].sort((a, b) => b - a));
  };

  const removePlate = (index: number) => {
    setPlatesPerSide((prev) => prev.filter((_, i) => i !== index));
  };

  const clearPlates = () => {
    setPlatesPerSide([]);
  };

  const handleApply = () => {
    if (onApplyWeight) {
      onApplyWeight(totalWeight);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                Calculadora Táctil de Discos
              </span>
              <h3 className="text-xl font-condensed font-bold text-white tracking-wide truncate max-w-[280px]">
                {exerciseName || 'Carga de Barra'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/50 active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barbell Weight Display */}
          <div className="my-4 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-400 font-medium">PESO TOTAL</div>
              <div className="text-3xl font-condensed font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
                <span className="text-amber-400 font-mono-num">{totalWeight}</span>
                <span className="text-sm font-normal text-zinc-400">kg</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-400 font-medium">POR CADA LADO</div>
              <div className="text-xl font-condensed font-bold text-zinc-200">
                <span className="font-mono-num">+{totalPerSide}</span> kg
              </div>
            </div>
          </div>

          {/* Interactive Barbell Sleeve Visual */}
          <div className="relative py-6 px-2 bg-zinc-950 rounded-2xl border border-zinc-800/70 overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">
              Manga derecha · Toca un disco para quitarlo
            </div>

            <div className="relative w-full flex items-center justify-center h-28">
              {/* Center collar */}
              <div className="w-3 h-16 bg-zinc-600 rounded-sm shadow-md z-10 border border-zinc-500" />
              {/* Sleeve shaft */}
              <div className="absolute left-1/2 -translate-x-12 w-48 h-3.5 bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-600 rounded-r-sm" />

              {/* Plates on sleeve */}
              <div className="flex items-center gap-1 pl-2 z-20">
                {platesPerSide.length === 0 ? (
                  <span className="text-xs text-zinc-600 italic">Barra vacía ({barWeight} kg)</span>
                ) : (
                  platesPerSide.map((weight, idx) => {
                    const plateDef = AVAILABLE_PLATES.find((p) => p.weight === weight);
                    if (!plateDef) return null;
                    return (
                      <motion.button
                        key={`${weight}-${idx}`}
                        layout
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removePlate(idx)}
                        className={`${plateDef.color} ${plateDef.borderColor} ${plateDef.height} ${plateDef.width} rounded-sm border flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:brightness-110`}
                        title={`Quitar disco de ${weight}kg`}
                      >
                        <span className={`text-[8px] font-bold ${plateDef.textColor} rotate-90`}>
                          {plateDef.label}
                        </span>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Barbell selector */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] text-zinc-400">Barra:</span>
              <button
                onClick={() => setBarWeight(20)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  barWeight === 20 ? 'bg-amber-500 text-black font-semibold' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                20 kg (Olímpica)
              </button>
              <button
                onClick={() => setBarWeight(15)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  barWeight === 15 ? 'bg-amber-500 text-black font-semibold' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                15 kg (Técnica)
              </button>
              <button
                onClick={() => setBarWeight(10)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  barWeight === 10 ? 'bg-amber-500 text-black font-semibold' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                10 kg (Hex/Trap)
              </button>
            </div>
          </div>

          {/* Plate Rack: Tap or Drag to Add */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                Discos disponibles (Toca para añadir + lado)
              </span>
              <button
                onClick={clearPlates}
                className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Limpiar
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {AVAILABLE_PLATES.map((plate) => (
                <button
                  key={plate.weight}
                  onClick={() => addPlate(plate.weight)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 active:scale-95 transition-all`}
                >
                  <div
                    className={`${plate.color} ${plate.borderColor} w-5 h-7 rounded border mb-1 flex items-center justify-center`}
                  >
                    <span className={`text-[7px] font-bold ${plate.textColor}`}>{plate.label}</span>
                  </div>
                  <span className="text-[11px] font-mono-num font-semibold text-zinc-200">
                    +{plate.weight}k
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick presets */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-[10px] text-zinc-500 shrink-0 uppercase tracking-wider">Metas:</span>
            {[40, 50, 60, 70, 80, 90, 100, 110, 120].map((kg) => (
              <button
                key={kg}
                onClick={() => {
                  const remaining = Math.max(0, kg - barWeight) / 2;
                  const newPlates: number[] = [];
                  let cur = remaining;
                  for (const p of AVAILABLE_PLATES) {
                    while (cur >= p.weight) {
                      newPlates.push(p.weight);
                      cur -= p.weight;
                    }
                  }
                  setPlatesPerSide(newPlates);
                }}
                className={`px-2 py-1 text-xs rounded-md font-mono-num shrink-0 transition-colors ${
                  totalWeight === kg
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {kg}kg
              </button>
            ))}
          </div>

          {/* Action Button */}
          <div className="mt-5 pt-3 border-t border-zinc-800 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 text-zinc-300 font-medium text-sm hover:bg-zinc-700 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleApply}
              className="flex-2 py-3 px-4 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-transform"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Usar {totalWeight} kg en la serie
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
