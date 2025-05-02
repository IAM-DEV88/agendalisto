import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBusinesses } from '../lib/api';
import type { Business } from '../lib/api';

// Fallback logo for businesses without an image
const FALLBACK_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

const ExploreBusinesses = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Mock categories for demonstration purposes
  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'beauty', name: 'Belleza' },
    { id: 'health', name: 'Salud' },
    { id: 'fitness', name: 'Fitness' },
    { id: 'food', name: 'Alimentación' },
    { id: 'education', name: 'Educación' },
  ];

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      setError(null);
      try {
        // Real implementation using Supabase
        const data = await getBusinesses(searchTerm, category !== 'all' ? category : undefined);
        setBusinesses(data);
      } catch (err) {
        setError('Error al cargar los negocios. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    // Set a small debounce for the search term
    const timer = setTimeout(() => {
      fetchBusinesses();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, category]);

  // No need for filteredBusinesses as filtering is now done at the database level
  // through the API call with search parameters

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Explora Negocios
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Encuentra servicios y reserva citas en los mejores negocios locales
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mt-10 flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-2/3">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar negocios..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Businesses Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No se encontraron negocios que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <Link
                key={business.slug}
                to={`/${business.slug}`}
                className="bg-white dark:bg-white dark:bg-opacity-10 overflow-hidden shadow hover:shadow-lg transition-shadow duration-300"
              >
                <div className="h-48 bg-gray-200 relative">
                  <img
                    src={business.logo_url || FALLBACK_LOGO}
                    alt={business.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = FALLBACK_LOGO }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{business.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-white">{business.address}</p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-white line-clamp-2">{business.description}</p>
                  <div className="mt-4">
                    <span className="inline-flex items-center px-3 py-0.5 text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-white dark:bg-opacity-10 dark:text-white">
                      Ver servicios
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreBusinesses; 
