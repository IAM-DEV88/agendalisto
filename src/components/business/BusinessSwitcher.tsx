import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Store, ChevronDown, Plus, Check } from 'lucide-react';
import { setActiveBusiness } from '../../lib/api';
import { setUserProfile, setActiveBusinessId } from '../../store/userSlice';
import type { RootState } from '../../store';
import type { Business } from '../../lib/api';

interface BusinessSwitcherProps {
  currentBusiness: Business | null;
  businesses?: Business[];
  onSwitch?: (newBusinessId: string) => void;
}

export default function BusinessSwitcher({ currentBusiness, businesses: propBusinesses, onSwitch }: BusinessSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const storeBusinesses = useSelector((state: RootState) => state.user.businesses);
  const userProfile = useSelector((state: RootState) => state.user.userProfile);
  const user = useSelector((state: RootState) => state.user.user);
  const businesses = propBusinesses ?? storeBusinesses;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = async (biz: Business) => {
    if (biz.id === currentBusiness?.id || !user?.id || !userProfile) return;
    setLoading(true);
    setOpen(false);

    const res = await setActiveBusiness(user.id, biz.id);
    if (res.success) {
      dispatch(setUserProfile({ ...userProfile, business_id: biz.id }));
      dispatch(setActiveBusinessId(biz.id));
      onSwitch?.(biz.id);
    }
    setLoading(false);
  };

  const otherBusinesses = businesses.filter(b => b.id !== currentBusiness?.id);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
      >
        <Store className="w-3.5 h-3.5" />
        {currentBusiness?.name || 'Seleccionar negocio'}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-2 space-y-0.5">
            {currentBusiness && (
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-sm font-bold text-primary-700 dark:text-primary-400"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-xs">
                  {currentBusiness.name.charAt(0)}
                </div>
                <span className="flex-1 text-left truncate">{currentBusiness.name}</span>
                <Check className="w-4 h-4 flex-shrink-0" />
              </button>
            )}

            {otherBusinesses.map(biz => (
              <button
                key={biz.id}
                type="button"
                onClick={() => handleSwitch(biz)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-xs">
                  {biz.name.charAt(0)}
                </div>
                <span className="flex-1 truncate">{biz.name}</span>
              </button>
            ))}

            {otherBusinesses.length === 0 && !currentBusiness && (
              <p className="px-3 py-4 text-sm text-slate-400 text-center">Sin negocios</p>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 p-2">
            <button
              type="button"
              onClick={() => { setOpen(false); navigate('/business/register'); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold text-primary-600 dark:text-primary-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear nuevo negocio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
