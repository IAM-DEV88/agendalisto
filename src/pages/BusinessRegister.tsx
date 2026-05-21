import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBusiness, updateUserProfile, getBusinessCategories, BusinessCategory } from '../lib/api';
import type { UserProfile } from '../lib/supabase';
import SEO from '../components/SEO';
import {
  Store,
  Building2,
  MapPin,
  Tag,
  Phone,
  Mail,
  MessageCircle,
  Instagram,
  Facebook,
  Globe,
  Check,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  PenLine,
  Sparkles,
} from 'lucide-react';

type BusinessRegisterProps = {
  user: UserProfile | null;
};

const initialForm = {
  businessName: '',
  description: '',
  address: '',
  categoryId: '',
  phone: '',
  email: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
};

const BusinessRegister = ({ user }: BusinessRegisterProps) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...initialForm, email: user?.email || '' });
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugPreview, setSlugPreview] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getBusinessCategories().then(({ success, data }) => {
      if (success && data) setCategories(data);
    });
  }, []);

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  const slug = useMemo(() =>
    form.businessName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, ''),
    [form.businessName]
  );

  useEffect(() => {
    setSlugPreview(slug);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('Debes iniciar sesión para registrar un negocio');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const businessData = {
        owner_id: user.id,
        slug,
        name: form.businessName,
        description: form.description,
        address: form.address,
        category_id: form.categoryId || null,
        phone: form.phone,
        email: form.email,
        whatsapp: form.whatsapp || null,
        instagram: form.instagram || null,
        facebook: form.facebook || null,
        logo_url: null,
        website: null,
        lat: null,
        lng: null,
      };

      const { success, business, error: apiError } = await createBusiness(businessData);

      if (success && business) {
        await updateUserProfile(user.id, { is_business: true, business_id: business.id });
        setSubmitted(true);
        setTimeout(() => navigate('/business/dashboard'), 1500);
      } else {
        throw new Error(apiError instanceof Error ? apiError.message : 'Error al registrar el negocio');
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar el negocio. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4 transition-colors duration-200">
        <div className="text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-200 dark:ring-emerald-800">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
            ¡Negocio creado!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
            Redirigiendo a tu panel de control...
          </p>
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      <SEO
        title="Registrar mi negocio"
        description="Registra tu negocio en AgendaYa y comienza a recibir reservas online de forma profesional."
      />
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-5 ring-1 ring-primary-200 dark:ring-primary-800">
            <Store className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Registrar mi negocio
          </h1>
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
            Completa la información para recibir reservas profesionales de tus clientes.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 px-5 py-4 mb-8 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <form onSubmit={handleSubmit} className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* ═══ SECTION: INFORMACIÓN GENERAL ═══ */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 pb-2">
                <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-xl">
                  <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Información general</h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Datos básicos de tu negocio</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Nombre */}
                <div className="sm:col-span-2">
                  <label htmlFor="businessName" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre del negocio <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      id="businessName"
                      value={form.businessName}
                      onChange={updateField('businessName')}
                      required
                      placeholder="Ej: Barbería El Corte Ideal"
                      className="w-full pl-10"
                    />
                  </div>
                  {slugPreview && form.businessName.length > 2 && (
                    <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1.5">
                      <Globe className="w-3 h-3" />
                      URL: <span className="font-mono font-bold text-primary-500">/{slugPreview}</span>
                    </p>
                  )}
                </div>

                {/* Categoría */}
                <div className="sm:col-span-2">
                  <label htmlFor="category" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      id="category"
                      value={form.categoryId}
                      onChange={updateField('categoryId')}
                      required
                      className="w-full pl-10 appearance-none"
                    >
                      <option value="" disabled>Selecciona una categoría</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-90" />
                  </div>
                </div>

                {/* Descripción */}
                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <PenLine className="absolute top-3.5 left-3.5 w-4 h-4 text-slate-400" />
                    <textarea
                      id="description"
                      rows={4}
                      value={form.description}
                      onChange={updateField('description')}
                      required
                      placeholder="Cuéntanos qué haces y por qué eres el mejor..."
                      className="w-full pl-10"
                      maxLength={500}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <p className="text-xs text-slate-400 font-medium">Breve descripción de tu negocio.</p>
                    <span className={`text-xs font-bold ${form.description.length > 450 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {form.description.length}/500
                    </span>
                  </div>
                </div>

                {/* Dirección */}
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      id="address"
                      value={form.address}
                      onChange={updateField('address')}
                      required
                      placeholder="Calle, Número, Ciudad, CP"
                      className="w-full pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ SECTION: CONTACTO ═══ */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 pb-2">
                <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                  <MessageCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Información de contacto</h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cómo pueden encontrarte tus clientes</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Teléfono */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      id="phone"
                      value={form.phone}
                      onChange={updateField('phone')}
                      required
                      placeholder="+34 000 000 000"
                      className="w-full pl-10"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      id="email"
                      value={form.email}
                      onChange={updateField('email')}
                      required
                      placeholder="contacto@negocio.com"
                      className="w-full pl-10"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    WhatsApp <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input
                      type="tel"
                      id="whatsapp"
                      value={form.whatsapp}
                      onChange={updateField('whatsapp')}
                      placeholder="+34 000 000 000"
                      className="w-full pl-10"
                    />
                  </div>
                </div>

                {/* Instagram */}
                <div>
                  <label htmlFor="instagram" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Instagram <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                    <input
                      type="text"
                      id="instagram"
                      value={form.instagram}
                      onChange={updateField('instagram')}
                      placeholder="@usuario"
                      className="w-full pl-10"
                    />
                  </div>
                </div>

                {/* Facebook */}
                <div className="sm:col-span-2">
                  <label htmlFor="facebook" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Facebook <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Facebook className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <input
                      type="text"
                      id="facebook"
                      value={form.facebook}
                      onChange={updateField('facebook')}
                      placeholder="https://facebook.com/tunegocio"
                      className="w-full pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ PREVIEW / SUMMARY ═══ */}
            {form.businessName && (
              <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-800/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3 pb-4">
                  <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-xl">
                    <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Vista previa</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Así se verá tu página pública</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-lg">
                      {form.businessName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 dark:text-white truncate">{form.businessName}</p>
                      {form.address && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{form.address}</p>
                      )}
                    </div>
                  </div>
                  {form.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{form.description}</p>
                  )}
                  {form.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{form.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ ACTIONS ═══ */}
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all w-full sm:w-auto justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:-translate-y-0"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Store className="w-4 h-4" />
                    Crear mi negocio
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessRegister;
