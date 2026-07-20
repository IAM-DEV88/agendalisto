import React, { useState, useEffect } from 'react';
import { Star, Tag, MessageCircle } from 'lucide-react';
import { Review, getBusinessReviews } from '../../../lib/api';
import EmptyState from '../../ui/EmptyState';

interface ReviewsSectionProps {
  businessId: string;
  plain?: boolean;
}

function SkeletonReview() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
        </div>
      </div>
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
    </div>
  );
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ businessId, plain }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      try {
        const { success, data } = await getBusinessReviews(businessId);
        if (success) setReviews(data);
        else setReviews([]);
      } catch { setReviews([]); }
      finally { setLoading(false); }
    };
    if (businessId) loadReviews();
  }, [businessId]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const header = (
    <div className={`flex items-center gap-3 ${plain ? 'mb-6' : 'pb-4 mb-6 border-b border-slate-100 dark:border-slate-800'}`}>
      <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-lg">
        <Star className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Reseñas</h3>
      </div>
      {reviews.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-full border border-amber-200 dark:border-amber-800">
          <Star className="w-4 h-4 text-amber-500 fill-current" />
          <span className="text-sm font-black text-amber-700 dark:text-amber-400">{avgRating}</span>
          <span className="text-xs font-medium text-amber-500 dark:text-amber-400">({reviews.length})</span>
        </div>
      )}
    </div>
  );

  const content = loading ? (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <SkeletonReview key={i} />)}
    </div>
  ) : reviews.length === 0 ? (
    <EmptyState
      icon={<MessageCircle className="w-8 h-8" />}
      title="Sin reseñas aún"
      description="Sé el primero en opinar sobre este negocio."
    />
  ) : (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="group p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg transition-all"
        >
          {/* Reviewer info + rating */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0 text-sm font-black">
                U
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  Usuario
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {new Date(review.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex gap-0.5 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800 flex-shrink-0">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? 'text-amber-400 fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
              ))}
            </div>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              "{review.comment}"
            </p>
          )}

          {/* Service name */}
          {review.service_name && (
            <div className="flex items-center gap-1.5 pt-3 mt-1 border-t border-slate-100 dark:border-slate-800">
              <Tag className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                {review.service_name}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (plain) {
    return (
      <div>
        {header}
        {content}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
      {header}
      {content}
    </div>
  );
};

export default ReviewsSection;
