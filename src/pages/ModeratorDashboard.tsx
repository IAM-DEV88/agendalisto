import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../lib/supabase';
import { ROLE_LABELS } from '../lib/roles';
import type { Role } from '../lib/roles';
import { getPendingReviews, approveReview, rejectReview, getModeratorStats, getAdminReferralStats, getTopReferrers } from '../lib/api';
import type { ReferralStat } from '../lib/api';
import { useToast } from '../hooks/useToast';
import type { Review } from '../types/appointment';
import TabNav from '../components/ui/TabNav';
import SectionHeader from '../components/ui/SectionHeader';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import {
  FileText,
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  Gift,
} from 'lucide-react';

interface ModeratorDashboardProps {
  user: UserProfile | null;
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 transition-all hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const ITEMS_PER_PAGE = 10;

const ModeratorDashboard = ({ user }: ModeratorDashboardProps) => {
  const role = user?.role || 'visitor';
  const roleLabel = ROLE_LABELS[role as Role] || role;
  const toast = useToast();

  const [stats, setStats] = useState({ pendingReviews: 0, totalBlogPosts: 0, totalComments: 0 });
  const [pendingReviews, setPendingReviews] = useState<(Review & { profiles?: { full_name: string }; businesses?: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderating, setModerating] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [referralStats, setReferralStats] = useState<{ total_referrals: number; unique_referrers: number } | null>(null);
  const [topReferrers, setTopReferrers] = useState<ReferralStat[]>([]);
  const [referralLoading, setReferralLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminReferralStats(),
      getTopReferrers(10),
    ]).then(([statsRes, topRes]) => {
      if (statsRes.success && statsRes.data) setReferralStats(statsRes.data);
      if (topRes.success && topRes.data) setTopReferrers(topRes.data);
      setReferralLoading(false);
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [statsRes, reviewsRes] = await Promise.all([
      getModeratorStats(),
      getPendingReviews(),
    ]);
    if (statsRes.success && statsRes.data) setStats(statsRes.data);
    if (reviewsRes.success) setPendingReviews(reviewsRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (reviewId: string) => {
    setModerating(reviewId);
    const res = await approveReview(reviewId);
    if (res.success) {
      toast.success('Reseña aprobada y publicada');
      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
      setStats(prev => ({ ...prev, pendingReviews: Math.max(0, prev.pendingReviews - 1) }));
    } else {
      toast.error(res.error || 'Error al aprobar reseña');
    }
    setModerating(null);
  };

  const handleReject = async (reviewId: string) => {
    setModerating(reviewId);
    const res = await rejectReview(reviewId);
    if (res.success) {
      toast.success('Reseña rechazada');
      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
      setStats(prev => ({ ...prev, pendingReviews: Math.max(0, prev.pendingReviews - 1) }));
    } else {
      toast.error(res.error || 'Error al rechazar reseña');
    }
    setModerating(null);
  };

  const totalPages = Math.ceil(pendingReviews.length / ITEMS_PER_PAGE);
  const paginatedReviews = pendingReviews.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const tabs = [
    { id: 'overview', label: 'Resumen' },
    { id: 'reviews', label: 'Reseñas', count: stats.pendingReviews },
    { id: 'content', label: 'Contenido' },
    { id: 'reports', label: 'Reportes' },
    { id: 'referrals', label: 'Referidos' },
  ];

  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SectionHeader
          title="Panel de Moderación"
          description={`Bienvenido, ${user?.full_name || 'Usuario'} — ${roleLabel}`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={<Star className="h-5 w-5 text-white" />} label="Pendientes" value={stats.pendingReviews} color="bg-amber-500" />
          <StatCard icon={<FileText className="h-5 w-5 text-white" />} label="Blog Posts" value={stats.totalBlogPosts} color="bg-violet-500" />
          <StatCard icon={<MessageSquare className="h-5 w-5 text-white" />} label="Comentarios" value={stats.totalComments} color="bg-blue-500" />
        </div>

        <TabNav tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} />

        <div className="mt-8">
          {activeTab === 'overview' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Moderación General</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Gestión de contenido, reseñas y reportes de la comunidad.
              </p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-slate-500">Cargando reseñas...</div>
              ) : pendingReviews.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle className="h-12 w-12 text-emerald-400" />}
                  title="No hay reseñas pendientes"
                  description="Todas las reseñas han sido revisadas."
                />
              ) : (
                <>
                  {paginatedReviews.map((review) => (
                    <div key={review.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                                {(review.profiles?.full_name || 'U').charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {review.profiles?.full_name || 'Usuario'}
                              </p>
                              <p className="text-xs text-slate-500">{review.businesses?.name || 'Negocio'}</p>
                            </div>
                            <StarRating rating={review.rating} />
                            <span className="text-xs text-slate-400 ml-auto">
                              {new Date(review.created_at).toLocaleDateString('es-CO')}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 ml-12">
                              {review.comment}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApprove(review.id)}
                            disabled={moderating === review.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 rounded-xl transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleReject(review.id)}
                            disabled={moderating === review.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-xl transition-colors disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Rechazar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">Moderación de contenido próximamente.</p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">Gestión de reportes próximamente.</p>
            </div>
          )}

          {activeTab === 'referrals' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
              {referralLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map(i => (
                    <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-2xl p-6 shadow-xl shadow-primary-500/20">
                      <p className="text-primary-200 text-xs font-bold uppercase tracking-widest">Total Referidos</p>
                      <p className="text-3xl font-black text-white mt-1">{referralStats?.total_referrals || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Referidores Únicos</p>
                      <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{referralStats?.unique_referrers || 0}</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
                    <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                      Top Referidores
                    </h3>
                    {topReferrers.length === 0 ? (
                      <EmptyState
                        icon={<Gift className="w-8 h-8" />}
                        title="Sin referidos"
                        description="No hay actividad de referidos aún."
                      />
                    ) : (
                      <div className="space-y-2">
                        {topReferrers.map((stat, i) => (
                          <div
                            key={stat.referrer_id}
                            className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm ${
                              i === 0
                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                                : i === 1
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                  : i === 2
                                    ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500'
                            }`}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {stat.referrer_name || 'Usuario'}
                              </p>
                              <p className="text-xs text-slate-400 truncate">{stat.referrer_email || '—'}</p>
                            </div>
                            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-xs font-bold">
                              {stat.count} ref.
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ModeratorDashboard;
