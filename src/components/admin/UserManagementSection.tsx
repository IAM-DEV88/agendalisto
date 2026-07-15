import { useState, useEffect, useCallback } from 'react';
import { getUsersList } from '../../lib/api';
import type { UserProfile } from '../../lib/supabase';
import { ROLES, PLANS, ROLE_LABELS } from '../../lib/roles';
import type { Role } from '../../lib/roles';
import { notifyError } from '../../lib/toast';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';
import UserDetailModal from './UserDetailModal';
import {
  Search,
  Users,
  ChevronRight,
} from 'lucide-react';

const ITEMS_PER_PAGE = 15;

const roleBadgeColors: Record<string, string> = {
  visitor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  client: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  business_owner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  moderator: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  admin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const planBadgeColors: Record<string, string> = {
  starter: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  premium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const UserManagementSection = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await getUsersList({
      search: search || undefined,
      role: roleFilter || undefined,
      plan: planFilter || undefined,
      page,
      perPage: ITEMS_PER_PAGE,
    });
    if (res.success) {
      setUsers(res.data);
      setTotal(res.total);
    } else {
      notifyError(res.error || 'Error al cargar usuarios');
    }
    setLoading(false);
  }, [search, roleFilter, planFilter, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleUserUpdated = (updated: UserProfile) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
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
            placeholder="Buscar por nombre o email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </form>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
        >
          <option value="">Todos los roles</option>
          {ROLES.map(r => (
            <option key={r} value={r}>{ROLE_LABELS[r as Role] || r}</option>
          ))}
        </select>
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
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm font-bold text-slate-400">Cargando usuarios...</div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12 text-slate-400" />}
          title="Sin resultados"
          description={search || roleFilter || planFilter ? 'Intenta con otros filtros' : 'No hay usuarios registrados'}
        />
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Rol</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Registro</th>
                    <th className="w-10 px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map(user => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="hover:bg-primary-50/50 dark:hover:bg-primary-500/5 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                              {(user.full_name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                            {user.full_name || 'Sin nombre'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-[220px]">
                        {user.email}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg ${roleBadgeColors[user.role] || roleBadgeColors.visitor}`}>
                          {ROLE_LABELS[user.role as Role] || user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg ${planBadgeColors[user.plan] || planBadgeColors.starter}`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(user.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs font-bold text-slate-400">
              {total} usuario{total !== 1 ? 's' : ''}
              {(search || roleFilter || planFilter) && ' filtrados'}
            </p>
            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </div>
        </>
      )}

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
};

export default UserManagementSection;
