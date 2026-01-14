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
      <h2 className="text-xl font-semibold mb-6">Reseñas</h2>
      
      {loading ? (
        <div className="text-center py-4">Cargando reseñas...</div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 text-center py-4 dark:text-gray-300">
          Aún no hay reseñas para este negocio.
        </p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review: Review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
              <div className="flex items-center mb-2">
                <div className="bg-gray-500 rounded-full p-2 mr-3">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <div className="font-medium  text-gray-900">
                    Usuario
                  </div>
                  <div className="text-xs  text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="mb-2">
                <div className="flex text-yellow-400">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                  {Array.from({ length: 5 - review.rating }).map((_, i) => (
                    <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 ">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsSection; 
