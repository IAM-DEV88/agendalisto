import { useState } from 'react';
import { uploadImage } from '../../lib/storage';
import { Camera, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BeforeAfterUploadProps {
  userId: string;
  appointmentId: string;
  onComplete: (beforeUrl: string, afterUrl: string) => void;
}

export default function BeforeAfterUpload({ userId, appointmentId: _appointmentId, onComplete }: BeforeAfterUploadProps) {
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (side: 'before' | 'after', file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error('La imagen no debe superar 10MB'); return; }
    setUploading(true);
    const { url, error } = await uploadImage(file, 'service-images', userId);
    if (error) { toast.error(error); setUploading(false); return; }
    if (url) {
      if (side === 'before') setBefore(url);
      else setAfter(url);
      toast.success(`${side === 'before' ? 'Antes' : 'Después'} subido`);
    }
    setUploading(false);
  };

  const isComplete = before && after;

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <Camera className="w-4 h-4" /> Comparte tu antes/después
      </p>
      <div className="grid grid-cols-2 gap-3">
        {(['before', 'after'] as const).map(side => (
          <div key={side} className="relative">
            {(side === 'before' ? before : after) ? (
              <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={side === 'before' ? before! : after!} alt={side} className="w-full h-28 object-cover" />
                <button onClick={() => { if (side === 'before') setBefore(null); else setAfter(null); }}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-28 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:border-primary-400 bg-slate-50 dark:bg-slate-800/50 transition-all">
                {uploading ? <Loader2 className="w-5 h-5 text-primary-500 animate-spin" /> : <Camera className="w-5 h-5 text-slate-400" />}
                <span className="text-[10px] font-medium text-slate-400 mt-1">{side === 'before' ? 'Antes' : 'Después'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(side, f); }} />
              </label>
            )}
          </div>
        ))}
      </div>
      {isComplete && (
        <button onClick={() => onComplete(before!, after!)}
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl transition-all">
          Publicar mi antes/después
        </button>
      )}
    </div>
  );
}
