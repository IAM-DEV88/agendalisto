import { useState, useEffect } from 'react';
import { getNewsletterSubscribers, getGiftCodes, getAdminLoyaltyStats, getAdminReferralStats, getTopReferrers } from '../../lib/api';
import { Mail, Gift, Heart, Users, Link as LinkIcon } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

export default function MarketingSection() {
  const [subscribers, setSubscribers] = useState<{ email: string; subscribed_at: string }[]>([]);
  const [giftCodes, setGiftCodes] = useState<any[]>([]);
  const [loyalty, setLoyalty] = useState<{ total_entries: number; vip_count: number; frecuente_count: number; regular_count: number } | null>(null);
  const [referralStats, setReferralStats] = useState<{ total_referrals: number; unique_referrers: number } | null>(null);
  const [topReferrers, setTopReferrers] = useState<any[]>([]);
  const [tab, setTab] = useState<'subscribers' | 'gifts' | 'loyalty' | 'referrals'>('subscribers');
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'active' | 'redeemed'>('all');

  useEffect(() => {
    Promise.all([
      getNewsletterSubscribers(),
      getGiftCodes(),
      getAdminLoyaltyStats(),
      getAdminReferralStats(),
      getTopReferrers(10),
    ]).then(([subRes, giftRes, loyRes, refRes, topRes]) => {
      if (subRes.success && subRes.data) setSubscribers(subRes.data);
      if (giftRes.success && giftRes.data) setGiftCodes(giftRes.data);
      if (loyRes.success && loyRes.data) setLoyalty(loyRes.data);
      if (refRes.success && refRes.data) setReferralStats(refRes.data);
      if (topRes.success && topRes.data) setTopReferrers(topRes.data);
      setLoading(false);
    });
  }, []);

  const filteredGifts = giftCodes.filter(g => {
    if (activeSubTab === 'active') return g.status === 'active';
    if (activeSubTab === 'redeemed') return g.status === 'redeemed';
    return true;
  });

  if (loading) {
    return <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 animate-pulse" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
        {[
          { id: 'subscribers', label: 'Suscriptores', icon: Mail },
          { id: 'gifts', label: 'Gift Codes', icon: Gift },
          { id: 'loyalty', label: 'Fidelización', icon: Heart },
          { id: 'referrals', label: 'Referidos', icon: LinkIcon },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === t.id ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Subscribers Tab */}
      {tab === 'subscribers' && (
        subscribers.length === 0 ? (
          <EmptyState icon={<Mail className="w-8 h-8" />} title="Sin suscriptores" description="Aún no hay registros en el newsletter." />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {subscribers.map((sub, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{sub.email}</span>
                  <span className="text-xs text-slate-400">{new Date(sub.subscribed_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Gift Codes Tab */}
      {tab === 'gifts' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['all', 'active', 'redeemed'] as const).map(s => (
              <button key={s} onClick={() => setActiveSubTab(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeSubTab === s ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {s === 'all' ? 'Todos' : s === 'active' ? 'Activos' : 'Canjeados'}
              </button>
            ))}
          </div>
          {filteredGifts.length === 0 ? (
            <EmptyState icon={<Gift className="w-8 h-8" />} title="Sin códigos" description="No hay gift codes en esta categoría." />
          ) : (
            <div className="space-y-2">
              {filteredGifts.map(g => (
                <div key={g.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    g.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate font-mono">{g.code}</p>
                    <p className="text-xs text-slate-400 truncate">
                      Para: {g.recipient_name} · {g.agendaya_services?.name || 'Servicio'} · {g.agendaya_businesses?.name || 'Negocio'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    g.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {g.status}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(g.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loyalty Tab */}
      {tab === 'loyalty' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Regular', count: loyalty?.regular_count || 0, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600', icon: Users },
            { label: 'Frecuente', count: loyalty?.frecuente_count || 0, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600', icon: Heart },
            { label: 'VIP', count: loyalty?.vip_count || 0, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600', icon: Gift },
          ].map(item => (
            <div key={item.label} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 text-center">
              <item.icon className={`w-8 h-8 mx-auto mb-2 ${item.color.split(' ').pop()}`} />
              <p className="text-3xl font-black text-slate-900 dark:text-white">{item.count}</p>
              <p className="text-xs font-bold text-slate-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Referrals Tab */}
      {tab === 'referrals' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
              Top Referidores
            </h3>
            {topReferrers.length === 0 ? (
              <EmptyState icon={<LinkIcon className="w-8 h-8" />} title="Sin referidos" description="Ningún usuario ha referido a otro." />
            ) : (
              <div className="space-y-2">
                {topReferrers.map((r, i) => (
                  <div key={r.referrer_id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm ${
                      i === 0 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' :
                      i === 1 ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' :
                      i === 2 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600' :
                      'bg-slate-50 dark:bg-slate-800/50 text-slate-400'
                    }`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{r.referrer_name || 'Usuario'}</p>
                      <p className="text-xs text-slate-400 truncate">{r.referrer_email || '—'}</p>
                    </div>
                    <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-xs font-bold">{r.count} ref.</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 text-center">
              <p className="text-3xl font-black text-slate-900 dark:text-white">{referralStats?.total_referrals || 0}</p>
              <p className="text-xs font-bold text-slate-400 mt-1">Total referidos</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 text-center">
              <p className="text-3xl font-black text-slate-900 dark:text-white">{referralStats?.unique_referrers || 0}</p>
              <p className="text-xs font-bold text-slate-400 mt-1">Referidores únicos</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
