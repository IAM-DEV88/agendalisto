import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBusiness } from '../lib/api';
import type { UserProfile } from '../lib/supabase';

type BusinessRegisterProps = {
  user: UserProfile | null;
};

const BusinessRegister = ({ user }: BusinessRegisterProps) => {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('Debes iniciar sesión para registrar un negocio');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const slug = businessName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      const businessData = {
        owner_id: user.id,
        slug,
        name: businessName,
        description,
        address,
        phone,
        email,
        whatsapp: whatsapp || null,
        instagram: instagram || null,
        facebook: facebook || null,
        logo_url: null,
        website: null,
        lat: null,
        lng: null
      };

      const { success, business, error: apiError } = await createBusiness(businessData);
      
      if (success && business) {
        // Redirigir al dashboard del negocio
        navigate('/business/dashboard');
      } else {
        throw new Error(apiError instanceof Error ? apiError.message : 'Error al registrar el negocio');
      }
    } catch (err: any) {
      console.error('Error registering business:', err);
      setError(err.message || 'Error al registrar el negocio. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900">Registrar mi negocio</h1>
            <p className="mt-2 text-sm text-gray-600">
              Completa la información para registrar tu negocio y comenzar a recibir reservas.
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Información general</h3>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                      Nombre del negocio
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="businessName"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Descripción
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Breve descripción de tu negocio y los servicios que ofreces.
                    </p>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Dirección
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Información de contacto</h3>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <div className="mt-1">
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Correo electrónico
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
                      WhatsApp (opcional)
                    </label>
                    <div className="mt-1">
                      <input
                        type="tel"
                        id="whatsapp"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">
                      Instagram (opcional)
                    </label>
                    <div className="mt-1">
                      <div className="flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          @
                        </span>
                        <input
                          type="text"
                          id="instagram"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">
                      Facebook (opcional)
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="facebook"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {loading ? 'Registrando...' : 'Registrar negocio'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessRegister; 