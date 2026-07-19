import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { createBusiness, updateUserProfile, updateProfileRole, getBusinessCategories, BusinessCategory, getUserBusinesses } from '../lib/api';
import type { UserProfile } from '../lib/supabase';
import type { RootState } from '../store';
import { setBusinesses, setUserProfile } from '../store/userSlice';
import { getMaxBusinesses, PLAN_LABELS } from '../lib/roles';
import { generateBusinessDescription } from '../lib/ai';
import DescriptionGenerator from '../components/DescriptionGenerator';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import PhoneInput from '../components/ui/PhoneInput';
import LocationPicker from '../components/ui/LocationPicker';
import ConnectedPillCard from '../components/ui/ConnectedPillCard';
import type { Tab } from '../components/ui/TabNav';
import {
  Store,
  Building2,
  MapPin,
  Star,
  Tag,
  Mail,
  MessageCircle,
  Instagram,
  Facebook,
  Globe,
  Check,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  PenLine,
  Sparkles,
  Crown,
  Crosshair,
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
  lat: null as number | null,
  lng: null as number | null,
};

const BusinessRegister = ({ user }: BusinessRegisterProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userProfile = useSelector((state: RootState) => state.user.userProfile);
  const businesses = useSelector((state: RootState) => state.user.businesses);
  const plan = (userProfile?.plan as 'starter' | 'pro' | 'premium') || 'starter';
  const maxBusinesses = getMaxBusinesses(plan);
  const [form, setForm] = useState({ ...initialForm, email: user?.email || '' });
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugPreview, setSlugPreview] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showcaseOnly, setShowcaseOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const headerStickyRef = useRef<HTMLDivElement>(null);
  const [headerStuck, setHeaderStuck] = useState(true);

  useEffect(() => {
    const el = headerStickyRef.current;
    if (!el) return;
    const update = () => setHeaderStuck(el.getBoundingClientRect().top < 65);
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const existingCount = businesses.length;

  const tabStatus = useCallback((tabId: string): Tab['status'] => {
    const g = form.businessName.trim() && form.categoryId && form.description.trim() && form.address.trim();
    const c = form.phone.trim() && form.email.trim();
    switch (tabId) {
      case 'general': return g ? 'complete' : 'incomplete';
      case 'contacto': return c ? 'complete' : 'incomplete';
      case 'review': return (g && c) ? 'complete' : 'incomplete';
      default: return 'incomplete';
    }
  }, [form]);

  const registerTabs: Tab[] = useMemo(() => [
    { id: 'general', label: 'General', status: tabStatus('general') },
    { id: 'contacto', label: 'Contacto', status: tabStatus('contacto') },
    { id: 'review', label: 'Revisar y crear', status: tabStatus('review') },
  ], [tabStatus]);

  // Redirect if user hit the limit
  useEffect(() => {
    if (existingCount >= maxBusinesses) {
      if (plan === 'pro') {
        toast.error('Has alcanzado el límite de 5 negocios de tu plan Pro. Actualiza a Premium para crear negocios ilimitados.', { id: 'business-limit' });
      }
      navigate('/business/onboarding', { replace: true });
    }
  }, [existingCount, maxBusinesses, navigate, plan]);

  useEffect(() => {
    getBusinessCategories().then(({ success, data }) => {
      if (success && data) setCategories(data);
    });
  }, []);

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  const handlePhoneChange = (field: string) => (value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
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

    if (existingCount >= maxBusinesses) {
      const upgradeMsg = plan === 'starter'
        ? 'Actualiza a Pro o Premium para crear más negocios.'
        : plan === 'pro'
          ? 'Actualiza a Premium para crear negocios ilimitados.'
          : '';
      setError(`Has alcanzado el límite de ${maxBusinesses === Infinity ? 'negocios ilimitados' : `${maxBusinesses} negocios`} de tu plan ${PLAN_LABELS[plan]}. ${upgradeMsg}`);
      if (plan !== 'premium') {
        toast.error(`Límite alcanzado: tu plan ${PLAN_LABELS[plan]} permite hasta ${maxBusinesses} negocios. ${upgradeMsg}`, { id: 'business-limit' });
      }
      setLoading(false);
      return;
    }

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
        lat: form.lat,
        lng: form.lng,
        showcase_only: showcaseOnly,
      };

      const { success, business, error: apiError } = await createBusiness(businessData);

      if (success && business) {
        await updateUserProfile(user.id, { is_business: true, business_id: business.id });
        const currentRole = userProfile?.role;
        if (currentRole !== 'moderator' && currentRole !== 'admin') {
          await updateProfileRole(user.id, 'business_owner');
          dispatch(setUserProfile({ ...userProfile!, role: 'business_owner', business_id: business.id }));
        } else {
          dispatch(setUserProfile({ ...userProfile!, business_id: business.id }));
        }
        const bizRes = await getUserBusinesses(user.id);
        if (bizRes.success && bizRes.businesses) dispatch(setBusinesses(bizRes.businesses));
        setSubmitted(true);
        setTimeout(() => navigate('/business/onboarding'), 1500);
      } else {
        const msg = apiError instanceof Error ? apiError.message
          : typeof apiError === 'object' && apiError !== null
            ? JSON.stringify(apiError)
            : 'Error al registrar el negocio';
        console.error('[BusinessRegister] createBusiness error:', apiError);
        throw new Error(msg);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar el negocio. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4 transition-colors duration-200">
        <div className="text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-200 dark:ring-emerald-800">
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

      <div className="max-w-7xl mx-auto px-4">
        {/* ═══ BACK BUTTON ═══ */}
        <div className="pt-4 pb-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
        </div>

        {/* ═══ STICKY HEADER ═══ */}
        <div
          ref={headerStickyRef}
          className={`sticky top-16 z-30 transition-colors duration-150 ${
            headerStuck
              ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 dark:border-slate-800/50 w-[100vw] ml-[calc(-50vw+50%)] pl-[calc(50vw-50%)] pr-[calc(50vw-50%)]'
              : 'bg-transparent'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full py-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center ring-2 ring-white dark:ring-slate-800 shadow shrink-0">
                <Store className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate mb-0">
                  🌐 Tu página web gratis
                </h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mb-0">
                  Crea tu página profesional y recibe reservas online
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ ERROR + BANNER ═══ */}
        <div className="space-y-5 mt-5 mb-6">
          {error && (
            <div className="flex items-start gap-3 px-5 py-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {existingCount > 0 && existingCount < maxBusinesses && (
            <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <Crown className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {maxBusinesses === Infinity ? (
                  <>¡Genial! Ya tienes <strong>{existingCount}</strong> {existingCount === 1 ? 'negocio' : 'negocios'} en tu plan {PLAN_LABELS[plan]}. Sin límites para seguir creando 🚀</>
                ) : (
                  <>Llevas <strong>{existingCount}</strong> de <strong>{maxBusinesses}</strong> negocio{maxBusinesses !== 1 ? 's' : ''} en tu plan {PLAN_LABELS[plan]}.
                  {existingCount === maxBusinesses - 1 && plan !== 'premium' && (
                    <span> <a href="/plans" className="font-bold underline hover:text-amber-600">Actualiza tu plan</a> para crear más.</span>
                  )}</>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ PILL TABS + CONNECTED CARD ═══ */}
        <ConnectedPillCard tabs={registerTabs} activeTabId={activeTab} onTabChange={setActiveTab} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100" cardClassName="shadow-xl shadow-slate-200/50 dark:shadow-none">
            <form onSubmit={handleSubmit}>

                {/* ─── TAB: GENERAL ─── */}
                {activeTab === 'general' && (
                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-lg">
                        <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">Información general</h2>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Datos básicos de tu negocio</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                        <div className="flex justify-between items-start mt-1.5">
                          <p className="text-xs text-slate-400 font-medium mt-0.5">Breve descripción de tu negocio.</p>
                          <span className={`text-xs font-bold mt-0.5 ${form.description.length > 450 ? 'text-amber-500' : 'text-slate-400'}`}>
                            {form.description.length}/500
                          </span>
                        </div>
                        <DescriptionGenerator
                          currentValue={form.description}
                          onSelect={value => setForm(prev => ({ ...prev, description: value }))}
                          generateFn={() => {
                            const category = categories.find(c => c.id === form.categoryId);
                            return generateBusinessDescription(form.businessName, category?.name);
                          }}
                          optionLabels={['Enfoque profesional', 'Enfoque cercano']}
                          validate={() => !form.businessName.trim() ? 'Primero escribe el nombre del negocio' : null}
                        />
                      </div>

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

                    {/* Navigation */}
                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setActiveTab('contacto')}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm"
                      >
                        Siguiente
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── TAB: CONTACTO ─── */}
                {activeTab === 'contacto' && (
                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                        <MessageCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">Información de contacto</h2>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cómo pueden encontrarte tus clientes</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Teléfono <span className="text-red-500">*</span>
                        </label>
                        <PhoneInput
                          id="phone"
                          value={form.phone}
                          onChange={handlePhoneChange('phone')}
                          placeholder="Número de teléfono"
                          required
                        />
                      </div>

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

                      <div>
                        <label htmlFor="whatsapp" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          WhatsApp <span className="text-slate-400 font-normal">(opcional)</span>
                        </label>
                        <PhoneInput
                          id="whatsapp"
                          value={form.whatsapp}
                          onChange={handlePhoneChange('whatsapp')}
                          placeholder="Número de WhatsApp"
                        />
                      </div>

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

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                          <Crosshair className="w-4 h-4 text-slate-400" />
                          Ubicación en el mapa <span className="text-slate-400 font-normal">(opcional)</span>
                        </label>
                        <LocationPicker
                          lat={form.lat}
                          lng={form.lng}
                          onChange={(lat, lng) => setForm(prev => ({ ...prev, lat, lng }))}
                        />
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setActiveTab('general')}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('review')}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm"
                      >
                        Revisar
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── TAB: REVISAR ─── */}
                {activeTab === 'review' && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Summary */}
                    <div className="p-6 sm:p-8 space-y-6">
                      <div className="flex items-center gap-3 pb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                          <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-slate-900 dark:text-white">Revisa tu negocio</h2>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Confirma que todo esté correcto antes de crear</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Negocio</p>
                          <p className="font-bold text-slate-900 dark:text-white truncate">{form.businessName || '—'}</p>
                        </div>
                        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Categoría</p>
                          <p className="font-bold text-slate-900 dark:text-white truncate">{categories.find(c => c.id === form.categoryId)?.name || '—'}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dirección</p>
                            <p className="font-bold text-slate-900 dark:text-white">{form.address || '—'}</p>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teléfono</p>
                          <p className="font-bold text-slate-900 dark:text-white">{form.phone || '—'}</p>
                        </div>
                        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                          <p className="font-bold text-slate-900 dark:text-white truncate">{form.email || '—'}</p>
                        </div>
                      </div>

                      {/* Location indicator */}
                      {form.lat && form.lng && (
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <MapPin className="w-3.5 h-3.5" />
                          Ubicación en mapa configurada
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    {form.businessName && (
                      <div className="border-t border-slate-100 dark:border-slate-800">
                        <div className="p-6 sm:p-8">
                          <div className="flex items-center gap-3 pb-4">
                            <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-lg">
                              <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-slate-900 dark:text-white">Vista previa</h3>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Así se verá tu página pública</p>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                            <div className="p-4 sm:p-5">
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className="shrink-0">
                                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center ring-2 ring-white dark:ring-slate-800 shadow">
                                    <Store className="h-6 w-6 text-primary-500" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate mb-0">
                                    {form.businessName}
                                  </h4>
                                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mb-0">
                                    <Store className="w-3 h-3 shrink-0" />
                                    {categories.find(c => c.id === form.categoryId)?.name || form.description?.substring(0, 60) || 'Perfil público'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                                      <Star className="w-2.5 h-2.5 fill-current" />5.0
                                    </span>
                                    {plan !== 'starter' && (
                                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                        plan === 'premium'
                                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                      }`}>{PLAN_LABELS[plan]}</span>
                                    )}
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-[11px] font-bold">
                                      <Store className="w-2.5 h-2.5" />Online
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Showcase option */}
                    <div className="px-6 sm:px-8 py-5">
                      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/50">
                        <input
                          type="checkbox"
                          id="showcaseOnly"
                          checked={showcaseOnly}
                          onChange={e => setShowcaseOnly(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded-lg border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <label htmlFor="showcaseOnly" className="font-bold text-sm text-amber-800 dark:text-amber-300 cursor-pointer">
                            Solo mostrar mi información (escaparate gratuito)
                          </label>
                          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                            Por ahora solo quiero aparecer en AgendaYa para que me conozcan. Activaré reservas online después.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-800/40">
                      <button
                        type="button"
                        onClick={() => setActiveTab('contacto')}
                        className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all w-full sm:w-auto justify-center"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </button>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => navigate('/dashboard')}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex items-center justify-center gap-2 px-10 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:-translate-y-0"
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
                    </div>
                  </div>
                )}

              </form>
        </ConnectedPillCard>

      </div>
    </div>
  );
};

export default BusinessRegister;
