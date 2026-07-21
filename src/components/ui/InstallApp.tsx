import { usePwaInstall } from '../../hooks/usePwaInstall';
import { Download, X } from 'lucide-react';
import { useState } from 'react';

export default function InstallApp() {
  const { isInstallable, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-900 dark:text-white">Instala AgendaYa</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Acceso rápido desde tu pantalla</p>
        </div>
        <button
          onClick={install}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition-all flex-shrink-0"
        >
          Instalar
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
