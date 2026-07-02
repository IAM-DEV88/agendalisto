import { useState, useEffect } from 'react';
import { UserPlus, Check, Copy, Share2, Link as LinkIcon, User, Mail, Calendar } from 'lucide-react';
import { notifySuccess, notifyError } from '../../lib/toast';
import { getReferralLink, getReferralCount, getReferredUsers, type ReferredUser } from '../../lib/api';
import SectionHeader from '../ui/SectionHeader';

const REFERRAL_MILESTONES = [
  { goal: 3, reward: 'Badge "Bronce" + mención en comunidad' },
  { goal: 10, reward: '1 mes gratis de plan Pro' },
  { goal: 25, reward: 'Badge "Platino" + 3 meses Pro gratis' },
  { goal: 50, reward: 'Plan Premium gratis por 1 año' },
];

export default function ReferralSection({ userId }: { userId: string }) {
  const [referralCount, setReferralCount] = useState(0);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralLink = getReferralLink(userId);
  const businessOwnersReferred = referredUsers.filter(u => u.role === 'business_owner').length;

  useEffect(() => {
    getReferralCount(userId).then(res => {
      if (res.success && res.count !== undefined) setReferralCount(res.count);
    });
    getReferredUsers(userId).then(res => {
      if (res.success && res.data) setReferredUsers(res.data);
      setLoadingUsers(false);
    });
  }, [userId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      notifySuccess('¡Enlace de referido copiado!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      notifyError('No se pudo copiar el enlace');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AgendaYa',
          text: '🎯 Te invito a AgendaYa — encuentra y reserva servicios profesionales cerca de ti.',
          url: referralLink,
        });
        return;
      } catch {}
    }
    handleCopy();
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 space-y-5">
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <SectionHeader
          title="Invita y gana"
          description="Comparte tu enlace con amigos y haz crecer la comunidad AgendaYa."
        />
      </div>

      <div className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-2xl p-6 shadow-xl shadow-primary-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-200 text-sm font-bold uppercase tracking-widest">Tus referidos</p>
            <p className="text-4xl font-black text-white mt-1">{referralCount}</p>
            <p className="text-primary-200/60 text-xs font-medium mt-1">
              {referredUsers.length > 0
                ? `Último: ${new Date(referredUsers[0].created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : 'Aún no has referido a nadie'}
            </p>
          </div>
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
          <div className="text-center">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Registrados</p>
            <p className="text-white font-black text-lg">{referredUsers.length}</p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Con negocio</p>
            <p className="text-white font-black text-lg">{businessOwnersReferred}</p>
          </div>
        </div>
      </div>

      {referralCount > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
            Logros por referidos
          </h3>
          <div className="space-y-3">
            {REFERRAL_MILESTONES.map((m, i) => {
              const unlocked = referralCount >= m.goal;
              const progress = Math.min(100, (referralCount / m.goal) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    unlocked ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {unlocked ? <Check className="w-4 h-4" /> : <span className="text-xs font-black">{m.goal}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-bold ${unlocked ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>
                        {m.goal} referidos — {m.reward}
                      </p>
                      {!unlocked && (
                        <span className="text-[10px] text-slate-400 ml-2">{referralCount}/{m.goal}</span>
                      )}
                    </div>
                    {!unlocked && (
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
                        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
          Tu enlace de invitación
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-600 dark:text-slate-300 truncate">
            <LinkIcon className="w-4 h-4 flex-shrink-0 text-primary-500" />
            <span className="truncate">{referralLink}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              aria-label="Copiar enlace de referido"
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button
              onClick={handleShare}
              aria-label="Compartir enlace de referido"
              className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary-500/20"
            >
              <Share2 className="w-4 h-4" />
              Compartir
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
          Compartir en redes
        </h3>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent('🎯 Te invito a AgendaYa — reserva servicios profesionales cerca de ti. ' + referralLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartir en WhatsApp"
            className="flex items-center gap-2 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border border-emerald-200 dark:border-emerald-800/50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('🎯 Te invito a AgendaYa — reserva servicios profesionales cerca de ti.')}&url=${encodeURIComponent(referralLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartir en Twitter"
            className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Twitter / X
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartir en Facebook"
            className="flex items-center gap-2 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-200 dark:border-blue-800/50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </a>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
          Personas que se unieron con tu enlace
          {referredUsers.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-[10px]">
              {referredUsers.length}
            </span>
          )}
        </h3>
        {loadingUsers ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : referredUsers.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-400">Aún no tienes referidos</p>
            <p className="text-xs text-slate-400 mt-1">Comparte tu enlace para empezar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referredUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {user.full_name || 'Usuario'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user.email
                        ? user.email.replace(/^(.{1,2})(.*)(@.*)$/, '$1***$3')
                        : '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    user.role === 'business_owner'
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      : user.role === 'client'
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {user.role === 'business_owner' ? 'Negocio' : user.role === 'client' ? 'Cliente' : 'Visitor'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
