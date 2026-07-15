import React, { useState } from 'react';
import { Star, X, Send, Heart, Camera, MessageSquareText } from 'lucide-react';
import { Appointment } from '../../types/appointment';
import { uploadImage } from '../../lib/storage';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSubmit: (rating: number, comment: string, beforeImage?: string, afterImage?: string) => Promise<void>;
  userId: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSubmit,
  userId,
}) => {
  useLockBodyScroll(isOpen);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [beforeUrl, setBeforeUrl] = useState('');
  const [afterUrl, setAfterUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleUpload = async (side: 'before' | 'after', file: File) => {
    if (file.size > 10 * 1024 * 1024) return;
    setUploadingPhoto(true);
    const { url } = await uploadImage(file, 'service-images', userId);
    if (url) {
      if (side === 'before') setBeforeUrl(url);
      else setAfterUrl(url);
    }
    setUploadingPhoto(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(rating, comment, beforeUrl || undefined, afterUrl || undefined);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ['Pésimo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                <Heart className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Tu opinión importa
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  ¿Cómo fue tu experiencia?
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Service info */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Servicio
            </p>
            <p className="text-base font-black text-primary-600 dark:text-primary-400">
              {appointment.services?.name}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {appointment.businesses?.name}
            </p>
          </div>

          {/* Stars */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Puntuación
            </label>
            <div className="flex flex-col items-center gap-3 py-5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="focus:outline-none transition-all hover:scale-110 active:scale-90"
                  >
                    <Star
                      className={`w-9 h-9 sm:w-10 sm:h-10 ${
                        value <= rating
                          ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                          : 'text-slate-200 dark:text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                {ratingLabels[rating - 1]}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="comment" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Comentario <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <MessageSquareText className="absolute top-3.5 left-3.5 w-4 h-4 text-slate-400" />
              <textarea
                id="comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                placeholder="Cuéntanos qué te pareció el servicio..."
              />
            </div>
          </div>

          {/* Before/After Photos */}
          <div className="pt-3">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
              <Camera className="w-3.5 h-3.5" /> ¿Antes y después? (opcional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(['before', 'after'] as const).map(side => (
                <label key={side} className="flex flex-col items-center justify-center h-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:border-primary-400 bg-slate-50 dark:bg-slate-800/50 transition-all">
                  {uploadingPhoto ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
                  ) : (side === 'before' ? beforeUrl : afterUrl) ? (
                    <div className="relative w-full h-full">
                      <img src={side === 'before' ? beforeUrl : afterUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                      <button type="button" onClick={(e) => { e.preventDefault(); if (side === 'before') setBeforeUrl(''); else setAfterUrl(''); }}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 rounded text-white text-[10px]">✕</button>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] text-slate-400 mt-0.5">{side === 'before' ? 'Antes' : 'Después'}</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(side, f); }} />
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-black rounded-lg shadow-lg shadow-primary-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Publicar reseña
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
