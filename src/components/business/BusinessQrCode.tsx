import { useState, useEffect, useRef } from 'react';
import { Download, QrCode, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function BusinessQrCode({ businessSlug, businessName }: { businessSlug: string; businessName: string }) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showQr) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowQr(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showQr]);

  const publicUrl = `${window.location.origin}/${businessSlug}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(publicUrl)}`;

  const handleDownload = async () => {
    try {
      const res = await fetch(qrApiUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agendaya-${businessSlug}-qr.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('QR descargado');
    } catch {
      toast.error('Error al descargar QR');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Enlace copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setShowQr(!showQr)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
      >
        <QrCode className="w-4 h-4" />
        QR
      </button>

      {showQr && (
        <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-center mb-4">
            <img
              src={qrApiUrl}
              alt={`QR ${businessName}`}
              className="w-48 h-48 mx-auto rounded-xl bg-white p-2"
            />
            <p className="text-xs font-bold text-slate-500 mt-2">Escanea para ver {businessName}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 truncate">
              <span className="truncate">{publicUrl}</span>
              <button onClick={handleCopy} className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${copied ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400'}`}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <QrCode className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl transition-all"
            >
              <Download className="w-4 h-4" />
              Descargar QR
            </button>

            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Imprime este QR y pégalo en tu local. Tus clientes escanean y reservan directo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
