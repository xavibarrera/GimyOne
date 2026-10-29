import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, Share, PlusSquare, X, Monitor, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running standalone as installed PWA, hide button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        title="Instalar GimyOne en tu dispositivo"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="hidden sm:inline">Instalar</span>
      </button>

      <AnimatePresence>
        {showGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="font-condensed font-bold text-lg text-white">
                    Instalar GimyOne
                  </h3>
                </div>
                <button
                  onClick={() => setShowGuide(false)}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isIOS ? (
                /* iOS Safari instructions */
                <div className="space-y-3 text-xs text-zinc-300">
                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-amber-400 mt-0.5 shrink-0">
                      <Share className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">1. Pulsa Compartir</div>
                      <p className="text-zinc-400 mt-0.5">
                        Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en la barra de Safari.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-amber-400 mt-0.5 shrink-0">
                      <PlusSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">2. Añadir a pantalla de inicio</div>
                      <p className="text-zinc-400 mt-0.5">
                        Desplaza hacia abajo y selecciona <strong>"Añadir a pantalla de inicio"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Android / Chrome / Edge instructions */
                <div className="space-y-3 text-xs text-zinc-300">
                  {isInstallable && (
                    <button
                      onClick={async () => {
                        await install();
                        setShowGuide(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 flex items-center justify-center gap-1.5 mb-2"
                    >
                      <Download className="w-4 h-4" />
                      Instalar ahora con 1 toque
                    </button>
                  )}

                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-amber-400 mt-0.5 shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">En Android (Chrome / Brave / Edge)</div>
                      <p className="text-zinc-400 mt-0.5">
                        Toca el menú de <strong>3 puntos (⋮)</strong> arriba a la derecha y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a pantalla de inicio"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-amber-400 mt-0.5 shrink-0">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">En Ordenador (Chrome / Edge)</div>
                      <p className="text-zinc-400 mt-0.5">
                        Haz clic en el icono de instalación <strong>⊞</strong> ubicado a la derecha de la barra de direcciones de tu navegador.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowGuide(false)}
                className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-700 transition-colors"
              >
                Cerrar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
