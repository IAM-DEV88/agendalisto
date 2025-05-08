import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import Pagination from '../ui/Pagination';
import { getBusinessReviews, Review } from '../../lib/api';

interface BusinessHistorySectionProps {
  businessId: string;
  appointments: any[];
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="dark:bg-opacity-10 bg-gray-50 shadow overflow-hidden sm:rounded-md p-6 text-center">
        <p className="text-gray-500 dark:text-white">No hay citas pasadas.</p>
      </div>
    );
  }

  return (
    <div className="dark:bg-opacity-10 bg-gray-50 shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {appointments.map((appt: any) => {
          const review = reviewsMap[appt.id];
          return (
            <li key={appt.id} className="px-4 py-4 sm:px-6">
              <div className="flex flex-col justify-between space-y-2">
                <div>
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-200">{appt.services?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-white">Cliente: {appt.profiles?.full_name || appt.user_id}</p>
                  <p className="text-sm text-gray-500 dark:text-white">Fecha: {formatDate(appt.start_time)}</p>
                </div>
                {appt.status === 'cancelled' ? (
                  <p className="inline-flex ml-2 items-center px-2 py-0.5 leading-5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Cancelada
                  </p>
                ) : review ? (
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={`star-filled-${i}`} className="h-5 w-5 text-yellow-400" />
                    ))}
                    {Array.from({ length: 5 - review.rating }).map((_, i) => (
                      <Star key={`star-empty-${i}`} className="h-5 w-5 text-gray-300" />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-yellow-500">Sin reseña todavía</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(appointments.length / itemsPerPage)}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default BusinessHistorySection; 