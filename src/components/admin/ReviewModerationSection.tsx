import { CheckCircle, XCircle } from 'lucide-react';
import type { Review } from '../../types/appointment';
import StarRating from '../ui/StarRating';
import EmptyState from '../ui/EmptyState';
import Pagination from '../ui/Pagination';

interface ReviewModerationSectionProps {
  pendingReviews: (Review & { profiles?: { full_name: string }; businesses?: { name: string } })[];
  moderating: string | null;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onApprove: (reviewId: string) => void;
  onReject: (reviewId: string) => void;
}

export default function ReviewModerationSection({
  pendingReviews,
  moderating,
  page,
  totalPages,
  onPageChange,
  onApprove,
  onReject,
}: ReviewModerationSectionProps) {
  if (pendingReviews.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle className="h-12 w-12 text-emerald-400" />}
        title="No hay reseñas pendientes"
        description="Todas las reseñas han sido revisadas."
      />
    );
  }

  return (
    <div className="space-y-4">
      {pendingReviews.map((review) => (
        <div key={review.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                    {(review.profiles?.full_name || 'U').charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {review.profiles?.full_name || 'Usuario'}
                  </p>
                  <p className="text-xs text-slate-500">{review.businesses?.name || 'Negocio'}</p>
                </div>
                <StarRating rating={review.rating} />
                <span className="text-xs text-slate-400 ml-auto">
                  {new Date(review.created_at).toLocaleDateString('es-CO')}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 ml-12">
                  {review.comment}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onApprove(review.id)}
                disabled={moderating === review.id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 rounded-xl transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Aprobar
              </button>
              <button
                onClick={() => onReject(review.id)}
                disabled={moderating === review.id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-xl transition-colors disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Rechazar
              </button>
            </div>
          </div>
        </div>
      ))}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
