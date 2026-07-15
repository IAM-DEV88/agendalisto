import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../lib/supabase';
import { ROLE_LABELS } from '../lib/roles';
import type { Role } from '../lib/roles';
import { getPendingReviews, approveReview, rejectReview, getModeratorStats, getAdminReferralStats, getTopReferrers } from '../lib/api';
import type { ReferralStat } from '../lib/api';
import { notifySuccess, notifyError } from '../lib/toast';
import type { Review } from '../types/appointment';
import TabNav from '../components/ui/TabNav';
import SectionHeader from '../components/ui/SectionHeader';
import EmptyState from '../components/ui/EmptyState';
import StatCard from '../components/ui/StatCard';
import ReviewModerationSection from '../components/admin/ReviewModerationSection';
import {
  FileText,
  MessageSquare,
  Star,
  Gift,
} from 'lucide-react';

interface ModeratorDashboardProps {
  user: UserProfile | null;
}

const ITEMS_PER_PAGE = 10;

const ModeratorDashboard = ({ user }: ModeratorDashboardProps) => {
  const role = user?.role || 'visitor';
  const roleLabel = ROLE_LABELS[role as Role] || role;
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
      notifySuccess('Reseña aprobada y publicada');
      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
      setStats(prev => ({ ...prev, pendingReviews: Math.max(0, prev.pendingReviews - 1) }));
    } else {
      notifyError(res.error || 'Error al aprobar reseña');
    }
    setModerating(null);
  };

  const handleReject = async (reviewId: string) => {
    setModerating(reviewId);
    const res = await rejectReview(reviewId);
    if (res.success) {
      notifySuccess('Reseña rechazada');
      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
      setStats(prev => ({ ...prev, pendingReviews: Math.max(0, prev.pendingReviews - 1) }));
    } else {
      notifyError(res.error || 'Error al rechazar reseña');
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

        <TabNav tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} sticky />

        <div className="mt-8">
          {activeTab === 'overview' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Moderación General</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Gestión de contenido, reseñas y reportes de la comunidad.
              </p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <>
              {loading && (
                <div className="text-center py-12 text-slate-500">Cargando reseñas...</div>
              )}
              {!loading && (
                <ReviewModerationSection
                  pendingReviews={paginatedReviews}
                  moderating={moderating}
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              )}
            </>
          )}

          {activeTab === 'content' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">Moderación de contenido próximamente.</p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">Gestión de reportes próximamente.</p>
            </div>
          )}

          {activeTab === 'referrals' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
              {referralLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map(i => (
                    <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-lg p-6 shadow-xl shadow-primary-500/20">
                      <p className="text-primary-200 text-xs font-bold uppercase tracking-widest">Total Referidos</p>
                      <p className="text-3xl font-black text-white mt-1">{referralStats?.total_referrals || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Referidores Únicos</p>
                      <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{referralStats?.unique_referrers || 0}</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
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
                            className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
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
