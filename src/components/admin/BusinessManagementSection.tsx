import { useState, useEffect, useCallback } from 'react';
import { getBusinessesList, getBusinessCategories } from '../../lib/api';
import type { AdminBusiness, BusinessCategory } from '../../lib/api';
import { PLANS } from '../../lib/roles';
import { notifyError } from '../../lib/toast';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';
import BusinessDetailModal from './BusinessDetailModal';
import {
  Search,
  Store,
  ChevronRight,
} from 'lucide-react';

const ITEMS_PER_PAGE = 15;

const planBadgeColors: Record<string, string> = {
  starter: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  premium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const BusinessManagementSection = () => {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<AdminBusiness | null>(null);

  useEffect(() => {
    getBusinessCategories().then(res => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    const res = await getBusinessesList({
      search: search || undefined,
      plan: planFilter || undefined,
      category_id: categoryFilter || undefined,
      page,
      perPage: ITEMS_PER_PAGE,
    });
    if (res.success) {
      setBusinesses(res.data);
      setTotal(res.total);
    } else {
      notifyError(res.error || 'Error al cargar negocios');
    }
    setLoading(false);
  }, [search, planFilter, categoryFilter, page]);

  useEffect(() => { loadBusinesses(); }, [loadBusinesses]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadBusinesses();
  };

  const handleBusinessUpdated = (updated: AdminBusiness) => {
    setBusinesses(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </form>
        <select
          value={planFilter}
          onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
        >
          <option value="">Todos los planes</option>
          {PLANS.map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all max-w-[180px]"
        >
          <option value="">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm font-bold text-slate-400">Cargando negocios...</div>
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={<Store className="h-12 w-12 text-slate-400" />}
          title="Sin resultados"
          description={search || planFilter || categoryFilter ? 'Intenta con otros filtros' : 'No hay negocios registrados'}
        />
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Negocio</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Dueño</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Registro</th>
                    <th className="w-10 px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {businesses.map(business => {
                    const category = categories.find(c => c.id === business.category_id);
                    return (
                      <tr
                        key={business.id}
                        onClick={() => setSelectedBusiness(business)}
                        className="hover:bg-primary-50/50 dark:hover:bg-primary-500/5 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {business.logo_url ? (
                                <img src={business.logo_url} alt={`${business.name} logo`} className="h-9 w-9 object-contain" />
                              ) : (
                                <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              )}
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                              {business.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                          {business.owner_name || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg ${planBadgeColors[business.plan] || planBadgeColors.starter}`}>
                            {business.plan}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                          {category?.name || '—'}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(business.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4">
                          <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs font-bold text-slate-400">
              {total} negocio{total !== 1 ? 's' : ''}
              {(search || planFilter || categoryFilter) && ' filtrados'}
            </p>
            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </div>
        </>
      )}

      {selectedBusiness && (
        <BusinessDetailModal
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
          onUpdated={handleBusinessUpdated}
        />
      )}
    </div>
  );
};

export default BusinessManagementSection;
