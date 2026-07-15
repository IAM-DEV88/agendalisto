import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createBusinessService, getBusinessCategories, setBusinessHours } from '../lib/api';

import { getDefaultServices } from '../lib/defaultServices';
import { toast } from 'react-hot-toast';
import SEO from '../components/SEO';
import {
  ArrowLeft, ArrowRight, Check, X, Copy,
} from 'lucide-react';

interface OnboardingStep {
  id: 'services' | 'hours' | 'share';
  label: string;
}

const STEPS: OnboardingStep[] = [
  { id: 'services', label: 'Servicios' },
  { id: 'hours', label: 'Horarios' },
  { id: 'share', label: 'Compartir' },
];

const DEFAULT_HOURS: Record<string, { open: string; close: string; closed: boolean }> = {
  monday: { open: '08:00', close: '18:00', closed: false },
  tuesday: { open: '08:00', close: '18:00', closed: false },
  wednesday: { open: '08:00', close: '18:00', closed: false },
  thursday: { open: '08:00', close: '18:00', closed: false },
  friday: { open: '08:00', close: '18:00', closed: false },
  saturday: { open: '08:00', close: '13:00', closed: false },
  sunday: { open: '08:00', close: '13:00', closed: true },
};

const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};

export default function BusinessOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string>('');
  const [categoryName, setCategoryName] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newService, setNewService] = useState({ name: '', duration: 60, description: '', price: '' });
  const [services, setServices] = useState<{ name: string; duration: number; description: string; price?: string }[]>([]);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [hours, setHours] = useState(DEFAULT_HOURS);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: profile } = await supabase
        .from('agendaya_profiles')
        .select('business_id')
        .eq('id', user.id)
        .single();

      if (!profile?.business_id) { navigate('/business/register'); return; }

      setBusinessId(profile.business_id);

      const { data: biz } = await supabase
        .from('agendaya_businesses')
        .select('slug, category_id')
        .eq('id', profile.business_id)
        .single();

      if (biz) {
        setBusinessSlug(biz.slug);
      }

      const { data: cats } = await getBusinessCategories();
      if (cats && biz?.category_id) {
        const cat = cats.find(c => c.id === biz.category_id);
        if (cat) setCategoryName(cat.name);
      }

      setLoading(false);
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (categoryName && step === 0 && services.length === 0 && !showSuggestModal) {
      const defaults = getDefaultServices(categoryName);
      if (defaults.length > 0) {
        setShowSuggestModal(true);
      }
    }
  }, [categoryName, step, services.length, showSuggestModal]);

  const acceptDefaults = () => {
    const defaults = getDefaultServices(categoryName);
    setServices(defaults.map(d => ({ ...d, price: '' })));
    setShowSuggestModal(false);
    toast.success(`Se agregaron ${defaults.length} servicios sugeridos`);
  };

  const skipDefaults = () => {
    setShowSuggestModal(false);
  };

  const addService = () => {
    if (!newService.name.trim()) {
      toast.error('Ingresa el nombre del servicio');
      return;
    }
    setServices([...services, { ...newService, price: newService.price }]);
    setNewService({ name: '', duration: 60, description: '', price: '' });
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const saveStep1 = async () => {
    if (services.length === 0) {
      toast.error('Agrega al menos un servicio');
      return false;
    }
    setSaving(true);
    for (const svc of services) {
      const priceNum = svc.price ? parseFloat(svc.price) : 0;
      await createBusinessService({
        business_id: businessId!,
        name: svc.name,
        duration: svc.duration,
        description: svc.description,
        price: !isNaN(priceNum) ? priceNum : 0,
        is_active: true,
        image_urls: [],
      });
    }
    setSaving(false);
    return true;
  };

  const saveStep2 = async () => {
    setSaving(true);
    const DAY_MAP: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const hoursArray = Object.entries(hours).map(([day, cfg]) => ({
      business_id: businessId!,
      day_of_week: DAY_MAP[day],
      start_time: cfg.open,
      end_time: cfg.close,
      is_closed: cfg.closed,
    }));
    await setBusinessHours(hoursArray);
    setSaving(false);
    return true;
  };

  const toggleDay = (day: string) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], closed: !prev[day].closed } }));
  };

  const updateTime = (day: string, field: 'open' | 'close', value: string) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleNext = async () => {
    if (step === 0) {
      const ok = await saveStep1();
      if (!ok) return;
    } else if (step === 1) {
      const ok = await saveStep2();
      if (!ok) return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      navigate('/business/dashboard');
      toast.success('¡Negocio configurado! Bienvenido a tu panel.');
    }
  };

  const handleSkip = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      navigate('/business/dashboard');
      toast.success('Puedes completar la configuración después');
    }
  };

  const progressPercent = ((step + 1) / STEPS.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <SEO title="Configurar negocio" description="Completa la configuración de tu negocio en AgendaYa." />

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {STEPS[step].id === 'services' ? '¿Qué servicios ofreces?' :
             STEPS[step].id === 'hours' ? 'Configura tu horario' :
             'Comparte tu negocio'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            {STEPS[step].id === 'services' ? 'Empieza con el principal. Siempre podrás agregar más después.' :
             STEPS[step].id === 'hours' ? 'Define los días y horas que atiendes.' :
             'Invita a tus clientes a reservar desde tu perfil público.'}
          </p>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-8">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-center text-xs font-bold text-slate-400 mb-8">
          Paso {step + 1} de {STEPS.length}
        </p>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8">
          {/* Step 1: Services */}
          {step === 0 && (
            <div className="space-y-6">
              {showSuggestModal && (
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-5 border border-primary-200 dark:border-primary-800/50">
                  <p className="font-bold text-primary-800 dark:text-primary-300 mb-2">
                    ¿Quieres que agreguemos servicios sugeridos para <strong>{categoryName}</strong>?
                  </p>
                  <p className="text-sm text-primary-600 dark:text-primary-400 mb-4">
                    {getDefaultServices(categoryName).length} servicios predeterminados (precios los completas tú).
                  </p>
                  <div className="flex gap-3">
                    <button onClick={acceptDefaults} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-lg transition-all">
                      Agregar sugeridos
                    </button>
                    <button onClick={skipDefaults} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                      Empezar vacío
                    </button>
                  </div>
                </div>
              )}

              {services.map((svc, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{svc.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{svc.duration} min · {svc.description}</p>
                  </div>
                  {svc.price && <span className="text-sm font-black text-primary-600 mx-3">${parseFloat(svc.price).toLocaleString()}</span>}
                  <button onClick={() => removeService(i)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="Nombre del servicio"
                  className="w-full"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={newService.duration}
                    onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) || 60 })}
                    placeholder="Duración (min)"
                    className="w-full"
                    min={15}
                    max={480}
                  />
                  <input
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    placeholder="Precio ($)"
                    className="w-full"
                    min={0}
                  />
                </div>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Descripción (opcional)"
                  className="w-full h-20 resize-none"
                />
                <button
                  onClick={addService}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  + Agregar otro servicio
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Hours */}
          {step === 1 && (
            <div className="space-y-4">
              {Object.entries(hours).map(([day, config]) => (
                <div key={day} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  config.closed
                    ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-60'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                }`}>
                  <button
                    onClick={() => toggleDay(day)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      config.closed
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        : 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                    }`}
                  >
                    {config.closed ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>

                  <span className={`font-bold text-sm w-20 ${config.closed ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                    {DAY_LABELS[day]}
                  </span>

                  {!config.closed && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={config.open}
                        onChange={(e) => updateTime(day, 'open', e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                      />
                      <span className="text-slate-400 text-xs font-bold">a</span>
                      <input
                        type="time"
                        value={config.close}
                        onChange={(e) => updateTime(day, 'close', e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                      />
                    </div>
                  )}

                  {config.closed && (
                    <span className="text-xs font-bold text-slate-400 flex-1 text-right">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Share */}
          {step === 2 && (
            <ShareStep businessSlug={businessSlug} />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Anterior
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-700 dark:hover:text-slate-300 transition-all"
              >
                {step < STEPS.length - 1 ? 'Lo haré después' : 'Ir al panel'}
              </button>
              <button
                onClick={handleNext}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20"
              >
                {saving ? 'Guardando...' : step < STEPS.length - 1 ? 'Siguiente' : 'Ir al panel'}
                {!saving && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareStep({ businessSlug }: { businessSlug: string }) {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${window.location.origin}/${businessSlug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('¡Enlace copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const shareVia = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  return (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 mx-auto rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
        <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <p className="text-slate-600 dark:text-slate-400 text-sm">
        ¡Todo listo! Comparte tu enlace público para que los clientes puedan reservar.
      </p>

      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 truncate">
        <span className="truncate">{publicUrl}</span>
        <button
          onClick={handleCopy}
          className={`flex-shrink-0 p-2 rounded-lg transition-all ${
            copied ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => shareVia(`https://wa.me/?text=${encodeURIComponent('Reserva tus servicios en ' + publicUrl)}`)}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border border-emerald-200 dark:border-emerald-800/50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </button>
        <button
          onClick={() => shareVia(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Reserva en ' + businessSlug + ' desde AgendaYa')}&url=${encodeURIComponent(publicUrl)}`)}
          className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          Twitter / X
        </button>
        <button
          onClick={() => shareVia(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-200 dark:border-blue-800/50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </button>
      </div>
    </div>
  );
}
