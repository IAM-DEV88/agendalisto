import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Clock, DollarSign, User, Info, CheckCircle, XCircle, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import type { Service } from '../../lib/api';
import { notifySuccess, notifyError } from '../../lib/toast';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
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
  useLockBodyScroll(!!serviceToDelete);

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
            {pagedServices.map((service) => (
              <div
                key={service.id}
                className={`card group flex flex-col h-full transition-all hover:border-primary-500/30 ${
                  !service.is_active ? 'opacity-70 grayscale-[0.3]' : ''
                }`}
              >
                <div className="p-6 flex-grow">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white truncate tracking-tight">
                        {service.name}
                      </h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    </div>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      service.is_active 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                    }`}>
                      {service.is_active ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>Duracion</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{service.duration} min</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <DollarSign className="w-4 h-4" />
                        <span>Precio</span>
                      </div>
                      <span className="font-black text-lg text-primary-600 dark:text-primary-400">${service.price.toFixed(2)}</span>
                    </div>
                    {service.provider && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <User className="w-4 h-4" />
                          <span>Encargado</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{service.provider}</span>
                      </div>
                    )}
                    {service.can_be_gifted && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
                        <span>🎁</span> Se puede regalar
                      </div>
                    )}
                    {service.requires_payment && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                        <span>🔒</span> Pago online ({service.payment_percentage || 100}%)
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Link
                    to={`/business/service/${service.id}/edit`}
                    className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => setServiceToDelete(service)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
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
        <div data-swipe-block className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">¿Eliminar servicio?</h3>
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
