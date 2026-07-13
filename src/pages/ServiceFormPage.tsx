import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getService, getBusinessServices, createBusinessService, updateBusinessService } from '../lib/api';
import { supabase } from '../lib/supabase';
import { getMaxServices, getMaxImages, PLAN_LABELS } from '../lib/roles';
import { notifySuccess, notifyError } from '../lib/toast';
import SEO from '../components/SEO';
import type { RootState } from '../store';
import {
  ArrowLeft, ChevronLeft, ChevronRight, X, Store,
  Clock, User, Loader2, Image as ImageIcon, Plus,
  CheckCircle, XCircle, Sparkles, Save, Tag, FileText, DollarSign
} from 'lucide-react';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function ServiceFormSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pb-20 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 animate-pulse" />
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-24 animate-pulse" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2 animate-pulse" />
            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-3/4 animate-pulse" />
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceFormPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const userProfile = useSelector((state: RootState) => state.user.userProfile);
  const businesses = useSelector((state: RootState) => state.user.businesses);
  const plan = (userProfile?.plan as 'starter' | 'pro' | 'premium') || 'starter';

  const isEditing = !!serviceId;
  const maxServices = getMaxServices(plan);
  const maxImages = getMaxImages(plan);

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessLogo, setBusinessLogo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
    is_active: true,
    provider: '',
    image_urls: [] as string[],
    can_be_gifted: false,
    requires_payment: false,
    payment_percentage: 100,
    min_cancellation_hours: 48,
    cancellation_policy_text: '',
    min_reschedule_hours: 48,
    reschedule_policy_text: '',
  });

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }

        if (isEditing && serviceId) {
          const { success, data } = await getService(serviceId);
          if (!success || !data) {
            setError('Servicio no encontrado');
            setLoading(false);
            return;
          }

          setBusinessId(data.business_id);
          const biz = businesses?.find(b => b.id === data.business_id);
          setBusinessName(biz?.name || '');
          setBusinessLogo(biz?.logo_url || '');

          let images: string[] = [];
          if (Array.isArray(data.image_urls)) images = data.image_urls;
          else if (typeof data.image_urls === 'string') {
            try { images = JSON.parse(data.image_urls); } catch { images = []; }
          }

          setFormData({
            name: data.name,
            description: data.description,
            duration: data.duration.toString(),
            price: data.price.toString(),
            is_active: data.is_active,
            provider: data.provider || '',
            image_urls: images,
            can_be_gifted: data.can_be_gifted || false,
            requires_payment: data.requires_payment || false,
            payment_percentage: data.payment_percentage ?? 100,
            min_cancellation_hours: data.min_cancellation_hours ?? 48,
            cancellation_policy_text: data.cancellation_policy_text || '',
            min_reschedule_hours: data.min_reschedule_hours ?? 48,
            reschedule_policy_text: data.reschedule_policy_text || '',
          });
        } else {
          const userBizs = businesses || [];
          if (userBizs.length === 0) { navigate('/business/dashboard'); return; }

          const primaryBiz = userBizs[0];
          setBusinessId(primaryBiz.id);
          setBusinessName(primaryBiz.name);
          setBusinessLogo(primaryBiz.logo_url || '');
        }
      } catch {
        setError('Error al cargar la información');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [serviceId, businesses, navigate, isEditing]);

  const images = formData.image_urls;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const currentCount = formData.image_urls.length;
    const selectedCount = e.target.files.length;

    if (maxImages !== Infinity && currentCount + selectedCount > maxImages) {
      notifyError(`Solo puedes tener ${maxImages} imagen${maxImages === 1 ? '' : 'es'} por servicio en tu plan actual.`);
      return;
    }

    setIsUploading(true);
    const files = Array.from(e.target.files);
    const newUrls = [...formData.image_urls];

    try {
      for (const file of files) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          throw new Error(`El archivo ${file.name} no es una imagen válida (JPG, PNG, WEBP, GIF)`);
        }
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`El archivo ${file.name} supera el límite de 5MB`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${businessId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `service-galleries/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('business-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('business-assets')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      setFormData(prev => ({ ...prev, image_urls: newUrls }));
      notifySuccess('Imágenes subidas correctamente');
    } catch (err: any) {
      notifyError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!businessId) {
      notifyError('No se encontró el negocio');
      setIsSubmitting(false);
      return;
    }

    try {
      let response;
      if (isEditing && serviceId) {
        const { business_id: _b, ...updates } = {
          business_id: businessId,
          name: formData.name,
          description: formData.description,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price),
          is_active: formData.is_active,
          provider: formData.provider || '',
          image_urls: formData.image_urls,
          can_be_gifted: formData.can_be_gifted,
          requires_payment: formData.requires_payment,
          payment_percentage: formData.payment_percentage,
          min_cancellation_hours: formData.min_cancellation_hours,
          cancellation_policy_text: formData.cancellation_policy_text || '',
          min_reschedule_hours: formData.min_reschedule_hours,
          reschedule_policy_text: formData.reschedule_policy_text || '',
        };
        response = await updateBusinessService(serviceId, updates);
        if (response.success) {
          notifySuccess('Servicio actualizado correctamente');
        } else {
          throw new Error(response.error);
        }
      } else {
        if (maxServices !== Infinity) {
          const result = await getBusinessServices(businessId);
          const count = result.data?.length || 0;
          if (count >= maxServices) {
            throw new Error(`Has alcanzado el límite de ${maxServices} servicios en tu plan ${PLAN_LABELS[plan]}.`);
          }
        }
        const serviceData = {
          business_id: businessId,
          name: formData.name,
          description: formData.description,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price),
          is_active: formData.is_active,
          provider: formData.provider || '',
          image_urls: formData.image_urls,
          can_be_gifted: formData.can_be_gifted,
          requires_payment: formData.requires_payment,
          payment_percentage: formData.payment_percentage,
          min_cancellation_hours: formData.min_cancellation_hours,
          cancellation_policy_text: formData.cancellation_policy_text || '',
          min_reschedule_hours: formData.min_reschedule_hours,
          reschedule_policy_text: formData.reschedule_policy_text || '',
        };
        response = await createBusinessService(serviceData);
        if (response.success) {
          notifySuccess('Servicio creado correctamente');
        } else {
          throw new Error(response.error);
        }
      }
      navigate('/business/dashboard?tab=services');
    } catch (err: any) {
      const errMsg = err.message || 'Error al guardar el servicio';
      setError(errMsg);
      notifyError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <ServiceFormSkeleton />;

  if (error && !businessId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <Store className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Error</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button onClick={() => navigate('/business/dashboard')} className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all">
            Volver al panel
          </button>
        </div>
      </div>
    );
  }

  const paymentCalc = (parseFloat(formData.price) || 0) * formData.payment_percentage / 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pb-20">
      <SEO title={`${isEditing ? 'Editar' : 'Nuevo'} Servicio — ${businessName}`} />

      {/* ─── Sticky Header ─── */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/business/dashboard?tab=services')}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver a servicios</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
            {isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}
          </div>
          <div className="flex items-center">
            {businessLogo ? (
              <img src={businessLogo} className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Store className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-5xl mx-auto px-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ═══ LEFT (wide): Form ═══ */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8 space-y-6">

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-2xl">
                    <span className="text-sm font-bold text-red-700 dark:text-red-400">{error}</span>
                  </div>
                )}

                {/* Section: Info básica */}
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Información básica</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label htmlFor="name" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Nombre del servicio <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text" id="name" required
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                          placeholder="Ej: Corte de Cabello"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="description" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Descripción <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FileText className="absolute top-3.5 left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        <textarea
                          id="description" required
                          value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none font-medium"
                          placeholder="Describe brevemente el servicio..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="duration" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          Duración (min) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            type="number" id="duration" required min="5"
                            value={formData.duration}
                            onChange={e => setFormData({ ...formData, duration: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="price" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          Precio ($) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            type="number" id="price" required min="0" step="0.01"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="provider" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Encargado <span className="text-slate-400 font-normal">(opcional)</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text" id="provider"
                          value={formData.provider}
                          onChange={e => setFormData({ ...formData, provider: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                          placeholder="Nombre del profesional"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Galería */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Galería de imágenes</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {formData.image_urls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                        <img src={url} alt="" className="w-full h-full object-contain bg-slate-50 dark:bg-slate-800" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className={`relative aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-6 h-6 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Subir</span>
                        </>
                      )}
                      <input
                        type="file" className="hidden"
                        accept="image/*" multiple
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    {maxImages === Infinity
                      ? 'Galería ilimitada — sube todas las imágenes que quieras.'
                      : `Hasta ${maxImages} imagen${maxImages === 1 ? '' : 'es'} por servicio (${formData.image_urls.length}/${maxImages} usadas).`}
                  </p>
                </div>

                {/* Section: Configuración */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Configuración</h3>
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate mb-0">Activo</p>
                        <p className="text-[10px] text-slate-400 truncate mb-0">Visible al público</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-rose-200 dark:border-rose-800/50 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.can_be_gifted}
                        onChange={e => setFormData({ ...formData, can_be_gifted: e.target.checked })}
                        className="w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-rose-700 dark:text-rose-300 truncate mb-0">Regalable</p>
                        <p className="text-[10px] text-rose-500 truncate mb-0">Compra para otro</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-800/50 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.requires_payment}
                        onChange={e => setFormData({ ...formData, requires_payment: e.target.checked })}
                        className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-300 truncate mb-0">Pago online</p>
                        <p className="text-[10px] text-amber-500 truncate mb-0">Cobrar al reservar</p>
                      </div>
                    </label>
                  </div>

                  {/* Payment percentage */}
                  {formData.requires_payment && (
                    <div className="flex items-center gap-4 pl-3">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">% a cobrar</span>
                      <input
                        type="range"
                        id="payment_percentage"
                        value={formData.payment_percentage}
                        onChange={e => setFormData({ ...formData, payment_percentage: parseInt(e.target.value) })}
                        min="0" max="100"
                        className="flex-1 max-w-xs accent-amber-600"
                      />
                      <span className="text-sm font-black text-amber-600 w-12 text-right tabular-nums">{formData.payment_percentage}%</span>
                      <span className="text-[10px] text-slate-400 hidden sm:block">
                        ${paymentCalc.toLocaleString()} COP
                      </span>
                    </div>
                  )}

                  {/* Tiempos mínimos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="min_cancellation_hours" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Cancelación (horas mín.)
                      </label>
                      <input
                        type="number"
                        id="min_cancellation_hours"
                        value={formData.min_cancellation_hours}
                        onChange={e => setFormData({ ...formData, min_cancellation_hours: parseInt(e.target.value) || 0 })}
                        min="0" max="72"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="min_reschedule_hours" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Reagendamiento (horas mín.)
                      </label>
                      <input
                        type="number"
                        id="min_reschedule_hours"
                        value={formData.min_reschedule_hours}
                        onChange={e => setFormData({ ...formData, min_reschedule_hours: parseInt(e.target.value) || 0 })}
                        min="0" max="72"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm font-bold"
                      />
                    </div>
                  </div>

                  {/* Políticas — textareas lado a lado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="cancellation_policy_text" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Mensaje de cancelación
                      </label>
                      <textarea
                        id="cancellation_policy_text"
                        value={formData.cancellation_policy_text}
                        onChange={e => setFormData({ ...formData, cancellation_policy_text: e.target.value })}
                        placeholder="Ej: Cancelaciones con menos de 24h tienen cargo del 50%."
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="reschedule_policy_text" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Mensaje de reagendamiento
                      </label>
                      <textarea
                        id="reschedule_policy_text"
                        value={formData.reschedule_policy_text}
                        onChange={e => setFormData({ ...formData, reschedule_policy_text: e.target.value })}
                        placeholder="Ej: Reagenda con 12h de anticipación sin costo."
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Plan info */}
                {!isEditing && maxServices !== Infinity && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800/50">
                    <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Plan {PLAN_LABELS[plan]} — {maxServices === Infinity ? 'servicios ilimitados' : `máximo ${maxServices} servicios`}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row-reverse gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isEditing ? 'Guardar Cambios' : 'Crear Servicio'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/business/dashboard?tab=services')}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Cancelar
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ RIGHT (narrow): Gallery + Summary ═══ */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gallery */}
              {images.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden group">
                  <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                    <img
                      src={images[activeImageIndex]}
                      alt={formData.name || 'Vista previa'}
                      className="w-full h-full object-contain bg-slate-100 dark:bg-slate-800 cursor-zoom-in transition-transform duration-500 group-hover:scale-105"
                      onClick={() => setFullscreenImage(images[activeImageIndex])}
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex(prev => (prev - 1 + images.length) % images.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex(prev => (prev + 1) % images.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {images.map((_, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImageIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 aspect-[4/3] flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="w-10 h-10 mb-3" />
                  <p className="text-sm font-bold">Sin imágenes</p>
                  <p className="text-xs mt-1">Sube imágenes desde el formulario</p>
                </div>
              )}

              {/* ═══ Summary Card (live preview) ═══ */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-black text-lg text-slate-900 dark:text-white truncate">
                    {formData.name || 'Nombre del servicio'}
                  </h2>
                  {formData.is_active ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {formData.description || 'Sin descripción'}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {formData.duration && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                      <Clock className="w-4 h-4 text-primary-500" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{formData.duration} min</span>
                    </div>
                  )}
                  {formData.price && (
                    <div className="text-lg font-black text-primary-600 dark:text-primary-400">
                      ${parseFloat(formData.price).toLocaleString()}
                    </div>
                  )}
                </div>
                {formData.provider && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <User className="w-3.5 h-3.5" />
                    {formData.provider}
                  </div>
                )}
                {formData.can_be_gifted && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
                    <span>🎁</span> Se puede regalar
                  </div>
                )}
                {formData.requires_payment && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                    <span>🔒</span> Pago online ({formData.payment_percentage}%)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Lightbox */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200" onClick={() => setFullscreenImage(null)}>
          <button onClick={() => setFullscreenImage(null)} className="absolute top-5 right-5 p-2 text-white/50 hover:text-white transition-colors">
            <X className="w-7 h-7" />
          </button>
          <img src={fullscreenImage} className="max-w-full max-h-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200" alt="" />
        </div>
      )}
    </div>
  );
}
