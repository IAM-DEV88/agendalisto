import { useState } from 'react';
import toast from 'react-hot-toast';
import { Send, MessageCircle, Store, User, Phone, Tag, ChevronRight } from 'lucide-react';
import { insertLandingLead } from '../../lib/api';
import { AGENDAYA_WHATSAPP } from '../../lib/config';
import type { BusinessCategory } from '../../lib/api';
import type { CityConfig } from '../../lib/cities';

interface BusinessLeadFormProps {
  city: CityConfig;
  categories: BusinessCategory[];
}

interface FormState {
  name: string;
  business_name: string;
  whatsapp: string;
  category: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  business_name: '',
  whatsapp: '',
  category: '',
};

function buildWhatsAppMessage(city: CityConfig, form: FormState): string {
  let msg = `Hola, quiero registrar mi negocio "${form.business_name}" en AgendaYa ${city.name}.`;
  if (form.name) msg += `\n\nMe llamo: ${form.name}`;
  if (form.whatsapp) msg += `\nMi WhatsApp: ${form.whatsapp}`;
  if (form.category) msg += `\nCategoría: ${form.category}`;
  msg += '\n\nQuiero completar mi perfil y empezar a recibir clientes.';
  return encodeURIComponent(msg);
}

export default function BusinessLeadForm({ city, categories }: BusinessLeadFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.business_name.trim()) {
      toast.error('Por favor completa tu nombre y el nombre del negocio.');
      return;
    }

    setSubmitting(true);
    const result = await insertLandingLead({
      type: 'business',
      city_slug: city.slug,
      name: form.name.trim(),
      business_name: form.business_name.trim(),
      whatsapp: form.whatsapp.trim() || undefined,
      category: form.category || undefined,
    });
    setSubmitting(false);

    if (!result.success) {
      toast.error('Ocurrió un error. Intenta de nuevo o escríbenos por WhatsApp.');
      return;
    }

    setSubmitted(true);
    toast.success('¡Gracias! Te contactaremos pronto para activar tu perfil.');

    const msg = buildWhatsAppMessage(city, form);
    window.open(`https://wa.me/${AGENDAYA_WHATSAPP}?text=${msg}`, '_blank');
  };

  if (submitted) {
    return (
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-5">
            <MessageCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            ¡Revisa tu WhatsApp!
          </h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">
            Te abrimos una conversación para terminar de configurar tu perfil en minutos.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm(INITIAL_FORM);
            }}
            className="text-sm font-bold text-primary-600 hover:text-primary-500 transition-colors"
          >
            Registrar otro negocio
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="business-lead-form" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <Store className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Publica tu negocio gratis en {city.name}
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
            Déjanos tus datos y te ayudamos a crear tu perfil en menos de 5 minutos
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden"
        >
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Basic info section */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full name */}
                <div className="sm:col-span-2">
                  <label htmlFor="lead-name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tu nombre <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      id="lead-name"
                      value={form.name}
                      onChange={set('name')}
                      required
                      placeholder="Ej: Juan Pérez"
                      className="w-full pl-10"
                    />
                  </div>
                </div>

                {/* Business name */}
                <div className="sm:col-span-2">
                  <label htmlFor="lead-business" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre del negocio <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      id="lead-business"
                      value={form.business_name}
                      onChange={set('business_name')}
                      required
                      placeholder="Ej: Café de Altura Don Juan"
                      className="w-full pl-10"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label htmlFor="lead-whatsapp" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    WhatsApp <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      id="lead-whatsapp"
                      value={form.whatsapp}
                      onChange={set('whatsapp')}
                      placeholder="Ej: 3101234567"
                      className="w-full pl-10"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="lead-category" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Categoría <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      id="lead-category"
                      value={form.category}
                      onChange={set('category')}
                      className="w-full pl-10 appearance-none"
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 sm:p-8 bg-slate-50/80 dark:bg-slate-800/40">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-lg shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar y continuar por WhatsApp
                  </>
                )}
              </button>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-3">
                Al enviar aceptas que te contactemos para ayudarte con tu perfil. Tus datos están seguros.
              </p>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
