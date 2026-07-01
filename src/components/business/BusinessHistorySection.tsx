import React, { useState, useEffect } from 'react';
import { Star, Calendar, User, Clock, Loader2, History } from 'lucide-react';
import { Pagination } from '../ui/Pagination';
import { getBusinessReviews, Review } from '../../lib/api';
import SectionHeader from '../ui/SectionHeader';

interface BusinessHistorySectionProps {
  businessId: string;
  appointments: import('../../lib/api').Appointment[];
  loading: boolean;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const BusinessHistorySection: React.FC<BusinessHistorySectionProps> = ({
  businessId,
  appointments,
  loading,
  currentPage,
  itemsPerPage,
  onPageChange
}) => {
  const [reviewsMap, setReviewsMap] = useState<Record<string, Review>>({});

  // Fetch reviews for this business and map by appointment ID
  useEffect(() => {
    async function loadReviews() {
      if (!businessId) return;
      try {
        const { success, data } = await getBusinessReviews(businessId);
        if (success && data) {
          const map: Record<string, Review> = {};
          data.forEach(r => { map[r.appointment_id] = r; });
          setReviewsMap(map);
        }
      } catch (err) {
        console.error('Error loading business reviews', err);
      }
    }
    loadReviews();
  }, [businessId, appointments]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Historial de Citas" 
        description="Registro de todas las citas pasadas, canceladas y finalizadas"
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-slate-500 font-medium">Cargando historial...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 text-slate-400">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No hay historial aún</h3>
          <p className="text-slate-500 dark:text-slate-400">Aquí aparecerán las citas que hayan sido completadas o canceladas.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {appointments.map((appt: any) => {
              const review = reviewsMap[appt.id];
              return (
                <li key={appt.id} className="p-4 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        appt.status === 'cancelled' 
                          ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' 
                          : 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
                      }`}>
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white truncate tracking-tight">
                          {appt.services?.name}
                        </h4>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1">
                          <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                            <User className="w-4 h-4" />
                            <span>{appt.profiles?.full_name || 'Usuario desconocido'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span className="capitalize">{formatDate(appt.start_time)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {appt.status === 'cancelled' ? (
                        <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Cancelada
                        </span>
                      ) : review ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} 
                              />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 italic max-w-[200px] truncate">
                              "{review.comment}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Sin reseña
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(appointments.length / itemsPerPage)}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessHistorySection; 