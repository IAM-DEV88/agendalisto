import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Clock, User, Info, CheckCircle, XCircle, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import type { Service } from '../../lib/api';
import { notifySuccess, notifyError } from '../../lib/toast';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import SectionHeader from '../ui/SectionHeader';
import { Pagination } from '../ui/Pagination';
import { getMaxServices, PLAN_LABELS } from '../../lib/roles';

interface ServicesSectionProps {
  businessId: string;
  getServices: (businessId: string) => Promise<{ success: boolean; data?: Service[]; error?: string }>;
  deleteService: (id: string) => Promise<{ success: boolean; error?: string }>;
  itemsPerPage: number;
  plan: 'starter' | 'pro' | 'premium';
}

const ServicesSection: React.FC<ServicesSectionProps> = ({
  businessId,
  getServices,
  deleteService,
  itemsPerPage,
  plan,
}) => {
  const maxServices = getMaxServices(plan);
  const [services, setServices] = useState<Service[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteDialogRef = useRef<HTMLDivElement>(null);
  useLockBodyScroll(!!serviceToDelete);
  useFocusTrap(deleteDialogRef, !!serviceToDelete);

  useEffect(() => {
    if (businessId) {
      loadServices();
    }
  }, [businessId]);

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getServices(businessId);
      if (response.success && response.data) {
        setServices(response.data);
      } else {
        setError(response.error || 'Error al cargar los servicios');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  }, [businessId, getServices]);

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    setDeleting(true);
    try {
      const response = await deleteService(serviceToDelete.id);
      if (response.success) {
        setServiceToDelete(null);
        await loadServices();
        notifySuccess('Servicio eliminado correctamente');
      } else {
        const errMsg = response.error || 'Error al eliminar el servicio';
        setError(errMsg);
        notifyError(errMsg);
        setServiceToDelete(null);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Error al eliminar el servicio';
      setError(errMsg);
      notifyError(errMsg);
      setServiceToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(services.length / itemsPerPage);
  const pagedServices = services.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Servicios" 
        description={`${maxServices === Infinity ? 'Servicios ilimitados' : `Hasta ${maxServices} servicios — Plan ${PLAN_LABELS[plan]}`} (${services.length} actuales)`}
        actionButton={
          <Link
            to="/business/service/new"
            onClick={(e) => {
              if (maxServices !== Infinity && services.length >= maxServices) {
                e.preventDefault();
                notifyError(`Has alcanzado el límite de ${maxServices} servicios. Actualiza tu plan para agregar más.`);
              }
            }}
            className="inline-flex items-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-primary-500/25 gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Servicio
          </Link>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-6">

      {maxServices !== Infinity && services.length >= maxServices && (
        <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
              Has alcanzado el límite de {maxServices} servicios de tu plan {PLAN_LABELS[plan]}.
            </p>
          </div>
          <Link
            to="/plans"
            className="flex-shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-amber-500/25"
          >
            Actualizar plan
          </Link>
        </div>
      )}

      {error && (
        <div className="alert alert-error flex items-center gap-3">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-slate-500 font-medium">Cargando servicios...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center text-center py-12">
          <div className="w-16 h-16 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 text-slate-400">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No hay servicios</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Comienza agregando tu primer servicio para que tus clientes puedan reservar.</p>
          <Link
            to="/business/service/new"
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-primary-500/25 gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Servicio
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pagedServices.map((service, index) => {
              const serviceNumber = (currentPage - 1) * itemsPerPage + index + 1;
              return (
              <div
                key={service.id}
                className={`card overflow-hidden flex flex-col h-full transition-all hover:border-primary-500/30 ${
                  !service.is_active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[11px] font-black text-slate-500 dark:text-slate-300 flex-shrink-0">
                    {serviceNumber}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                    {service.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-800/50">
                        <CheckCircle className="w-2.5 h-2.5" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-md">
                        <XCircle className="w-2.5 h-2.5" /> Inactivo
                      </span>
                    )}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <Link
                      to={`/business/service/${service.id}/edit`}
                      className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-white dark:hover:bg-slate-800"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setServiceToDelete(service)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white dark:hover:bg-slate-800"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row flex-1 min-w-0">
                  {service.image_urls && service.image_urls.length > 0 && (
                    <div className="sm:w-28 lg:w-32 flex-shrink-0 bg-slate-100 dark:bg-slate-800 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700">
                      <div className="relative aspect-[4/3] sm:aspect-square">
                        <img
                          src={service.image_urls[0]}
                          alt={service.name}
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex-1 p-4 sm:p-5 space-y-2 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate mb-0">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                      </div>
                      <span className="text-lg font-black text-primary-600 dark:text-primary-400 flex-shrink-0">
                        ${service.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary-400" /> {service.duration} min
                      </span>
                      {service.provider && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-primary-400" /> {service.provider}
                        </span>
                      )}
                      {service.can_be_gifted && <span className="text-rose-400">🎁 Regalable</span>}
                      {service.requires_payment && (
                        <span className="text-amber-500">🔒 Pago online ({service.payment_percentage || 100}%)</span>
                      )}
                      {(service.min_cancellation_hours ?? 0) > 0 && (
                        <span>⏳ Cancelación: {service.min_cancellation_hours}h</span>
                      )}
                      {(service.min_reschedule_hours ?? 0) > 0 && (
                        <span>🔄 Reagendamiento: {service.min_reschedule_hours}h</span>
                      )}
                    </div>
                    {(service.cancellation_policy_text || service.reschedule_policy_text) && (
                      <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                        {service.cancellation_policy_text && (
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-slate-500">Cancelación:</span>{' '}
                            <span className="line-clamp-1">{service.cancellation_policy_text}</span>
                          </div>
                        )}
                        {service.reschedule_policy_text && (
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-slate-500">Reagendamiento:</span>{' '}
                            <span className="line-clamp-1">{service.reschedule_policy_text}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
          
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </>
      )}

      </div>

      {serviceToDelete && (
        <div data-swipe-block className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="svc-del-title"
        >
          <div ref={deleteDialogRef} className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 id="svc-del-title" className="text-xl font-black text-slate-900 dark:text-white">¿Eliminar servicio?</h3>
            </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Esta acción eliminará permanentemente <strong className="text-slate-800 dark:text-slate-200">{serviceToDelete.name}</strong>{' '}y no podrá recuperarse.
              </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setServiceToDelete(null)}
                disabled={deleting}
                className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                aria-label="Confirmar eliminación"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesSection; 
