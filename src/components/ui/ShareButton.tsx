import { useState, useRef, useEffect } from 'react';
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

const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  title = 'Mira esto en AgendaYa',
  description = '',
  variant = 'full',
  className = '',
  iconSize = 20,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  void description;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = 320;
        setDropdownStyle({
          position: 'fixed',
          top: spaceBelow >= dropdownHeight ? rect.bottom + 8 : rect.top - dropdownHeight - 8,
          right: window.innerWidth - rect.right,
          zIndex: 9999,
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    if (isOpen) document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const handleNativeShare = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: shareUrl,
        });
        setIsOpen(false);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('¡Enlace copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const handleClick = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 320;
      setDropdownStyle({
        position: 'fixed',
        top: spaceBelow >= dropdownHeight ? rect.bottom + 8 : Math.max(rect.top - dropdownHeight - 8, 8),
        right: window.innerWidth - rect.right,
        zIndex: 9999,
      });
    }
    setIsOpen(prev => !prev);
  };

  const socialLinks = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: <FaWhatsapp className="w-5 h-5" />,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      bgColor: 'hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800/50',
    },
    {
      id: 'twitter',
      label: 'Twitter / X',
      icon: <FaXTwitter className="w-4 h-4" />,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      bgColor: 'hover:bg-slate-800 hover:text-white text-slate-700 dark:text-slate-300',
      borderColor: 'border-slate-200 dark:border-slate-700',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: <FaFacebook className="w-5 h-5" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      bgColor: 'hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800/50',
    },
  ];

  const buttonContent = () => {
    if (variant === 'icon') {
      return copied ? <Check className={`w-${iconSize/4}h-${iconSize/4}`} style={{width: iconSize, height: iconSize}} /> : <Share2 className={`w-${iconSize/4}h-${iconSize/4}`} style={{width: iconSize, height: iconSize}} />;
    }
    if (variant === 'text') {
      return (
        <>
          {copied ? <Check style={{width: iconSize-4, height: iconSize-4}} /> : <Share2 style={{width: iconSize-4, height: iconSize-4}} />}
          <span className="font-bold text-[10px]">{copied ? 'Copiado' : 'Compartir'}</span>
        </>
      );
    }
    return (
      <>
        {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
        <span className="font-bold text-sm">{copied ? '¡Copiado!' : 'Compartir'}</span>
      </>
    );
  };

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={`flex items-center gap-2 rounded-xl transition-all ${
          copied
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/20'
            : isOpen
              ? 'bg-primary-600 text-white shadow-md shadow-primary-200 dark:shadow-primary-900/20'
              : variant === 'icon'
                ? 'bg-white/20 hover:bg-white/40 text-white backdrop-blur-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
        } ${variant === 'icon' ? 'p-2' : variant === 'text' ? 'px-2.5 py-1.5' : 'px-4 py-2'} ${className}`}
        title="Compartir"
      >
        {buttonContent()}
      </button>

      {isOpen && !copied && (
        <>
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="fixed w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
          >
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Compartir</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-2 space-y-1">
              {typeof navigator.share === 'function' && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm font-bold text-slate-700 dark:text-slate-300 group"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                    <Share2 className="w-4 h-4" />
                  </span>
                  Compartir vía...
                </button>
              )}

              {socialLinks.map(social => (
                <a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-bold ${social.bgColor} group border border-transparent ${social.borderColor}`}
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform">
                    {social.icon}
                  </span>
                  {social.label}
                </a>
              ))}

              <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm font-bold text-slate-700 dark:text-slate-300 group"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform">
                    <LinkIcon className="w-4 h-4" />
                  </span>
                  Copiar enlace
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareButton;
