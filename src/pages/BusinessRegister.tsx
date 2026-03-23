import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBusiness, updateUserProfile, getBusinessCategories, BusinessCategory } from '../lib/api';
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
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const { success, data } = await getBusinessCategories();
      if (success && data) setCategories(data);
    };
    fetchCategories();
  }, []);

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
        category_id: categoryId || null,
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
        // Actualizar perfil indicando que ahora es negocio
        await updateUserProfile(user.id, { is_business: true, business_id: business.id });
        // Redirigir al dashboard del negocio
        navigate('/business/dashboard');
      } else {
        throw new Error(apiError instanceof Error ? apiError.message : 'Error al registrar el negocio');
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar el negocio. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Registrar mi negocio</h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400 font-medium">
            Completa la información para registrar tu negocio y comenzar a recibir reservas profesionales.
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-8 flex items-start gap-3 animate-in fade-in duration-300">
            <svg className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold">{error}</span>
          </div>
        )}

        <div className="card p-8 sm:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <form onSubmit={handleSubmit} className="space-y-10">
            <section className="space-y-8">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Información general
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="businessName" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
                    Nombre del negocio
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    placeholder="Ej: Barbería El Corte Ideal"
                    className="w-full"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Cuéntanos qué haces y por qué eres el mejor..."
                    className="w-full"
                  />
                  <p className="mt-3 text-xs text-slate-500 font-medium italic">
                    Breve descripción de tu negocio y los servicios que ofreces.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
                    Dirección física
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Calle, Número, Ciudad, CP"
                    className="w-full"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="category" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
                    Categoría del negocio
                  </label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full appearance-none"
                  >
                    <option value="" disabled>Selecciona una categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Información de contacto
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
                    Teléfono comercial
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+34 000 000 000"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
                    Email de contacto
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="contacto@negocio.com"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
                    WhatsApp (opcional)
                  </label>
                  <input
                    type="tel"
                    id="whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+34 000 000 000"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="instagram" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
                    Instagram (opcional)
                  </label>
                  <div className="flex shadow-sm">
                    <span className="inline-flex items-center px-4 rounded-l-xl border-2 border-r-0 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold sm:text-sm transition-colors">
                      @
                    </span>
                    <input
                      type="text"
                      id="instagram"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="usuario"
                      className="flex-1 min-w-0 block w-full px-4 py-2 rounded-none rounded-r-xl focus:border-primary-500 focus:ring-0 sm:text-sm border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 transition-colors"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="facebook" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
                    Facebook (opcional)
                  </label>
                  <input
                    type="text"
                    id="facebook"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="facebook.com/tunegocio"
                    className="w-full"
                  />
                </div>
              </div>
            </section>

            <div className="pt-10 flex flex-col sm:flex-row justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary px-8 py-4 order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-12 py-4 shadow-xl shadow-primary-500/20 order-1 sm:order-2"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </span>
                ) : 'Crear mi negocio ahora'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessRegister; 
