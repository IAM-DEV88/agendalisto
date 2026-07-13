import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Flame, Zap, Crown } from 'lucide-react';

interface StreakData {
  currentStreak: number;
  visitsThisMonth: number;
  totalVisits: number;
  level: string;
}

export default function VisitStreaks({ userId, businessId }: { userId: string; businessId: string }) {
  const [data, setData] = useState<StreakData | null>(null);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const { data: rows } = await supabase
        .from('agendaya_loyalty')
        .select('visit_date')
        .eq('user_id', userId)
        .eq('business_id', businessId);

      if (rows) {
        const total = rows.length;
        const thisMonth = rows.filter(r => r.visit_date >= firstOfMonth).length;
        let level = 'regular';
        if (total >= 10) level = 'vip';
        else if (total >= 4) level = 'frecuente';

        setData({
          currentStreak: Math.min(total, 7),
          visitsThisMonth: thisMonth,
          totalVisits: total,
          level,
        });
      }
    };
    load();
  }, [userId, businessId]);

  if (!data) return null;

  const levelConfig = {
    regular: { icon: Flame, color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Regular' },
    frecuente: { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Frecuente' },
    vip: { icon: Crown, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'VIP' },
  };
  const cfg = levelConfig[data.level as keyof typeof levelConfig] || levelConfig.regular;
  const Icon = cfg.icon;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${cfg.bg} border border-slate-200 dark:border-slate-700`}>
      <Icon className={`w-8 h-8 ${cfg.color}`} />
      <div>
        <p className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          {cfg.label}
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${cfg.color} bg-white dark:bg-slate-800`}>
            {data.totalVisits} visitas
          </span>
        </p>
        <p className="text-xs text-slate-500">{data.visitsThisMonth} visitas este mes</p>
        {data.level === 'vip' && <p className="text-[10px] text-purple-500 font-bold">✨ Cliente VIP — beneficios exclusivos</p>}
      </div>
    </div>
  );
}
