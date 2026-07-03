interface ReferralBadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
}

const BADGES = [
  {
    min: 50, label: 'Diamante',
    gradient: 'from-cyan-400 to-blue-600',
    shadow: 'shadow-cyan-500/25',
  },
  {
    min: 25, label: 'Platino',
    gradient: 'from-slate-300 to-slate-600',
    shadow: 'shadow-slate-400/25',
  },
  {
    min: 10, label: 'Plata',
    gradient: 'from-zinc-200 to-zinc-500',
    shadow: 'shadow-zinc-400/20',
  },
  {
    min: 3, label: 'Bronce',
    gradient: 'from-amber-400 to-orange-700',
    shadow: 'shadow-amber-500/25',
  },
];

const sizeClasses = {
  sm: 'text-[9px] px-2 py-0.5 gap-1',
  md: 'text-[10px] px-2.5 py-1 gap-1.5',
  lg: 'text-xs px-3 py-1.5 gap-1.5',
};

export default function ReferralBadge({ count, size = 'sm' }: ReferralBadgeProps) {
  const badge = BADGES.find(b => count >= b.min);
  if (!badge) return null;

  return (
    <span
      title={`Embajador ${badge.label}`}
      className={`inline-flex items-center font-black uppercase tracking-wider rounded-full bg-gradient-to-r text-white shadow-md ${sizeClasses[size]} ${badge.gradient} ${badge.shadow}`}
    >
      {badge.label}
    </span>
  );
}
