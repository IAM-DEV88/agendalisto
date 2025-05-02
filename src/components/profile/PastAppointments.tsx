import React, { useState, useEffect } from 'react';
import { Appointment, Review, createBusinessReview, getBusinessReviews } from '../../lib/api';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PastAppointmentsProps {
  appointments: Appointment[];
  loading: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onReschedule: (appointment: Appointment) => void;
}

const PastAppointments: React.FC<PastAppointmentsProps> = ({
  appointments,
  loading,
  currentPage,
  onPageChange,
  itemsPerPage,
  onReschedule
}) => {
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

  // Utility to generate URL slug from business name
  const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

  // State to store fetched reviews by appointment ID
  const [reviews, setReviews] = useState<Record<string, Review>>({});

  // Fetch any existing reviews for these past appointments
  useEffect(() => {
    const fetchReviews = async () => {
      const appointmentIdsSet = new Set(appointments.map(a => a.id));
      const uniqueBusinessIds = Array.from(new Set(appointments.map(a => a.business_id)));
      const reviewsMap: Record<string, Review> = {};
      for (const businessId of uniqueBusinessIds) {
        try {
          const { success, data } = await getBusinessReviews(businessId);
          if (success && data) {
            data.forEach(r => {
              if (appointmentIdsSet.has(r.appointment_id)) {
                const appt = appointments.find(a => a.id === r.appointment_id);
                if (appt && r.user_id === appt.user_id) {
                  reviewsMap[r.appointment_id] = r;
                }
              }
            });
          }
        } catch (error) {
        }
      }
      setReviews(reviewsMap);
    };
    fetchReviews();
  }, [appointments]);

  const [showReviewFormId, setShowReviewFormId] = useState<string | null>(null);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleSubmitReview = async (appointment: Appointment) => {
    setSubmittingReview(true);
    try {
      const { success, data, error } = await createBusinessReview(
        appointment.id,
        appointment.business_id,
        appointment.user_id,
        newReview.rating,
        newReview.comment
      );
      if (success) {
        // Update local reviews state so the review is shown and button hidden
        if (data) setReviews(prev => ({ ...prev, [appointment.id]: data }));
        setShowReviewFormId(null);
        setNewReview({ rating: 5, comment: '' });
      } else {
      }
    } catch (err) {
    } finally {
      setSubmittingReview(false);
    }
  };

  // Componente de paginación
  const Pagination = ({ currentPage, totalItems, onPageChange }: { currentPage: number, totalItems: number, onPageChange: (page: number) => void }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-4">
        <nav className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded-md ${
                currentPage === page
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </nav>
      </div>
    );
  };

  return (
    <>
      <div className="mt-2">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="dark:bg-opacity-10 bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500 dark:text-white">No tienes citas pasadas.</p>
        </div>
      ) : (
        <>
          <div className="dark:bg-opacity-10 bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {appointments
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((appointment) => (
                <li key={appointment.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Link
                          to={`/${slugify(appointment.businesses?.name || '')}`}
                          className="text-sm font-medium text-indigo-600 truncate hover:underline"
                        >
                          {appointment.businesses?.name || 'Negocio sin nombre'}
                        </Link>
                        <p className={`ml-2 dark:text-gray-600 px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {appointment.status === 'confirmed' ? 'Confirmada' : 
                           appointment.status === 'pending' ? 'Pendiente' : 
                           appointment.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {reviews[appointment.id] ? null : appointment.status === 'completed' ? (
                          <button
                            onClick={() => setShowReviewFormId(appointment.id)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Dejar reseña
                          </button>
                        ) : (
                          <button
                            onClick={() => onReschedule(appointment)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Reagendar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex dark:text-white items-center text-sm text-gray-500">
                          {appointment.services?.name || 'Servicio sin nombre'}
                        </p>
                        <p className="mt-2 dark:text-white flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          Duración: {appointment.services?.duration || 0} min
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p className="dark:text-white">
                          {formatDate(appointment.start_time)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {reviews[appointment.id] && (
                    <div className="px-4 py-2 sm:px-6 dark:bg-opacity-10 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-sm dark:text-white font-medium text-gray-900 mb-2">Tu reseña</h3>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= reviews[appointment.id].rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {reviews[appointment.id].comment && (
                        <p className="mt-2 dark:text-white text-sm text-gray-700">{reviews[appointment.id].comment}</p>
                      )}
                    </div>
                  )}
                  {showReviewFormId === appointment.id && (
                    <div className="px-4 py-4 sm:px-6 bg-gray-50 rounded-md border border-gray-200 mt-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Escribe tu reseña</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Calificación</label>
                        <div className="flex space-x-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReview({ ...newReview, rating: star })}
                              className="focus:outline-none"
                            >
                              <Star className={`h-6 w-6 ${star <= newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Comentario</label>
                        <textarea
                          id="comment"
                          rows={3}
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowReviewFormId(null)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSubmitReview(appointment)}
                          disabled={submittingReview}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {submittingReview ? 'Enviando...' : 'Enviar reseña'}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <Pagination 
            currentPage={currentPage}
            totalItems={appointments.length}
            onPageChange={onPageChange}
          />
        </>
      )}
      </div>
    </>
  );
};

export default PastAppointments; 
