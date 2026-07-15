import { useState } from 'react';
import { PLANS } from '../../lib/roles';
import { adminUpdateBusiness, getBusinessCategories } from '../../lib/api';
import type { AdminBusiness, BusinessCategory } from '../../lib/api';
import { notifySuccess, notifyError } from '../../lib/toast';
import { X, Building2 } from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface BusinessDetailModalProps {
  business: AdminBusiness;
  onClose: () => void;
  onUpdated: (updated: AdminBusiness) => void;
}

const BusinessDetailModal = ({ business, onClose, onUpdated }: BusinessDetailModalProps) => {
  useLockBodyScroll(true);
  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description);
  const [address, setAddress] = useState(business.address);
  const [phone, setPhone] = useState(business.phone || '');
  const [email, setEmail] = useState(business.email || '');
  const [whatsapp, setWhatsapp] = useState(business.whatsapp || '');
  const [instagram, setInstagram] = useState(business.instagram || '');
  const [facebook, setFacebook] = useState(business.facebook || '');
  const [website, setWebsite] = useState(business.website || '');
  const [plan, setPlan] = useState(business.plan);
  const [categoryId, setCategoryId] = useState(business.category_id || '');
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useState(() => {
    getBusinessCategories().then(res => {
      if (res.success && res.data) {
        setCategories(res.data);
      }
      setLoadingCategories(false);
    });
  });

  const hasChanges =
    name !== business.name ||
    description !== business.description ||
    address !== business.address ||
    phone !== (business.phone || '') ||
    email !== (business.email || '') ||
    whatsapp !== (business.whatsapp || '') ||
    instagram !== (business.instagram || '') ||
    facebook !== (business.facebook || '') ||
    website !== (business.website || '') ||
    plan !== business.plan ||
    categoryId !== (business.category_id || '');

  const handleSave = async () => {
    setSaving(true);
    const res = await adminUpdateBusiness(business.id, {
      name: name !== business.name ? name : undefined,
      description: description !== business.description ? description : undefined,
      address: address !== business.address ? address : undefined,
      phone: phone !== (business.phone || '') ? phone : undefined,
      email: email !== (business.email || '') ? email : undefined,
      whatsapp: whatsapp !== (business.whatsapp || '') ? whatsapp : undefined,
      instagram: instagram !== (business.instagram || '') ? instagram : undefined,
      facebook: facebook !== (business.facebook || '') ? facebook : undefined,
      website: website !== (business.website || '') ? website : undefined,
      plan: plan !== business.plan ? plan : undefined,
      category_id: categoryId !== (business.category_id || '') ? (categoryId || undefined) : undefined,
    });
    if (res.success) {
      notifySuccess('Negocio actualizado correctamente');
      onUpdated({
        ...business,
        name, description, address,
        phone: phone || null,
        email: email || null,
        whatsapp: whatsapp || null,
        instagram: instagram || null,
        facebook: facebook || null,
        website: website || null,
        plan,
        category_id: categoryId || null,
      } as AdminBusiness);
      onClose();
    } else {
      notifyError(res.error || 'Error al actualizar negocio');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Detalle del Negocio</h3>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
              {business.logo_url ? (
                <img src={business.logo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-base font-black text-slate-900 dark:text-white truncate">{business.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                Dueño: {business.owner_name || '—'} · {business.owner_email || '—'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                ID: {business.id.slice(0, 8)}... · Creado {new Date(business.created_at).toLocaleDateString('es-CO')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombre</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Plan</label>
              <select
                value={plan}
                onChange={e => setPlan(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                {PLANS.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Categoría</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                <option value="">Sin categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {loadingCategories && <p className="text-xs text-slate-400 mt-1">Cargando categorías...</p>}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Teléfono</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">WhatsApp</label>
              <input
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Instagram</label>
              <input
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Facebook</label>
              <input
                value={facebook}
                onChange={e => setFacebook(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sitio Web</label>
              <input
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Dirección</label>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Descripción</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetailModal;
