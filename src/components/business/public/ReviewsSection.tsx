import React, { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Review, getBusinessReviews, createBusinessReview, getUserAppointments, obtenerPerfilUsuario } from '../../../lib/api';
import { notifySuccess, notifyError } from '../../../lib/toast';

interface ReviewsSectionProps {
  businessId: string;
  currentUser: any;
  allowReview?: boolean;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ businessId, currentUser, allowReview = true }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [eligibleAppointmentId, setEligibleAppointmentId] = useState<string | null>(null);

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

  useEffect(() => {
    const checkEligibility = async () => {
      if (!currentUser) { setCanReview(false); return; }
      try {
        const { success, data: appts } = await getUserAppointments(currentUser.id);
        if (success && appts) {
          const completed = appts.filter((a: any) => a.business_id === businessId && a.status === 'completed');
          const hasReviewed = reviews.some(r => r.user_id === currentUser.id);
          const eligible = completed.length > 0 && !hasReviewed;
          setCanReview(eligible);
          setEligibleAppointmentId(eligible ? completed[0].id : null);
        } else {
          setCanReview(false);
          setEligibleAppointmentId(null);
        }
      } catch {
        setCanReview(false);
        setEligibleAppointmentId(null);
      }
    };
    checkEligibility();
  }, [currentUser, reviews, businessId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setSubmitting(true);
      const appointmentId = eligibleAppointmentId || '';
      const { success, data } = await createBusinessReview(
        appointmentId,
        businessId,
        currentUser.id,
        newReview.rating,
        newReview.comment
      );
      if (success && data) {
        setReviews(prev => [data, ...prev]);
        setShowReviewForm(false);
        setNewReview({ rating: 5, comment: '' });
        let userName = '';
        try {
          const { success: perfilSuccess, perfil } = await obtenerPerfilUsuario(currentUser.id);
          if (perfilSuccess && perfil) {
            userName = perfil.full_name;
          }
        } catch {}
        notifySuccess(userName ? `Reseña enviada por ${userName}` : 'Reseña enviada correctamente');
      } else {
        notifyError('Error al enviar la reseña');
      }
    } catch (error: any) {
      notifyError(error.message || 'Error al enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-current' : ''}`} />
        ))}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Reseñas</h2>
      
      {loading ? (
        <div className="text-center py-4">Cargando reseñas...</div>
      ) : null}
      {allowReview && !currentUser ? (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <Link to="/login" className="text-yellow-700 underline">
              Inicia sesión
            </Link>{' '}
            para dejar una reseña.
          </p>
        </div>
      ) : null}

      {allowReview && !showReviewForm && canReview ? (
        <button
          onClick={() => setShowReviewForm(true)}
          className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Dejar una reseña
        </button>
      ) : null}

      {allowReview && showReviewForm && currentUser && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Escribe tu reseña</h3>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calificación
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={`h-8 w-8 ${star <= newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comentario
              </label>
              <textarea
                id="comment"
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="mr-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar reseña'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          Aún no hay reseñas para este negocio.
        </p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review: any) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
              <div className="flex items-center mb-2">
                <div className="bg-gray-500 rounded-full p-2 mr-3">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <div className="font-medium dark:text-white text-gray-900">
                    {review.user?.full_name || 'Usuario'}
                  </div>
                  <div className="text-xs dark:text-white text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="mb-2">
                {renderStars(review.rating)}
              </div>
              <p className="text-gray-600">
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
