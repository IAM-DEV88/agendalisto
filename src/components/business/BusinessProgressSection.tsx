import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBusinessServices, getBusinessHours } from '../../lib/api';
import type { Business } from '../../lib/api';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface ProgressItem {
  id: string;
  label: string;
  done: boolean;
  link: string;
}

export default function BusinessProgressSection({ businessData }: { businessData: Business }) {
  const [servicesCount, setServicesCount] = useState(0);
  const [hoursCount, setHoursCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [svc, hrs] = await Promise.all([
        getBusinessServices(businessData.id),
        getBusinessHours(businessData.id).catch(() => []),
      ]);
      if (svc.success && svc.data) setServicesCount(svc.data.length);
      setHoursCount(Array.isArray(hrs) ? hrs.filter((h: any) => !h.is_closed).length : 0);
      setLoading(false);
    };
    load();
  }, [businessData.id]);

  const hasLogo = !!businessData.logo_url;
  const hasDesc = !!businessData.description;
  const hasAddress = !!businessData.address;
  const hasCategory = !!businessData.category_id;
  const hasPhone = !!businessData.phone;

  const items: ProgressItem[] = [
    { id: 'profile', label: 'Completar perfil del negocio', done: hasDesc && hasCategory && hasPhone, link: '/business/dashboard?tab=profile' },
    { id: 'logo', label: 'Subir logo del negocio', done: hasLogo, link: '/business/dashboard?tab=profile' },
    { id: 'address', label: 'Agregar dirección', done: hasAddress, link: '/business/dashboard?tab=profile' },
    { id: 'hours', label: 'Configurar horario de atención', done: hoursCount > 0, link: '/business/dashboard?tab=availability' },
    { id: 'services', label: 'Crear al menos 1 servicio', done: servicesCount > 0, link: '/business/dashboard?tab=services' },
  ];

  const doneCount = items.filter(i => i.done).length;
  const total = items.length;
  const percent = Math.round((doneCount / total) * 100);
  const allDone = doneCount === total;

  if (allDone && !loading) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 sm:p-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-sm">Progreso de configuración</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{doneCount} de {total} completado</p>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ) : (
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-700" />
                <circle
                  cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3"
                  strokeDasharray={`${percent * 1.005} 100.5`}
                  className={`${percent < 50 ? 'text-amber-500' : percent < 80 ? 'text-primary-500' : 'text-emerald-500'}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-600 dark:text-slate-300">
                {percent}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        {items.map(item => (
          <Link
            key={item.id}
            to={item.link}
            className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm ${
              item.done
                ? 'text-slate-400 dark:text-slate-500'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
            )}
            <span className={item.done ? 'line-through' : ''}>{item.label}</span>
            {!item.done && <AlertCircle className="w-3.5 h-3.5 text-amber-500 ml-auto flex-shrink-0" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
