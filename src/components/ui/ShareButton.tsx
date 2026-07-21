import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Check, Link as LinkIcon, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
    const top = (window.innerHeight - r.bottom >= dh) ? r.bottom + 8 : Math.max(8, r.bottom - dh - 8);
    const rightGap = window.innerWidth - r.right;
    const left = (rightGap >= dw)
      ? r.left
      : Math.max(8, window.innerWidth - dw - 8);
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
    { id: 'whatsapp', label: 'WhatsApp',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      cls: 'hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400' },
    { id: 'twitter', label: 'Twitter / X',
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      cls: 'hover:bg-slate-800 hover:text-white text-slate-700 dark:text-slate-300' },
    { id: 'facebook', label: 'Facebook',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      cls: 'hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400' },
  ];

  const btnCls = [
    'flex items-center gap-2 rounded-lg transition-all',
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
      className="w-64 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xl"
    >
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Compartir</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú de compartir" className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-2 space-y-1">
        {typeof navigator.share === 'function' && (
          <button onClick={handleNativeShare}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm font-bold text-slate-700 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
              <Share2 className="w-4 h-4" />
            </span>
            Compartir vía...
          </button>
        )}
        {socialLinks.map(s => (
          <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            aria-label={`Compartir en ${s.label}`}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${s.cls}`}>
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700" aria-hidden="true">
              {s.icon}
            </span>
            {s.label}
          </a>
        ))}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
          <button onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm font-bold text-slate-700 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
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
      <button ref={btnRef} type="button" onClick={toggle} className={btnCls} title="Compartir" aria-label="Compartir" aria-haspopup="true" aria-expanded={open}>
        {variant === 'icon' ? (
          copied ? <Check style={{width: iconSize, height: iconSize}} /> : <Share2 style={{width: iconSize, height: iconSize}} />
        ) : variant === 'text' ? (
          <>{copied ? <Check style={{width: iconSize-4, height: iconSize-4}} /> : <Share2 style={{width: iconSize-4, height: iconSize-4}} />}
            <span className="font-bold text-[10px] hidden sm:inline">{copied ? 'Copiado' : 'Compartir'}</span></>
        ) : (
          <>{copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            <span className="font-bold text-sm">{copied ? '¡Copiado!' : 'Compartir'}</span></>
        )}
      </button>
      {createPortal(dropdown, document.body)}
    </div>
  );
}
