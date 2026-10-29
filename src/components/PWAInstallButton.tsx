import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, Share, PlusSquare, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running standalone, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        title="Instalar GimyOne en tu dispositivo"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="hidden sm:inline">Instalar</span>
      </button>
    );
  }

  // iOS Safari flow (WebKit doesn't trigger beforeinstallprompt)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-amber-500/40 text-amber-400 hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
          title="Instalar en iPhone"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Instalar</span>
        </button>

        <AnimatePresence>
          {showIOSGuide && (
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
                      Instalar en iPhone / iPad
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="p-1.5 rounded-full text-zinc-400 hover:text-white bg-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs text-zinc-300">
                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-amber-400 mt-0.5 shrink-0">
                      <Share className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">1. Pulsa Compartir</div>
                      <p className="text-zinc-400 mt-0.5">
                        Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
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
                        Baja en las opciones y selecciona <strong>"Añadir a pantalla de inicio"</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-full py-3 rounded-xl bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition-colors"
                >
                  Entendido
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Also offer a fallback install button on other desktop browsers
  return (
    <button
      onClick={() => {
        alert(
          'Para instalar GimyOne en tu dispositivo:\n- En Chrome / Edge: Pulsa el icono de instalación (⊞ o flecha de descarga) en la barra de direcciones.\n- En Móvil: Usa "Añadir a pantalla de inicio" en el menú de tu navegador.'
        );
      }}
      className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-zinc-400 hover:text-amber-400 text-xs font-medium flex items-center gap-1 active:scale-95 transition-all"
      title="Instalar en pantalla de inicio"
    >
      <Download className="w-3 h-3" />
      <span className="hidden sm:inline">Instalar</span>
    </button>
  );
};
