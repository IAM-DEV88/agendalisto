import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Check, Link as LinkIcon, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { FaWhatsapp, FaXTwitter, FaFacebook } from 'react-icons/fa6';

interface ShareButtonProps {
  url?: string;
  title?: string;
  description?: string;
  variant?: 'icon' | 'text' | 'full';
  className?: string;
  iconSize?: number;
}

export default function ShareButton({
  url,
  title = 'Mira esto en AgendaYa',
  description = '',
  variant = 'full',
  className = '',
  iconSize = 20,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const ddRef = useRef<HTMLDivElement>(null);

  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const measure = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const dw = 256;
    const dh = 320;
    const top = (window.innerHeight - r.bottom >= dh) ? r.bottom + 8 : Math.max(r.bottom - dh - 8, 8);
    const left = (window.innerWidth - r.left >= dw) ? r.left : Math.max(8, window.innerWidth - dw - 8);
    setPos({ top, left });
  };

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!open) measure();
    setOpen(v => !v);
  };

  const handleNativeShare = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: description || title, url: shareUrl });
        setOpen(false);
      } catch {}
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('¡Enlace copiado!');
      setTimeout(() => setCopied(false), 2000);
      setOpen(false);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const socialLinks = [
    { id: 'whatsapp', label: 'WhatsApp', icon: <FaWhatsapp className="w-5 h-5" />,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      cls: 'hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400' },
    { id: 'twitter', label: 'Twitter / X', icon: <FaXTwitter className="w-4 h-4" />,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      cls: 'hover:bg-slate-800 hover:text-white text-slate-700 dark:text-slate-300' },
    { id: 'facebook', label: 'Facebook', icon: <FaFacebook className="w-5 h-5" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      cls: 'hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400' },
  ];

  const btnCls = [
    'flex items-center gap-2 rounded-xl transition-all',
    copied ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/20'
    : open ? 'bg-primary-600 text-white shadow-md shadow-primary-200 dark:shadow-primary-900/20'
    : variant === 'icon' ? 'bg-white/20 hover:bg-white/40 text-white backdrop-blur-md'
    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700',
    variant === 'icon' ? 'p-2' : variant === 'text' ? 'px-2.5 py-1.5' : 'px-4 py-2',
    className,
  ].join(' ');

  const dropdown = open && (
    <div ref={ddRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999 }}
      className="w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl"
    >
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Compartir</span>
        <button onClick={() => setOpen(false)} aria-label="Cerrar menú de compartir" className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-2 space-y-1">
        {typeof navigator.share === 'function' && (
          <button onClick={handleNativeShare}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
              <Share2 className="w-4 h-4" />
            </span>
            Compartir vía...
          </button>
        )}
        {socialLinks.map(s => (
          <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-bold ${s.cls}`}>
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
              {s.icon}
            </span>
            {s.label}
          </a>
        ))}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
          <button onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
              <LinkIcon className="w-4 h-4" />
            </span>
            Copiar enlace
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative inline-flex">
      <button ref={btnRef} onClick={toggle} className={btnCls} title="Compartir" aria-label="Compartir">
        {variant === 'icon' ? (
          copied ? <Check style={{width: iconSize, height: iconSize}} /> : <Share2 style={{width: iconSize, height: iconSize}} />
        ) : variant === 'text' ? (
          <>{copied ? <Check style={{width: iconSize-4, height: iconSize-4}} /> : <Share2 style={{width: iconSize-4, height: iconSize-4}} />}
            <span className="font-bold text-[10px]">{copied ? 'Copiado' : 'Compartir'}</span></>
        ) : (
          <>{copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            <span className="font-bold text-sm">{copied ? '¡Copiado!' : 'Compartir'}</span></>
        )}
      </button>
      {createPortal(dropdown, document.body)}
    </div>
  );
}
