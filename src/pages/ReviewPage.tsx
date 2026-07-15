import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Send, Camera, MessageSquareText, Heart, CheckCircle, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import { createBusinessReview } from '../lib/api';
import { uploadImage } from '../lib/storage';
import type { Appointment } from '../types/appointment';

const ratingLabels = ['Pésimo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

export default function ReviewPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [beforeUrl, setBeforeUrl] = useState('');
  const [afterUrl, setAfterUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { setError('Debes iniciar sesión para dejar una reseña'); setLoading(false); return; }
      setUser({ id: u.id });
    });
  }, []);

  useEffect(() => {
    if (!appointmentId || !user) return;
    loadAppointment();
  }, [appointmentId, user]);

  const loadAppointment = async () => {
    try {
      const { data, error: err } = await supabase
        .from('agendaya_appointments')
        .select('*, services:agendaya_services(name), businesses:agendaya_businesses(name)')
        .eq('id', appointmentId)
        .single();
      if (err) throw err;
      if (!data) { setError('Cita no encontrada'); setLoading(false); return; }
      if (data.user_id !== user!.id) { setError('No tienes permiso para reseñar esta cita'); setLoading(false); return; }
      if (data.status !== 'completed') { setError('Solo puedes reseñar citas completadas'); setLoading(false); return; }

      const { data: existing } = await supabase
        .from('agendaya_reviews')
        .select('id')
        .eq('appointment_id', appointmentId)
        .maybeSingle();
      if (existing) { setError('Ya has dejado una reseña para esta cita'); setLoading(false); return; }

      setAppointment(data as Appointment);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la cita');
    }
    setLoading(false);
  };

  const handleUpload = async (side: 'before' | 'after', file: File) => {
    if (file.size > 10 * 1024 * 1024) return;
    setUploadingPhoto(true);
    const { url } = await uploadImage(file, 'service-images', user!.id);
    if (url) {
      if (side === 'before') setBeforeUrl(url);
      else setAfterUrl(url);
    }
    setUploadingPhoto(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment || !user) return;
    setSubmitting(true);
    try {
      const res = await createBusinessReview(
        appointment.id,
        appointment.business_id,
        user.id,
        rating,
        comment,
        beforeUrl || undefined,
        afterUrl || undefined,
      );
      if (res.success) {
        setSuccess(true);
        window.dispatchEvent(new CustomEvent('businessReviewAdded', {
          detail: { businessId: appointment.business_id },
        }));
      } else {
        setError(res.error || 'Error al enviar la reseña');
      }
    } catch (err: any) {
      setError(err.message || 'Error al enviar la reseña');
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
        <SEO title="Reseña enviada — AgendaYa" />
        <div className="text-center max-w-md animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-200 dark:ring-emerald-800">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">¡Reseña enviada!</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Tu opinión será publicada una vez un moderador la apruebe. Gracias por ayudar a otros clientes a elegir.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-primary-500/25 active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a mi perfil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      <SEO title={appointment ? 'Dejar reseña — AgendaYa' : 'Reseña — AgendaYa'} />

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-48" />
            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">No podemos procesar tu reseña</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a mi perfil
            </Link>
          </div>
        ) : appointment ? (
          <>
            <div className="flex items-center gap-3 mb-8">
              <Link to="/dashboard" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Tu opinión importa</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">¿Cómo fue tu experiencia?</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Servicio</p>
                <p className="text-lg font-black text-primary-600 dark:text-primary-400">{appointment.services?.name}</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{appointment.businesses?.name}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Puntuación</label>
                <div className="flex flex-col items-center gap-3 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button key={v} type="button" onClick={() => setRating(v)}
                        className="focus:outline-none transition-all hover:scale-110 active:scale-90"
                      >
                        <Star className={`w-9 h-9 sm:w-10 sm:h-10 ${v <= rating ? 'text-amber-400 fill-amber-400 drop-shadow-sm' : 'text-slate-200 dark:text-slate-700'}`} />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">{ratingLabels[rating - 1]}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 space-y-2">
                <label htmlFor="comment" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Comentario <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <MessageSquareText className="absolute top-3.5 left-3.5 w-4 h-4 text-slate-400" />
                  <textarea id="comment" rows={3} value={comment} onChange={e => setComment(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm resize-none"
                    placeholder="Cuéntanos qué te pareció el servicio..."
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> ¿Antes y después? <span className="font-normal text-slate-400">(opcional)</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(['before', 'after'] as const).map(side => (
                    <label key={side}
                      className="flex flex-col items-center justify-center h-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:border-primary-400 bg-slate-50 dark:bg-slate-800/50 transition-all"
                    >
                      {uploadingPhoto ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
                      ) : (side === 'before' ? beforeUrl : afterUrl) ? (
                        <div className="relative w-full h-full">
                          <img src={side === 'before' ? beforeUrl : afterUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                          <button type="button" onClick={e => { e.preventDefault(); if (side === 'before') setBeforeUrl(''); else setAfterUrl(''); }}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 rounded text-white text-[10px]">✕</button>
                        </div>
                      ) : (
                        <><Camera className="w-4 h-4 text-slate-400" /><span className="text-[10px] text-slate-400 mt-0.5">{side === 'before' ? 'Antes' : 'Después'}</span></>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(side, f); }} />
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-800 text-sm font-medium text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Link to="/dashboard"
                  className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98] text-center"
                >
                  Cancelar
                </Link>
                <button type="submit" disabled={submitting}
                  className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-black rounded-lg shadow-lg shadow-primary-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Enviando...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Publicar reseña</>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
