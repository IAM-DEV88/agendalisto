import React, { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import { Review, getBusinessReviews } from '../../../lib/api';

interface ReviewsSectionProps {
  businessId: string;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ businessId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      try {
        const { success, data } = await getBusinessReviews(businessId);
        if (success) {
          setReviews(data);
        } else {
          setReviews([]);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    if (businessId) loadReviews();
  }, [businessId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Reseñas</h2>
        {reviews.length > 0 && (
          <div className="flex items-center bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-800/50">
            <Star className="h-4 w-4 text-amber-500 fill-current mr-1.5" />
            <span className="text-sm font-black text-amber-700 dark:text-amber-400">
              {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
            </span>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600 mb-4"></div>
          <p className="text-slate-500 font-medium">Cargando reseñas...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <MessageCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Aún no hay reseñas para este negocio.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review: Review) => (
            <div key={review.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3 text-primary-600 dark:text-primary-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white leading-none mb-1">
                      Usuario
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(review.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex bg-white dark:bg-slate-800 px-2 py-1 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-3.5 w-3.5 ${i < review.rating ? 'text-amber-400 fill-current' : 'text-slate-200 dark:text-slate-700'}`} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed italic">
                "{review.comment}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsSection; 
