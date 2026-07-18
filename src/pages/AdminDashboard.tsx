import { useState, useEffect } from 'react';
import type { UserProfile } from '../lib/supabase';
import { ROLE_LABELS } from '../lib/roles';
import type { Role } from '../lib/roles';
import { getAdminStats, getReviewStats, getPendingReviews, approveReview, rejectReview, getAdminDashboardMetrics, getAdminReferralStats, getTopReferrers, getReferredUsers } from '../lib/api';
import type { DashboardMetrics, ReferralStat, ReferredUser } from '../lib/api';
import { notifySuccess, notifyError } from '../lib/toast';
import type { Review } from '../types/appointment';
import TabNav from '../components/ui/TabNav';
import SectionHeader from '../components/ui/SectionHeader';
import EmptyState from '../components/ui/EmptyState';
import UserManagementSection from '../components/admin/UserManagementSection';
import BusinessManagementSection from '../components/admin/BusinessManagementSection';
import BlogManagementSection from '../components/admin/BlogManagementSection';
import MarketingSection from '../components/admin/MarketingSection';
import StatCard from '../components/ui/StatCard';
import StarRating from '../components/ui/StarRating';
import ReviewModerationSection from '../components/admin/ReviewModerationSection';
import {
  Users,
  Store,
  FileText,
  MessageSquare,
  Eye,
  Calendar,
  Star,
  Heart,
  Crown,
  TrendingUp,
  Clock,
  Gift,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AdminDashboardProps {
  user: UserProfile | null;
}

const ITEMS_PER_PAGE = 10;

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const role = user?.role || 'visitor';
  const roleLabel = ROLE_LABELS[role as Role] || role;
  const [stats, setStats] = useState({ totalUsers: 0, totalBusinesses: 0, totalBlogPosts: 0, totalComments: 0 });
  const [reviewCounts, setReviewCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [pendingReviews, setPendingReviews] = useState<(Review & { profiles?: { full_name: string }; businesses?: { name: string } })[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [moderating, setModerating] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeContentTab, setActiveContentTab] = useState('blog');

  const [referralStats, setReferralStats] = useState<{ total_referrals: number; unique_referrers: number } | null>(null);
  void reviewCounts; // used by setReviewCounts in handlers
  const [topReferrers, setTopReferrers] = useState<ReferralStat[]>([]);
  const [expandedReferrer, setExpandedReferrer] = useState<string | null>(null);
  const [referrerDetails, setReferrerDetails] = useState<Record<string, ReferredUser[]>>({});
  const [referralLoading, setReferralLoading] = useState(true);

  const tabs = [
    { id: 'overview', label: 'Resumen' },
    { id: 'users', label: 'Usuarios' },
    { id: 'businesses', label: 'Negocios' },
    { id: 'content', label: 'Contenido' },
  ];

  useEffect(() => {
    Promise.allSettled([
      getAdminStats(),
      getReviewStats(),
      getPendingReviews(),
      getAdminReferralStats(),
      getTopReferrers(10),
      getAdminDashboardMetrics(),
    ]).then(([statsRes, reviewStatsRes, pendingRes, refStatsRes, topRes, metricsRes]) => {
      if (statsRes.status === 'fulfilled' && statsRes.value.success && statsRes.value.data) setStats(statsRes.value.data);
      if (reviewStatsRes.status === 'fulfilled' && reviewStatsRes.value.success && reviewStatsRes.value.data) setReviewCounts(reviewStatsRes.value.data);
      if (pendingRes.status === 'fulfilled' && pendingRes.value.success) setPendingReviews(pendingRes.value.data || []);
      if (refStatsRes.status === 'fulfilled' && refStatsRes.value.success && refStatsRes.value.data) setReferralStats(refStatsRes.value.data);
      if (topRes.status === 'fulfilled' && topRes.value.success && topRes.value.data) setTopReferrers(topRes.value.data);
      if (metricsRes.status === 'fulfilled' && metricsRes.value.success && metricsRes.value.data) setMetrics(metricsRes.value.data);
      setMetricsLoading(false);
      setReferralLoading(false);
    });
  }, []);

  const handleApprove = async (reviewId: string) => {
    setModerating(reviewId);
    const res = await approveReview(reviewId);
    if (res.success) {
      notifySuccess('Reseña aprobada y publicada');
      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
      setReviewCounts(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1), approved: prev.approved + 1 }));
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
      setReviewCounts(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1), rejected: prev.rejected + 1 }));
    } else {
      notifyError(res.error || 'Error al rechazar reseña');
    }
    setModerating(null);
  };

  const totalPages = Math.ceil(pendingReviews.length / ITEMS_PER_PAGE);
  const paginatedReviews = pendingReviews.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SectionHeader
          title="Panel de Administración"
          description={`Bienvenido, ${user?.full_name || 'Usuario'} — ${roleLabel}`}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard icon={<Users className="h-5 w-5 text-white" />} label="Usuarios" value={stats.totalUsers} color="bg-blue-500" />
          <StatCard icon={<Store className="h-5 w-5 text-white" />} label="Negocios" value={stats.totalBusinesses} color="bg-emerald-500" />
          <StatCard icon={<FileText className="h-5 w-5 text-white" />} label="Blog Posts" value={stats.totalBlogPosts} color="bg-violet-500" />
          <StatCard icon={<MessageSquare className="h-5 w-5 text-white" />} label="Comentarios" value={stats.totalComments} color="bg-amber-500" />
          <StatCard icon={<Eye className="h-5 w-5 text-white" />} label="Visitas" value={metrics?.visits.total ?? '...'} subtitle={metrics ? `${metrics.visits.today} hoy` : ''} color="bg-rose-500" />
          <StatCard icon={<Calendar className="h-5 w-5 text-white" />} label="Citas" value={metrics?.appointments.total ?? '...'} subtitle={metrics ? `${metrics.appointments.pending} pend` : ''} color="bg-cyan-500" />
        </div>

        <TabNav tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} sticky />

        <div className="mt-8">
          {activeTab === 'overview' && (
            metricsLoading ? (
              <div className="text-center py-12 text-sm font-bold text-slate-400">Cargando métricas...</div>
            ) : !metrics ? (
              <EmptyState
                icon={<TrendingUp className="h-12 w-12 text-slate-400" />}
                title="Error al cargar métricas"
                description="Ejecuta la migración 20260616_admin_dashboard_metrics.sql en Supabase"
              />
            ) : (
              <div className="space-y-6">

                {/* ── Rápida sección de indicadores ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Visitas hoy</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.visits.today}</p>
                    <p className="text-xs text-slate-500 mt-1">{metrics.visits.week} esta semana · {metrics.visits.total} total</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Citas</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.appointments.total}</p>
                    <div className="flex gap-2 mt-1 text-[10px] font-bold">
                      <span className="text-amber-600">{metrics.appointments.pending} pend</span>
                      <span className="text-blue-600">{metrics.appointments.confirmed} conf</span>
                      <span className="text-emerald-600">{metrics.appointments.completed} ok</span>
                      <span className="text-red-600">{metrics.appointments.cancelled} canc</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reseñas</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.reviews.total}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={Math.round(metrics.reviews.avg_rating)} />
                      <span className="text-xs font-bold text-slate-500">{metrics.reviews.avg_rating}</span>
                      <span className="text-[10px] text-slate-400">({metrics.reviews.approved} aprob)</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Likes totales</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {metrics.likes.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {metrics.likes.businesses} negocios · {metrics.likes.services} servicios
                    </p>
                  </div>
                </div>

                {/* ── Distribuciones ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Roles</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Visitor', value: metrics.roles.visitor, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
                        { label: 'Client', value: metrics.roles.client, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                        { label: 'Biz Owner', value: metrics.roles.business_owner, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
                        { label: 'Mod', value: metrics.roles.moderator, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
                        { label: 'Admin', value: metrics.roles.admin, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
                      ].map(r => (
                        <span key={r.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg ${r.color}`}>
                          {r.value}
                          <span className="font-normal opacity-70">{r.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Planes</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Starter', value: metrics.plans.starter, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
                        { label: 'Pro', value: metrics.plans.pro, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                        { label: 'Premium', value: metrics.plans.premium, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
                      ].map(p => (
                        <span key={p.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg ${p.color}`}>
                          {p.value}
                          <span className="font-normal opacity-70">{p.label}</span>
                          {p.label === 'Pro' && <Crown className="h-3 w-3" />}
                          {p.label === 'Premium' && <Crown className="h-3 w-3" />}
                        </span>
                      ))}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                        {metrics.subscriptions.active}
                        <span className="font-normal opacity-70">Suscripciones</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Top 10 Negocios ── */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Top 10 Negocios</h4>
                    <p className="text-xs text-slate-500">Ordenados por visitas totales</p>
                  </div>
                  {metrics.top_businesses.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-400">Sin datos de visitas aún</div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {metrics.top_businesses.map((biz, i) => (
                        <div key={biz.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <span className="w-5 text-center text-xs font-black text-slate-400">{i + 1}</span>
                          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {biz.logo_url ? (
                              <img src={biz.logo_url} alt={`${biz.name} logo`} className="h-8 w-8 object-cover" />
                            ) : (
                              <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </div>
                          <span className="flex-1 text-sm font-bold text-slate-900 dark:text-white truncate">{biz.name}</span>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{biz.visits}</span>
                            <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{biz.likes_count}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{biz.appointments}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Usuarios más activos ── */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Usuarios más activos</h4>
                    <p className="text-xs text-slate-500">Por citas + reseñas</p>
                  </div>
                  {metrics.active_users.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-400">Sin actividad de usuarios aún</div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {metrics.active_users.map((u, i) => (
                        <div key={u.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <span className="w-5 text-center text-xs font-black text-slate-400">{i + 1}</span>
                          <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                              {(u.full_name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.full_name || 'Sin nombre'}</p>
                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{u.appointments_count} citas</span>
                            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" />{u.reviews_count} reseñas</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Servicios Populares ── */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Servicios más populares</h4>
                    <p className="text-xs text-slate-500">Ordenados por likes</p>
                  </div>
                  {metrics.top_services.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-400">Sin servicios aún</div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {metrics.top_services.map((svc, i) => (
                        <div key={svc.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <span className="w-5 text-center text-xs font-black text-slate-400">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{svc.name}</p>
                            <p className="text-xs text-slate-500 truncate">{svc.business_name}</p>
                          </div>
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Heart className="h-3.5 w-3.5" />{svc.likes_count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Actividad Reciente ── */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Actividad reciente</h4>
                    <p className="text-xs text-slate-500">Últimos negocios creados</p>
                  </div>
                  {metrics.activity.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-400">Sin actividad reciente</div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {metrics.activity.map((act, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                            <Store className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{act.description}</p>
                            <p className="text-xs text-slate-500">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(act.created_at).toLocaleDateString('es-CO', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )
          )}

          {activeTab === 'users' && (
            <UserManagementSection />
          )}

          {activeTab === 'businesses' && (
            <BusinessManagementSection />
          )}

          {activeTab === 'reviews' && (
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

          {activeTab === 'moderators' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">Gestión de moderadores próximamente.</p>
            </div>
          )}
          {activeTab === 'content' && (
            <div>
              <div className="mb-4 md:mb-6">
                <SectionHeader title="Contenido" description="Blog y campañas de marketing" />
              </div>
              <TabNav tabs={[
                { id: 'blog', label: 'Blog' },
                { id: 'marketing', label: 'Marketing' },
                { id: 'referrals', label: 'Referidos' },
              ]} activeTabId={activeContentTab} onTabChange={setActiveContentTab} variant="pill" connected />
              <div className="bg-white dark:bg-slate-900 rounded-b-lg border border-slate-100 dark:border-slate-800 p-4 md:p-6 -mt-px">
              {activeContentTab === 'blog' && <BlogManagementSection />}
              {activeContentTab === 'marketing' && <MarketingSection />}
              {activeContentTab === 'referrals' && (
                <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
                  {referralLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-lg p-6 shadow-xl shadow-primary-500/20">
                          <p className="text-primary-200 text-xs font-bold uppercase tracking-widest">Total Referidos</p>
                          <p className="text-3xl font-black text-white mt-1">{referralStats?.total_referrals || 0}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Referidores Únicos</p>
                          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{referralStats?.unique_referrers || 0}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Promedio x Referidor</p>
                          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                            {referralStats && referralStats.unique_referrers > 0
                              ? (referralStats.total_referrals / referralStats.unique_referrers).toFixed(1)
                              : '0'}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
                        <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Top Referidores</h3>
                        {topReferrers.length === 0 ? (
                          <EmptyState icon={<Gift className="w-8 h-8" />} title="Sin referidos aún" description="Ningún usuario ha referido a otro. Comparte el programa." />
                        ) : (
                          <div className="space-y-2">
                            {topReferrers.map((stat, i) => (
                              <div key={stat.referrer_id}>
                                <div
                                  className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
                                  onClick={async () => {
                                    if (expandedReferrer === stat.referrer_id) {
                                      setExpandedReferrer(null);
                                    } else {
                                      setExpandedReferrer(stat.referrer_id);
                                      if (!referrerDetails[stat.referrer_id]) {
                                        const res = await getReferredUsers(stat.referrer_id);
                                        if (res.success && res.data) {
                                          setReferrerDetails(prev => ({ ...prev, [stat.referrer_id]: res.data || [] }));
                                        }
                                      }
                                    }
                                  }}
                                >
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm
                                    ${i === 0 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' :
                                    i === 1 ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' :
                                    i === 2 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' :
                                    'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500'}">
                                    {i + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{stat.referrer_name || 'Usuario'}</p>
                                    <p className="text-xs text-slate-400 truncate">{stat.referrer_email || '—'}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-xs font-bold">{stat.count} ref.</span>
                                    {expandedReferrer === stat.referrer_id
                                      ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                      : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                  </div>
                                </div>

                                {expandedReferrer === stat.referrer_id && (
                                  <div className="ml-12 mt-2 mb-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {(referrerDetails[stat.referrer_id]?.length || 0) > 0 ? (
                                      referrerDetails[stat.referrer_id].map(ref => (
                                        <div key={ref.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                            <User className="w-4 h-4 text-slate-500" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{ref.full_name || 'Usuario'}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{ref.email || '—'}</p>
                                          </div>
                                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(ref.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                                          </span>
                                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                            ref.role === 'business_owner'
                                              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                              : ref.role === 'client'
                                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                          }`}>
                                            {ref.role === 'business_owner' ? 'Negocio' : ref.role}
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-xs text-slate-400 py-2 text-center">Cargando...</p>
                                    )}
                                  </div>
                                )}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
